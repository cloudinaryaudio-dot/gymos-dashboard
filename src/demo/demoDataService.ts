/**
 * Demo Data Service — vendor-aware reads/writes against localStorage.
 *
 * Mirrors the surface of `src/services/dataService.ts` but:
 *   • Reads from `demoStore` (gymos_* keys hydrated from seedDemoData)
 *   • Filters by the current user's vendor scope (super_admin sees all)
 *   • Adapts seed schema → app schema:
 *       seed:  Member.join_date    Payment.date       Lead.goal       Expense.date
 *       app:   start_date          payment_date       fitness_goal    expense_date
 *   • Enforces RBAC via permissions.ts (write-side).
 *
 * dataService.ts delegates to this module when isDemoActive() returns true.
 */
import { demoStore, emitDemoChange } from './storage';
import { isDemoActive } from './seedAdapter';
import { checkPermission, getCurrentUser, getVendorScope } from './permissions';
import type {
  DemoMember, DemoPayment, DemoLead, DemoExpense, DemoPlan,
} from './types';

// ───────── helpers ─────────

const delay = () => new Promise<void>(r => setTimeout(r, 30));

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

/** Return rows scoped to the current user's vendor; super_admin gets everything. */
function scope<T extends { vendor_id: string }>(rows: T[]): T[] {
  const user = getCurrentUser();
  const vendorId = getVendorScope(user);
  if (!vendorId) return rows; // super_admin
  return rows.filter(r => r.vendor_id === vendorId);
}

function activeVendorId(): string {
  const user = getCurrentUser();
  if (!user) throw new Error('No active demo user');
  if (user.role === 'super_admin') {
    // super_admin writes are routed to first vendor as default
    const first = demoStore.getVendors()[0];
    if (!first) throw new Error('No vendors in demo dataset');
    return first.id;
  }
  if (!user.vendor_id) throw new Error('User has no vendor scope');
  return user.vendor_id;
}

function require(module: Parameters<typeof checkPermission>[1], action: 'view' | 'edit') {
  const user = getCurrentUser();
  if (!checkPermission(user, module, action)) {
    throw new Error(`Permission denied: ${module}:${action}`);
  }
}

// ───────── adapters: seed shape → app shape ─────────

function adaptMember(m: DemoMember, plans: DemoPlan[]) {
  const plan = plans.find(p => p.id === m.plan_id);
  const today = todayStr();
  return {
    id: m.id,
    user_id: m.vendor_id, // legacy field
    vendor_id: m.vendor_id,
    name: m.name,
    phone: m.phone,
    plan_id: m.plan_id,
    start_date: m.join_date,
    expiry_date: m.expiry_date,
    status: m.expiry_date < today ? 'expired' : 'active',
    created_at: new Date(m.join_date).toISOString(),
    is_deleted: false,
    deleted_at: null,
    plans: plan ? { name: plan.name, duration_days: plan.duration_days } : null,
  };
}

function adaptPayment(p: DemoPayment, members: DemoMember[]) {
  const member = members.find(mm => mm.id === p.member_id);
  return {
    id: p.id,
    user_id: p.vendor_id,
    vendor_id: p.vendor_id,
    member_id: p.member_id,
    amount: p.amount,
    payment_date: p.date,
    method: p.method,
    status: p.status,
    note: null,
    created_at: new Date(p.date).toISOString(),
    is_deleted: false,
    deleted_at: null,
    members: member ? { name: member.name } : null,
  };
}

function adaptLead(l: DemoLead) {
  return {
    id: l.id,
    user_id: l.vendor_id,
    vendor_id: l.vendor_id,
    name: l.name,
    phone: l.phone,
    fitness_goal: l.goal,
    // seed uses 'converted' — map to app's 'joined'
    status: l.status === 'converted' ? 'joined' : l.status,
    created_at: l.created_at,
    updated_at: l.created_at,
    is_deleted: false,
    deleted_at: null,
  };
}

function adaptExpense(e: DemoExpense) {
  return {
    id: e.id,
    user_id: e.vendor_id,
    vendor_id: e.vendor_id,
    title: e.title,
    amount: e.amount,
    expense_date: e.date,
    category: e.category,
    created_at: new Date(e.date).toISOString(),
    is_deleted: false,
    deleted_at: null,
  };
}

