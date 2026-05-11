/**
 * Data service abstraction layer.
 * All data operations go through here. Currently backed by local mock data.
 *
 * When demo mode is active (`shouldUseDemo()` true), every function
 * delegates to `src/demo/demoDataService.ts`, which reads from the
 * multi-vendor seedDemoData fixture in localStorage and enforces RBAC.
 */
import {
  getDb, setDb, genId, getCurrentVendorId,
  type MockDb, type MemberRow, type PlanRow, type PaymentRow, type ExpenseRow, type LeadRow,
  type WebsiteContentRow, type GymSettingsRow, type ContactSettingsRow,
  type AppUserRow, type VendorRow, type SuperOwnerGymAccessRow,
} from '@/data/mockDb';

// Demo-mode delegation shim (no-op until demo data service is reconnected).
const useDemo = (): boolean => false;
const demo: Record<string, (...args: any[]) => any> = new Proxy({}, {
  get: () => () => { throw new Error('Demo mode not available'); },
});

// Simulate async
const delay = () => new Promise<void>(r => setTimeout(r, 50));

function db(): MockDb { return getDb(); }
function save(d: MockDb) { setDb(d); }

/** Filter rows by active vendor. If no vendor active (super_admin "All"), returns all. */
function scope<T extends { vendor_id?: string }>(rows: T[]): T[] {
  const vid = getCurrentVendorId();
  if (!vid) return rows;
  return rows.filter(r => !r.vendor_id || r.vendor_id === vid);
}
function activeVendorId(): string | undefined {
  return getCurrentVendorId() ?? undefined;
}

