/**
 * Super Owner service — multi-gym aggregation + assignment management.
 * All reads/writes go through demoStore (localStorage) for demo mode parity.
 */
import { demoStore, emitDemoChange } from './storage';
import type { DemoUser, SuperOwnerAccess, Vendor } from './types';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface PerGymStats {
  vendor_id: string;
  vendor_name: string;
  city: string;
  members: number;
  active_members: number;
  revenue: number;        // paid amount this month
  pending: number;        // pending + overdue count
  overdue_amount: number; // sum of overdue
  leads: number;
  expenses: number;
}

export interface SuperOwnerAnalytics {
  totals: {
    revenue: number;
    members: number;
    activeMembers: number;
    pendingCount: number;
    overdueAmount: number;
    leads: number;
    expenses: number;
    profit: number;
    ptRevenue: number;
  };
  perGym: PerGymStats[];
  monthlyRevenue: { month: string; revenue: number; expenses: number }[];
  gymComparison: { name: string; revenue: number; members: number }[];
}

export function getAllSuperOwners(): DemoUser[] {
  return demoStore.getSuperOwners();
}

export function getSuperOwnerGyms(superOwnerId: string): Vendor[] {
  const access = demoStore.getSuperOwnerAccess()
    .filter(a => a.super_owner_id === superOwnerId)
    .map(a => a.vendor_id);
  const set = new Set(access);
  return demoStore.getVendors().filter(v => set.has(v.id));
}

export function getSuperOwnerAccess(superOwnerId?: string): SuperOwnerAccess[] {
  const all = demoStore.getSuperOwnerAccess();
  if (!superOwnerId) return all;
  return all.filter(a => a.super_owner_id === superOwnerId);
}

export function assignGymToSuperOwner(superOwnerId: string, vendorId: string): void {
  const all = demoStore.getSuperOwnerAccess();
  if (all.some(a => a.super_owner_id === superOwnerId && a.vendor_id === vendorId)) return;
  all.push({
    id: genId('soacc'),
    super_owner_id: superOwnerId,
    vendor_id: vendorId,
    assigned_at: new Date().toISOString(),
  });
  demoStore.setSuperOwnerAccess(all);
  emitDemoChange();
}

export function removeGymFromSuperOwner(superOwnerId: string, vendorId: string): void {
  const next = demoStore.getSuperOwnerAccess()
    .filter(a => !(a.super_owner_id === superOwnerId && a.vendor_id === vendorId));
  demoStore.setSuperOwnerAccess(next);
  emitDemoChange();
}

export function setActiveSuperOwnerVendor(vendorId: string | null): void {
  demoStore.setSuperOwnerActiveVendor(vendorId);
  emitDemoChange();
}

export function getActiveSuperOwnerVendor(): string | null {
  return demoStore.getSuperOwnerActiveVendor();
}

/** Aggregate analytics across the super owner's assigned gyms (or single selected gym). */
export function getSuperOwnerAnalytics(superOwnerId: string, vendorFilter: string | null = null): SuperOwnerAnalytics {
  const gyms = getSuperOwnerGyms(superOwnerId);
  const allowed = new Set(gyms.map(g => g.id));
  const targetIds = vendorFilter && allowed.has(vendorFilter) ? new Set([vendorFilter]) : allowed;

  const members  = demoStore.getMembers().filter(m => targetIds.has(m.vendor_id));
  const payments = demoStore.getPayments().filter(p => targetIds.has(p.vendor_id));
  const leads    = demoStore.getLeads().filter(l => targetIds.has(l.vendor_id));
  const expenses = demoStore.getExpenses().filter(e => targetIds.has(e.vendor_id));
  const ptAssignments = demoStore.getTrainerAssignments().filter(a => targetIds.has(a.vendor_id));

  const today = todayStr();
  const monthStart = `${today.slice(0, 7)}-01`;

  const paidThisMonth = payments.filter(p => p.status === 'paid' && p.date >= monthStart && p.date <= today);
  const revenue = paidThisMonth.reduce((s, p) => s + p.amount, 0);
  const expensesThisMonth = expenses.filter(e => e.date >= monthStart && e.date <= today);
  const totalExpenses = expensesThisMonth.reduce((s, e) => s + e.amount, 0);
  const ptRevenue = ptAssignments.reduce((s, a) => s + a.price, 0);

  const activeMembers = members.filter(m => m.expiry_date >= today).length;
  const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;
  const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  // Per-gym breakdown (always over assigned set, ignoring filter so comparison shows all)
  const perGym: PerGymStats[] = gyms.map(v => {
    const m = members.filter(x => x.vendor_id === v.id);
    const p = payments.filter(x => x.vendor_id === v.id);
    const e = expenses.filter(x => x.vendor_id === v.id);
    const l = leads.filter(x => x.vendor_id === v.id);
    return {
      vendor_id: v.id,
      vendor_name: v.name,
      city: v.city,
      members: m.length,
      active_members: m.filter(x => x.expiry_date >= today).length,
      revenue: p.filter(x => x.status === 'paid' && x.date >= monthStart).reduce((s, x) => s + x.amount, 0),
      pending: p.filter(x => x.status === 'pending' || x.status === 'overdue').length,
      overdue_amount: p.filter(x => x.status === 'overdue').reduce((s, x) => s + x.amount, 0),
      leads: l.length,
      expenses: e.filter(x => x.date >= monthStart).reduce((s, x) => s + x.amount, 0),
    };
  });

  // Last 6 months trend
  const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
    const rev = payments.filter(p => p.status === 'paid' && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    const exp = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    monthlyRevenue.push({ month: monthLabel, revenue: rev, expenses: exp });
  }

  const gymComparison = perGym.map(g => ({ name: g.vendor_name, revenue: g.revenue, members: g.members }));

  return {
    totals: {
      revenue,
      members: members.length,
      activeMembers,
      pendingCount,
      overdueAmount,
      leads: leads.length,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      ptRevenue,
    },
    perGym,
    monthlyRevenue,
    gymComparison,
  };
}