function adaptPlan(p: DemoPlan) {
  return {
    id: p.id,
    user_id: p.vendor_id,
    vendor_id: p.vendor_id,
    name: p.name,
    price: p.price,
    duration_days: p.duration_days,
    category: p.category,
    benefits: [] as string[],
    is_highlighted: false,
    show_on_homepage: true,
    created_at: new Date().toISOString(),
  };
}

// ───────── public guard ─────────
export function shouldUseDemo(): boolean {
  return isDemoActive();
}

// ───────── Plans ─────────
export async function getPlans() {
  await delay();
  require('settings', 'view'); // plans visible everywhere — soft gate
  return scope(demoStore.getPlans()).map(adaptPlan);
}

export async function createPlan(p: { name: string; price: number; duration_days: number; category?: string }) {
  await delay();
  require('settings', 'edit');
  const plan: DemoPlan = {
    id: genId('plan'),
    vendor_id: activeVendorId(),
    name: p.name,
    price: p.price,
    duration_days: p.duration_days,
    category: (p.category as DemoPlan['category']) ?? 'Monthly',
  };
  demoStore.setPlans([...demoStore.getPlans(), plan]);
  emitDemoChange();
  return adaptPlan(plan);
}

export async function updatePlan(id: string, p: { name: string; price: number; duration_days: number; category?: string }) {
  await delay();
  require('settings', 'edit');
  const all = demoStore.getPlans();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Plan not found');
  all[idx] = { ...all[idx], name: p.name, price: p.price, duration_days: p.duration_days, category: (p.category as DemoPlan['category']) ?? all[idx].category };
  demoStore.setPlans(all);
  emitDemoChange();
  return adaptPlan(all[idx]);
}

export async function deletePlan(id: string) {
  await delay();
  require('settings', 'edit');
  demoStore.setPlans(demoStore.getPlans().filter(x => x.id !== id));
  emitDemoChange();
}

// ───────── Members ─────────
export async function getMembers() {
  await delay();
  require('members', 'view');
  const plans = demoStore.getPlans();
  return scope(demoStore.getMembers())
    .map(m => adaptMember(m, plans))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createMember(m: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) {
  await delay();
  require('members', 'edit');
  const row: DemoMember = {
    id: genId('member'),
    vendor_id: activeVendorId(),
    name: m.name,
    phone: m.phone,
    plan_id: m.plan_id,
    status: m.expiry_date < todayStr() ? 'expired' : 'active',
    join_date: m.start_date,
    expiry_date: m.expiry_date,
  };
  demoStore.setMembers([...demoStore.getMembers(), row]);
  emitDemoChange();
  return adaptMember(row, demoStore.getPlans());
}

export async function updateMember(id: string, m: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) {
  await delay();
  require('members', 'edit');
  const all = demoStore.getMembers();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Member not found');
  all[idx] = {
    ...all[idx],
    name: m.name, phone: m.phone, plan_id: m.plan_id,
    join_date: m.start_date, expiry_date: m.expiry_date,
    status: m.expiry_date < todayStr() ? 'expired' : 'active',
  };
  demoStore.setMembers(all);
  emitDemoChange();
  return adaptMember(all[idx], demoStore.getPlans());
}

export async function deleteMember(id: string) {
  await delay();
  require('members', 'edit');
  demoStore.setMembers(demoStore.getMembers().filter(x => x.id !== id));
  emitDemoChange();
}

// ───────── Payments ─────────
export async function getPayments() {
  await delay();
  require('payments', 'view');
  const members = demoStore.getMembers();
  return scope(demoStore.getPayments())
    .map(p => adaptPayment(p, members))
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}

export async function createPayment(p: { member_id: string; amount: number; payment_date: string; method: string; status: string; note?: string }) {
  await delay();
  require('payments', 'edit');
  const row: DemoPayment = {
    id: genId('pay'),
    vendor_id: activeVendorId(),
    member_id: p.member_id,
    amount: p.amount,
    status: p.status as DemoPayment['status'],
    date: p.payment_date,
    method: p.method as DemoPayment['method'],
  };
  demoStore.setPayments([...demoStore.getPayments(), row]);
  emitDemoChange();
  return adaptPayment(row, demoStore.getMembers());
}

export async function deletePayment(id: string) {
  await delay();
  require('payments', 'edit');
  demoStore.setPayments(demoStore.getPayments().filter(x => x.id !== id));
  emitDemoChange();
}

export async function updatePaymentStatus(id: string, status: string) {
  await delay();
  require('payments', 'edit');
  const all = demoStore.getPayments();
  const idx = all.findIndex(x => x.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], status: status as DemoPayment['status'] };
    demoStore.setPayments(all);
    emitDemoChange();
  }
}