// ─── Plans ───
export async function getPlans(): Promise<PlanRow[]> {
  if (useDemo()) return demo.getPlans() as any;
  await delay();
  return scope([...db().plans]).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createPlan(p: { name: string; price: number; duration_days: number; category?: string; benefits?: string[]; is_highlighted?: boolean; show_on_homepage?: boolean }): Promise<PlanRow> {
  await delay();
  const row: PlanRow = { id: genId(), user_id: 'demo-user', ...p, created_at: new Date().toISOString() };
  const d = db();
  d.plans.push(row);
  save(d);
  return row;
}

export async function updatePlan(id: string, p: { name: string; price: number; duration_days: number; category?: string; benefits?: string[]; is_highlighted?: boolean; show_on_homepage?: boolean }): Promise<PlanRow> {
  if (useDemo()) return demo.updatePlan(id, p) as any;
  const d = db();
  const idx = d.plans.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Plan not found');
  d.plans[idx] = { ...d.plans[idx], ...p };
  save(d);
  return d.plans[idx];
}

export async function deletePlan(id: string): Promise<void> {
  if (useDemo()) return demo.deletePlan(id) as any;
  await delay();
  const d = db();
  d.plans = d.plans.filter(x => x.id !== id);
  save(d);
}

// ─── Members ───
export async function getMembers(): Promise<(MemberRow & { plans?: { name: string; duration_days: number } | null })[]> {
  if (useDemo()) return demo.getMembers() as any;
  const d = db();
  const today = new Date().toISOString().split('T')[0];
  return d.members
    .map(m => {
      const plan = d.plans.find(p => p.id === m.plan_id);
      return {
        ...m,
        status: m.expiry_date < today ? 'expired' : 'active',
        plans: plan ? { name: plan.name, duration_days: plan.duration_days } : null,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createMember(m: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }): Promise<MemberRow> {
  await delay();
  const row: MemberRow = { id: genId(), user_id: 'demo-user', ...m, status: 'active', created_at: new Date().toISOString() };
  const d = db();
  d.members.push(row);
  save(d);
  return row;
}

export async function updateMember(id: string, m: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }): Promise<MemberRow> {
  if (useDemo()) return demo.updateMember(id, m) as any;
  const d = db();
  const idx = d.members.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Member not found');
  const today = new Date().toISOString().split('T')[0];
  d.members[idx] = { ...d.members[idx], ...m, status: m.expiry_date < today ? 'expired' : 'active' };
  save(d);
  return d.members[idx];
}

export async function deleteMember(id: string): Promise<void> {
  if (useDemo()) return demo.deleteMember(id) as any;
  await softDelete('member', id);
}

// ─── Payments ───
export async function getPayments(): Promise<(PaymentRow & { members?: { name: string } | null })[]> {
  if (useDemo()) return demo.getPayments() as any;
  const d = db();
  return d.payments
    .map(p => {
      const member = d.members.find(m => m.id === p.member_id);
      return { ...p, members: member ? { name: member.name } : null };
    })
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}

export async function createPayment(p: { member_id: string; amount: number; payment_date: string; method: string; status: string; note?: string }): Promise<PaymentRow> {
  await delay();
  const row: PaymentRow = { id: genId(), user_id: 'demo-user', ...p, note: p.note || null, created_at: new Date().toISOString() };
  const d = db();
  d.payments.push(row);
  save(d);
  return row;
}

export async function deletePayment(id: string): Promise<void> {
  if (useDemo()) return demo.deletePayment(id) as any;
  await softDelete('payment', id);
}

export async function updatePaymentStatus(id: string, status: string): Promise<void> {
  if (useDemo()) return demo.updatePaymentStatus(id, status) as any;
  await delay();
  const d = db();
  const idx = d.payments.findIndex(x => x.id === id);
  if (idx !== -1) {
    d.payments[idx].status = status;
    save(d);
  }
}

// ─── Expenses ───
export async function getExpenses(): Promise<ExpenseRow[]> {
  if (useDemo()) return demo.getExpenses() as any;
  await delay();
  return [...db().expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date));
}

export async function createExpense(e: { title: string; amount: number; expense_date: string; category?: string }): Promise<ExpenseRow> {
  await delay();
  const row: ExpenseRow = { id: genId(), user_id: 'demo-user', ...e, category: e.category || null, created_at: new Date().toISOString() };
  const d = db();
  d.expenses.push(row);
  save(d);
  return row;
}

export async function deleteExpense(id: string): Promise<void> {
  if (useDemo()) return demo.deleteExpense(id) as any;
  await softDelete('expense', id);
}

// ─── Leads ───
export async function getLeads(): Promise<LeadRow[]> {
  if (useDemo()) return demo.getLeads() as any;
  await delay();
  return [...db().leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createLead(l: { name: string; phone: string; fitness_goal?: string; status?: string }): Promise<LeadRow> {
  await delay();
  const row: LeadRow = { id: genId(), user_id: 'demo-user', ...l, fitness_goal: l.fitness_goal || null, status: l.status || 'new', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const d = db();
  d.leads.push(row);
  save(d);
  return row;
}

export async function updateLeadStatus(id: string, status: string): Promise<void> {
  if (useDemo()) return demo.updateLeadStatus(id, status) as any;
  await delay();
  const d = db();
  const idx = d.leads.findIndex(x => x.id === id);
  if (idx !== -1) {
    d.leads[idx].status = status;
    d.leads[idx].updated_at = new Date().toISOString();
    save(d);
  }
}

export async function deleteLead(id: string): Promise<void> {
  if (useDemo()) return demo.deleteLead(id) as any;
  await softDelete('lead', id);
}

export async function convertLeadToMember(params: { leadId: string; planId: string; startDate: string; expiryDate: string; name: string; phone: string }): Promise<void> {
  if (useDemo()) return demo.convertLeadToMember(params) as any;
  const d = db();
  // Create member
  d.members.push({
    id: genId(), user_id: 'demo-user', vendor_id: activeVendorId(), name: params.name, phone: params.phone,
    plan_id: params.planId, start_date: params.startDate, expiry_date: params.expiryDate,
    status: 'active', created_at: new Date().toISOString(),
    is_deleted: false, deleted_at: null,
  });
  // Update lead status
  const idx = d.leads.findIndex(x => x.id === params.leadId);
  if (idx !== -1) {
    d.leads[idx].status = 'joined';
    d.leads[idx].updated_at = new Date().toISOString();
  }
  save(d);
}

// ─── Recycle Bin ───
export type RecycleEntityType = 'member' | 'payment' | 'lead' | 'expense';
const RECYCLE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function collectionFor(d: MockDb, type: RecycleEntityType) {
  switch (type) {
    case 'member': return d.members;
    case 'payment': return d.payments;
    case 'lead': return d.leads;
    case 'expense': return d.expenses;
  }
}

export async function softDelete(type: RecycleEntityType, id: string): Promise<void> {
  await delay();
  const d = db();
  const arr = collectionFor(d, type) as any[];
  const idx = arr.findIndex((x: any) => x.id === id);
  if (idx === -1) return;
  arr[idx].is_deleted = true;
  arr[idx].deleted_at = new Date().toISOString();
  save(d);
}

export async function restoreItem(type: RecycleEntityType, id: string): Promise<void> {
  await delay();
  const d = db();
  const arr = collectionFor(d, type) as any[];
  const idx = arr.findIndex((x: any) => x.id === id);
  if (idx === -1) return;
  arr[idx].is_deleted = false;
  arr[idx].deleted_at = null;
  save(d);
}

export async function permanentDelete(type: RecycleEntityType, id: string): Promise<void> {
  await delay();
  const d = db();
  switch (type) {
    case 'member': d.members = d.members.filter(x => x.id !== id); break;
    case 'payment': d.payments = d.payments.filter(x => x.id !== id); break;
    case 'lead': d.leads = d.leads.filter(x => x.id !== id); break;
    case 'expense': d.expenses = d.expenses.filter(x => x.id !== id); break;
  }
  save(d);
}

export interface DeletedItem {
  id: string;
  type: RecycleEntityType;
  label: string;
  subtitle?: string;
  deleted_at: string;
  expires_at: string;
  raw: any;
}

export async function getDeletedData(): Promise<DeletedItem[]> {
  await delay();
  const d = db();
  const items: DeletedItem[] = [];
  const pushItem = (type: RecycleEntityType, raw: any, label: string, subtitle?: string) => {
    if (!raw.is_deleted || !raw.deleted_at) return;
    const expires = new Date(new Date(raw.deleted_at).getTime() + RECYCLE_TTL_MS).toISOString();
    items.push({ id: raw.id, type, label, subtitle, deleted_at: raw.deleted_at, expires_at: expires, raw });
  };
  d.members.forEach(m => pushItem('member', m, m.name, m.phone));
  d.payments.forEach(p => {
    const member = d.members.find(m => m.id === p.member_id);
    pushItem('payment', p, `₹${p.amount} — ${member?.name ?? 'Unknown'}`, `${p.method} • ${p.payment_date}`);
  });
  d.leads.forEach(l => pushItem('lead', l, l.name, l.fitness_goal ?? l.status));
  d.expenses.forEach(e => pushItem('expense', e, e.title, `₹${e.amount} • ${e.category ?? 'Other'}`));
  return items.sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
}

export async function getActiveData(type: RecycleEntityType): Promise<any[]> {
  await delay();
  const d = db();
  return (collectionFor(d, type) as any[]).filter((x: any) => !x.is_deleted);
}

export function runRecycleCleanup(): number {
  const d = db();
  const now = Date.now();
  let removed = 0;
  const sweep = (arr: any[]) => arr.filter((x: any) => {
    if (!x.is_deleted || !x.deleted_at) return true;
    const expired = now - new Date(x.deleted_at).getTime() >= RECYCLE_TTL_MS;
    if (expired) { removed++; return false; }
    return true;
  });
  d.members = sweep(d.members);
  d.payments = sweep(d.payments);
  d.leads = sweep(d.leads);
  d.expenses = sweep(d.expenses);
  if (removed > 0) save(d);
  return removed;
}

// ─── Website Content ───
export async function getWebsiteContent(): Promise<WebsiteContentRow[]> {
  await delay();
  return [...db().website_content];
}

export async function getPublicWebsiteContent(): Promise<WebsiteContentRow[]> {
  await delay();
  return db().website_content.filter(r => r.is_enabled);
}

export async function upsertWebsiteSection(section_key: string, is_enabled: boolean, content: any): Promise<void> {
  await delay();
  const d = db();
  const idx = d.website_content.findIndex(x => x.section_key === section_key);
  if (idx !== -1) {
    d.website_content[idx] = { ...d.website_content[idx], is_enabled, content, updated_at: new Date().toISOString() };
  } else {
    d.website_content.push({
      id: genId(), user_id: 'demo-user', section_key, is_enabled, content,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  }
  save(d);
}

// ─── Gym Settings ───
export async function getGymSettings(): Promise<GymSettingsRow | null> {
  await delay();
  const vid = getCurrentVendorId();
  const rows = db().gym_settings;
  if (vid) return rows.find(r => r.vendor_id === vid) ?? rows[0] ?? null;
  return rows[0] || null;
}

export async function upsertGymSettings(updates: Partial<Omit<GymSettingsRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  await delay();
  const d = db();
  const vid = getCurrentVendorId();
  const idx = vid ? d.gym_settings.findIndex(r => r.vendor_id === vid) : (d.gym_settings.length > 0 ? 0 : -1);
  if (idx !== -1) {
    d.gym_settings[idx] = { ...d.gym_settings[idx], ...updates, updated_at: new Date().toISOString() };
  } else {
    d.gym_settings.push({
      id: genId(), user_id: 'demo-user', vendor_id: vid ?? undefined,
      gym_name: updates.gym_name || 'GymOS',
      logo_url: updates.logo_url || null,
      primary_color: updates.primary_color || '222 47% 11%',
      secondary_color: updates.secondary_color || '220 26% 14%',
      accent_color: updates.accent_color || '142 71% 45%',
      highlight_color: updates.highlight_color || '142 80% 55%',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  }
  save(d);
}

// ─── Contact Settings ───
export async function getContactSettings(): Promise<ContactSettingsRow | null> {
  await delay();
  const vid = getCurrentVendorId();
  const rows = db().contact_settings;
  if (vid) return rows.find(r => r.vendor_id === vid) ?? rows[0] ?? null;
  return rows[0] || null;
}

export async function upsertContactSettings(updates: Partial<Pick<ContactSettingsRow, 'whatsapp_number' | 'whatsapp_message' | 'instagram_url'>>): Promise<void> {
  await delay();
  const d = db();
  const vid = getCurrentVendorId();
  const idx = vid ? d.contact_settings.findIndex(r => r.vendor_id === vid) : (d.contact_settings.length > 0 ? 0 : -1);
  if (idx !== -1) {
    d.contact_settings[idx] = { ...d.contact_settings[idx], ...updates, updated_at: new Date().toISOString() };
  } else {
    d.contact_settings.push({
      id: genId(), user_id: 'demo-user', gym_id: null, vendor_id: vid ?? undefined,
      whatsapp_number: updates.whatsapp_number || null,
      whatsapp_message: updates.whatsapp_message || null,
      instagram_url: updates.instagram_url || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  }
  save(d);
}

// ─── Renew Membership ───
export async function renewMembership(params: { memberId: string; planId: string; durationDays: number; amount: number; currentExpiry: string; method?: string }): Promise<void> {
  if (useDemo()) return demo.renewMembership(params) as any;
  const d = db();
  const today = new Date();
  const expiryBase = new Date(params.currentExpiry) > today ? new Date(params.currentExpiry) : today;
  const newExpiry = new Date(expiryBase);
  newExpiry.setDate(newExpiry.getDate() + params.durationDays);
  const newStart = today.toISOString().split('T')[0];
  const newExpiryStr = newExpiry.toISOString().split('T')[0];

  // Create payment
  const member = d.members.find(m => m.id === params.memberId);
  d.payments.push({
    id: genId(), user_id: 'demo-user', vendor_id: member?.vendor_id, member_id: params.memberId, amount: params.amount,
    payment_date: newStart, method: params.method || 'cash', status: 'paid',
    note: 'Membership renewal', created_at: today.toISOString(),
  });

  // Update member
  const idx = d.members.findIndex(x => x.id === params.memberId);
  if (idx !== -1) {
    d.members[idx] = { ...d.members[idx], plan_id: params.planId, start_date: newStart, expiry_date: newExpiryStr, status: 'active' };
  }
  save(d);
}

// ─── Dashboard Stats ───
export async function getDashboardStats() {
  await delay();
  const d = db();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = today; // simplified

  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

  const paidThisMonth = d.payments.filter(p => p.status === 'paid' && p.payment_date >= monthStart && p.payment_date <= monthEnd);
  const monthlyRevenue = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);

  const expensesThisMonth = d.expenses.filter(e => e.expense_date >= monthStart && e.expense_date <= monthEnd);
  const totalExpenses = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

  const activeMembers = d.members.filter(m => m.expiry_date >= today).length;
  const expiringMemberships = d.members.filter(m => m.expiry_date >= today && m.expiry_date <= sevenDaysStr).length;
  const expiredMemberships = d.members.filter(m => m.expiry_date < today).length;

  const atRiskMembers = d.members.filter(m => m.expiry_date < today || (m.expiry_date >= today && m.expiry_date <= sevenDaysStr));
  const revenueAtRisk = atRiskMembers.reduce((sum, m) => {
    const plan = d.plans.find(p => p.id === m.plan_id);
    return sum + (plan?.price ?? 0);
  }, 0);

  const todayNewMembers = d.members.filter(m => m.created_at?.startsWith(today)).length;
  const todayPaymentsData = paidThisMonth.filter(p => p.payment_date === today);
  const todayPayments = todayPaymentsData.length;
  const todayPaymentsAmount = todayPaymentsData.reduce((sum, p) => sum + p.amount, 0);
  const todayLeads = d.leads.filter(l => l.created_at?.startsWith(today)).length;

  const monthNewMembers = d.members.filter(m => m.created_at >= monthStart).length;

  const totalLeads = d.leads.length;
  const newLeads = d.leads.filter(l => l.status === 'new').length;
  const convertedLeads = d.leads.filter(l => l.status === 'joined').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const pendingPayments = d.payments.filter(p => p.status === 'pending').length;
  const overdueCount = d.payments.filter(p => p.status === 'overdue').length;
  const totalPendingAmount = d.payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  const recentPayments = d.payments
    .filter(p => p.status === 'paid')
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
    .slice(0, 5)
    .map(p => {
      const member = d.members.find(m => m.id === p.member_id);
      return { member_name: member?.name ?? 'Unknown', amount: p.amount, date: p.payment_date };
    });

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

// ─── Revenue Chart ───
export async function getRevenueChart() {
  await delay();
  const d = db();
  const now = new Date();
  const months: { month: string; revenue: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const yearMonth = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const revenue = d.payments
      .filter(p => p.status === 'paid' && p.payment_date.startsWith(yearMonth))
      .reduce((sum, p) => sum + p.amount, 0);
    months.push({ month: monthStr, revenue });
  }
  return months;
}

// ─── Setup Detection ───
export async function hasAnyData(): Promise<boolean> {
  if (useDemo()) return demo.hasAnyData() as any;
  await delay();
  return db().plans.length > 0;
}

// ─── Stub exports (build-compat layer) ─────────────────────────────────────
// These keep the codebase compiling while the multi-vendor / trainer / super-owner
// features are being wired up. They return empty data so the UI degrades cleanly.

export interface AnalyticsResult {
  totalRevenue: number;
  ptRevenue: number;
  membershipRevenue: number;
  totalExpenses: number;
  profit: number;
  newMembers: number;
  activePtMembers: number;
  ptSessionsCompleted: number;
  series: { date: string; revenue: number; expenses: number; newMembers: number }[];
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    netProfit: number;
    newMembers: number;
    activeMembers: number;
    membersLeft: number;
    ptRevenue: number;
    membershipRevenue: number;
    activePtMembers: number;
    ptSessionsCompleted: number;
    pendingPayments: number;
    pendingAmount: number;
    newLeads: number;
    convertedLeads: number;
    avgRevenuePerDay: number;
    avgNewMembersPerDay: number;
    [key: string]: any;
  };
  topDay: { date: string; revenue: number; label?: string } | null;
  planDistribution: { plan: string; name?: string; count: number; value?: number }[];
  expenseBreakdown: { category: string; name?: string; amount: number; value?: number }[];
}

export interface Trainer {
  id: string; user_id: string; vendor_id?: string;
  name: string; phone?: string; specialization?: string;
  image_url?: string | null; is_active: boolean;
  hourly_rate?: number; bio?: string | null;
  experience?: string | number | null;
  created_at: string;
}
export interface TrainerAssignment {
  id: string; trainer_id: string; member_id: string;
  total_sessions: number; sessions_completed: number;
  price: number; start_date: string; end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}
export interface TrainerSession {
  id: string; assignment_id: string; trainer_id: string; member_id: string;
  session_date: string;
  date?: string;
  status: 'scheduled' | 'completed' | 'missed';
  notes?: string | null;
  created_at: string;
}

export async function getAnalytics(_range: { from: string; to: string }, _gran: 'day' | 'month' = 'day'): Promise<AnalyticsResult> {
  await delay();
  return {
    totalRevenue: 0, ptRevenue: 0, membershipRevenue: 0,
    totalExpenses: 0, profit: 0,
    newMembers: 0, activePtMembers: 0, ptSessionsCompleted: 0,
    series: [],
    kpis: {
      totalRevenue: 0, totalExpenses: 0, profit: 0, netProfit: 0,
      newMembers: 0, activeMembers: 0, membersLeft: 0,
      ptRevenue: 0, membershipRevenue: 0,
      activePtMembers: 0, ptSessionsCompleted: 0,
      pendingPayments: 0, pendingAmount: 0,
      newLeads: 0, convertedLeads: 0,
      avgRevenuePerDay: 0, avgNewMembersPerDay: 0,
    },
    topDay: null,
    planDistribution: [],
    expenseBreakdown: [],
  };
}

export async function getAppUsers(): Promise<AppUserRow[]> { await delay(); return []; }
export async function getVendors(): Promise<VendorRow[]> { await delay(); return []; }
export async function getSuperOwners(): Promise<AppUserRow[]> { await delay(); return []; }
export async function getSuperOwnerAccess(): Promise<SuperOwnerGymAccessRow[]> { await delay(); return []; }
export async function getSuperOwnerGyms(_superOwnerId: string): Promise<VendorRow[]> { await delay(); return []; }
export async function getSuperOwnerAnalytics(_superOwnerId: string, _filter: string | 'all'): Promise<{
  combined: {
    monthlyRevenue: number; activeMembers: number; totalMembers: number;
    pendingPayments: number; pendingAmount: number;
    newLeads: number; convertedLeads: number; totalGyms: number;
  };
  revenueTrend: { month: string; revenue: number }[];
  perVendor: { vendor: VendorRow; revenue: number; members: number; activeMembers: number; overdue: number; leads: number }[];
}> {
  await delay();
  return {
    combined: {
      monthlyRevenue: 0, activeMembers: 0, totalMembers: 0,
      pendingPayments: 0, pendingAmount: 0,
      newLeads: 0, convertedLeads: 0, totalGyms: 0,
    },
    revenueTrend: [],
    perVendor: [],
  };
}
export async function assignGymToSuperOwner(_superOwnerId: string, _vendorId: string): Promise<void> { await delay(); }
export async function removeGymFromSuperOwner(_superOwnerId: string, _vendorId: string): Promise<void> { await delay(); }

// Trainer stubs
export async function getTrainers(): Promise<Trainer[]> { await delay(); return []; }
export async function getTrainerAssignments(): Promise<TrainerAssignment[]> { await delay(); return []; }
export async function getTrainerSessions(): Promise<TrainerSession[]> { await delay(); return []; }
export async function createTrainer(_t: Partial<Trainer>): Promise<Trainer> {
  await delay();
  return { id: genId(), user_id: 'demo-user', name: _t.name ?? '', is_active: true, created_at: new Date().toISOString(), ..._t } as Trainer;
}
export async function updateTrainer(id: string, _patch: Partial<Trainer>): Promise<void> { await delay(); }
export async function deleteTrainer(_id: string): Promise<void> { await delay(); }
export async function createTrainerAssignment(_a: {
  trainer_id: string; member_id: string; total_sessions: number;
  price: number; start_date: string; end_date: string;
}): Promise<void> { await delay(); }
export async function deleteTrainerAssignment(_id: string): Promise<void> { await delay(); }
export async function markTrainerSession(_p: {
  assignment_id: string; status: 'completed' | 'missed';
}): Promise<void> { await delay(); }