// ───────── Expenses ─────────
export async function getExpenses() {
  await delay();
  require('expenses', 'view');
  return scope(demoStore.getExpenses())
    .map(adaptExpense)
    .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
}

export async function createExpense(e: { title: string; amount: number; expense_date: string; category?: string }) {
  await delay();
  require('expenses', 'edit');
  const row: DemoExpense = {
    id: genId('exp'),
    vendor_id: activeVendorId(),
    title: e.title,
    amount: e.amount,
    date: e.expense_date,
    category: (e.category as DemoExpense['category']) ?? 'Utilities',
  };
  demoStore.setExpenses([...demoStore.getExpenses(), row]);
  emitDemoChange();
  return adaptExpense(row);
}

export async function deleteExpense(id: string) {
  await delay();
  require('expenses', 'edit');
  demoStore.setExpenses(demoStore.getExpenses().filter(x => x.id !== id));
  emitDemoChange();
}

// ───────── Leads ─────────
export async function getLeads() {
  await delay();
  require('leads', 'view');
  return scope(demoStore.getLeads())
    .map(adaptLead)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createLead(l: { name: string; phone: string; fitness_goal?: string; status?: string }) {
  await delay();
  require('leads', 'edit');
  const row: DemoLead = {
    id: genId('lead'),
    vendor_id: activeVendorId(),
    name: l.name,
    phone: l.phone,
    goal: l.fitness_goal ?? 'General Fitness',
    status: ((l.status === 'joined' ? 'converted' : l.status) as DemoLead['status']) ?? 'new',
    created_at: nowIso(),
  };
  demoStore.setLeads([...demoStore.getLeads(), row]);
  emitDemoChange();
  return adaptLead(row);
}

export async function updateLeadStatus(id: string, status: string) {
  await delay();
  require('leads', 'edit');
  const all = demoStore.getLeads();
  const idx = all.findIndex(x => x.id === id);
  if (idx !== -1) {
    const seedStatus = status === 'joined' ? 'converted' : status;
    all[idx] = { ...all[idx], status: seedStatus as DemoLead['status'] };
    demoStore.setLeads(all);
    emitDemoChange();
  }
}

export async function deleteLead(id: string) {
  await delay();
  require('leads', 'edit');
  demoStore.setLeads(demoStore.getLeads().filter(x => x.id !== id));
  emitDemoChange();
}

export async function convertLeadToMember(params: { leadId: string; planId: string; startDate: string; expiryDate: string; name: string; phone: string }) {
  await delay();
  require('members', 'edit');
  require('leads', 'edit');
  const vendorId = activeVendorId();
  const newMember: DemoMember = {
    id: genId('member'),
    vendor_id: vendorId,
    name: params.name,
    phone: params.phone,
    plan_id: params.planId,
    status: 'new',
    join_date: params.startDate,
    expiry_date: params.expiryDate,
  };
  demoStore.setMembers([...demoStore.getMembers(), newMember]);
  const leads = demoStore.getLeads();
  const li = leads.findIndex(l => l.id === params.leadId);
  if (li !== -1) {
    leads[li] = { ...leads[li], status: 'converted' };
    demoStore.setLeads(leads);
  }
  emitDemoChange();
}

// ───────── Renew ─────────
export async function renewMembership(params: { memberId: string; planId: string; durationDays: number; amount: number; currentExpiry: string; method?: string }) {
  await delay();
  require('members', 'edit');
  require('payments', 'edit');
  const today = new Date();
  const expiryBase = new Date(params.currentExpiry) > today ? new Date(params.currentExpiry) : today;
  const newExpiry = new Date(expiryBase);
  newExpiry.setDate(newExpiry.getDate() + params.durationDays);
  const newStart = today.toISOString().slice(0, 10);
  const newExpiryStr = newExpiry.toISOString().slice(0, 10);

  const members = demoStore.getMembers();
  const mi = members.findIndex(m => m.id === params.memberId);
  if (mi !== -1) {
    members[mi] = {
      ...members[mi],
      plan_id: params.planId,
      join_date: newStart,
      expiry_date: newExpiryStr,
      status: 'active',
    };
    demoStore.setMembers(members);
  }
  const member = members[mi];
  demoStore.setPayments([
    ...demoStore.getPayments(),
    {
      id: genId('pay'),
      vendor_id: member?.vendor_id ?? activeVendorId(),
      member_id: params.memberId,
      amount: params.amount,
      status: 'paid',
      date: newStart,
      method: (params.method as DemoPayment['method']) ?? 'cash',
    },
  ]);
  emitDemoChange();
}

// ───────── Dashboard / Analytics ─────────
export async function getDashboardStats() {
  await delay();
  require('reports', 'view');
  const today = todayStr();
  const monthStart = `${today.slice(0, 7)}-01`;
  const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7);
  const sevenDaysStr = sevenDays.toISOString().slice(0, 10);

  const members = scope(demoStore.getMembers());
  const payments = scope(demoStore.getPayments());
  const expenses = scope(demoStore.getExpenses());
  const leads = scope(demoStore.getLeads());
  const plans = demoStore.getPlans();

  const paidThisMonth = payments.filter(p => p.status === 'paid' && p.date >= monthStart && p.date <= today);
  const monthlyRevenue = paidThisMonth.reduce((s, p) => s + p.amount, 0);
  const expensesThisMonth = expenses.filter(e => e.date >= monthStart && e.date <= today);
  const totalExpenses = expensesThisMonth.reduce((s, e) => s + e.amount, 0);

  const activeMembers = members.filter(m => m.expiry_date >= today).length;
  const expiringMemberships = members.filter(m => m.expiry_date >= today && m.expiry_date <= sevenDaysStr).length;
  const expiredMemberships = members.filter(m => m.expiry_date < today).length;

  const atRisk = members.filter(m => m.expiry_date < today || (m.expiry_date >= today && m.expiry_date <= sevenDaysStr));
  const revenueAtRisk = atRisk.reduce((s, m) => s + (plans.find(p => p.id === m.plan_id)?.price ?? 0), 0);

  const todayNewMembers = members.filter(m => m.join_date === today).length;
  const todayPaymentsList = paidThisMonth.filter(p => p.date === today);
  const todayPayments = todayPaymentsList.length;
  const todayPaymentsAmount = todayPaymentsList.reduce((s, p) => s + p.amount, 0);
  const todayLeads = leads.filter(l => l.created_at.startsWith(today)).length;
  const monthNewMembers = members.filter(m => m.join_date >= monthStart).length;

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const totalPendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  const memberMap = new Map(members.map(m => [m.id, m.name]));
  const recentPayments = payments
    .filter(p => p.status === 'paid')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(p => ({ member_name: memberMap.get(p.member_id) ?? 'Unknown', amount: p.amount, date: p.date }));

  return {
    monthlyRevenue, totalExpenses, profit: monthlyRevenue - totalExpenses,
    activeMembers, expiringMemberships, expiredMemberships,
    pendingPayments, overdueCount, totalPendingAmount,
    newLeads, totalLeads, convertedLeads, conversionRate,
    recentPayments,
    todayNewMembers, todayPayments, todayPaymentsAmount, todayLeads,
    monthNewMembers, revenueAtRisk,
  };
}

export async function getRevenueChart() {
  await delay();
  require('reports', 'view');
  const payments = scope(demoStore.getPayments());
  const now = new Date();
  const months: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const revenue = payments.filter(p => p.status === 'paid' && p.date.startsWith(ym)).reduce((s, p) => s + p.amount, 0);
    months.push({ month: monthStr, revenue });
  }
  return months;
}

export async function hasAnyData() {
  return demoStore.getPlans().length > 0;
}

// ───────── Recycle bin (no-op in demo: hard-delete only) ─────────
export async function getDeletedData() { await delay(); return []; }
export async function getActiveData() { await delay(); return []; }
export async function softDelete() { /* not used in demo */ }
export async function restoreItem() { /* not used in demo */ }
export async function permanentDelete() { /* not used in demo */ }
export function runRecycleCleanup() { return 0; }

// ───────── Analytics (time-range) ─────────
export async function getAnalytics(range: { from: string; to: string }, granularity: 'day' | 'month' = 'day') {
  await delay();
  require('reports', 'view');
  const members = scope(demoStore.getMembers());
  const payments = scope(demoStore.getPayments());
  const expenses = scope(demoStore.getExpenses());
  const leads = scope(demoStore.getLeads());
  const plans = demoStore.getPlans();

  const { from, to } = range;
  const inRange = (d: string) => d >= from && d <= to;
  const inRangeIso = (iso: string) => { const day = iso.slice(0, 10); return day >= from && day <= to; };

  const paid = payments.filter(p => p.status === 'paid' && inRange(p.date));
  const totalRevenue = paid.reduce((s, p) => s + p.amount, 0);
  const exp = expenses.filter(e => inRange(e.date));
  const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);

  const newMembersList = members.filter(m => inRange(m.join_date));
  const newMembers = newMembersList.length;
  const today = todayStr();
  const membersLeft = members.filter(m => inRange(m.expiry_date) && m.expiry_date < today).length;
  const activeMembers = members.filter(m => m.expiry_date >= today).length;

  const pendingList = payments.filter(p => (p.status === 'pending' || p.status === 'overdue') && inRange(p.date));
  const pendingPayments = pendingList.length;
  const pendingAmount = pendingList.reduce((s, p) => s + p.amount, 0);

  const leadsInRange = leads.filter(l => inRangeIso(l.created_at));
  const newLeads = leadsInRange.length;
  const convertedLeads = leadsInRange.filter(l => l.status === 'converted').length;

  // buckets
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);
  const buckets: { label: string; start: string; end: string }[] = [];
  if (granularity === 'day') {
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const day = cur.toISOString().slice(0, 10);
      buckets.push({ label: cur.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), start: day, end: day });
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    while (cur <= toDate) {
      const start = new Date(cur);
      const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      buckets.push({
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  const series = buckets.map(b => ({
    label: b.label,
    revenue: payments.filter(p => p.status === 'paid' && p.date >= b.start && p.date <= b.end).reduce((s, p) => s + p.amount, 0),
    expenses: expenses.filter(e => e.date >= b.start && e.date <= b.end).reduce((s, e) => s + e.amount, 0),
    newMembers: members.filter(m => m.join_date >= b.start && m.join_date <= b.end).length,
  }));
  const topDay = series.length ? series.reduce((best, cur) => cur.revenue > best.revenue ? cur : best, series[0]) : undefined;

  const planCount: Record<string, number> = {};
  newMembersList.forEach(m => {
    const plan = plans.find(p => p.id === m.plan_id);
    const k = plan?.name ?? 'Unknown';
    planCount[k] = (planCount[k] ?? 0) + 1;
  });
  const planDistribution = Object.entries(planCount).map(([name, value]) => ({ name, value }));

  const catCount: Record<string, number> = {};
  exp.forEach(e => { catCount[e.category] = (catCount[e.category] ?? 0) + e.amount; });
  const expenseBreakdown = Object.entries(catCount).map(([name, value]) => ({ name, value }));

  const memberMap = new Map(members.map(m => [m.id, m.name]));
  const memberRows = newMembersList.map(m => {
    const plan = plans.find(p => p.id === m.plan_id);
    return {
      id: m.id, name: m.name, phone: m.phone,
      plan: plan?.name ?? '—',
      start_date: m.join_date, expiry_date: m.expiry_date,
      status: m.expiry_date < today ? 'expired' : 'active',
    };
  });
  const paymentRows = payments
    .filter(p => inRange(p.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(p => ({
      id: p.id, member_name: memberMap.get(p.member_id) ?? 'Unknown',
      amount: p.amount, payment_date: p.date, method: p.method, status: p.status,
    }));
  const leadRows = leadsInRange
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(l => ({ id: l.id, name: l.name, phone: l.phone, goal: l.goal, status: l.status === 'converted' ? 'joined' : l.status, created_at: l.created_at }));

  return {
    kpis: {
      totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses,
      newMembers, membersLeft, activeMembers,
      pendingPayments, pendingAmount,
      newLeads, convertedLeads,
    },
    series, planDistribution, expenseBreakdown,
    members: memberRows, payments: paymentRows, leads: leadRows,
    topDay: topDay ? { label: topDay.label, revenue: topDay.revenue } : undefined,
  };
}
