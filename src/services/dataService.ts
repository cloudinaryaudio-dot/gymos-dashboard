/**
 * Data service abstraction layer.
 * All data operations go through here. Currently backed by local mock data.
 *
 * When demo mode is active (`shouldUseDemo()` true), every function
 * delegates to `src/demo/demoDataService.ts`, which reads from the
 * multi-vendor seedDemoData fixture in localStorage and enforces RBAC.
 */
import { getDb, setDb, genId, type MockDb, type MemberRow, type PlanRow, type PaymentRow, type ExpenseRow, type LeadRow, type WebsiteContentRow, type GymSettingsRow, type ContactSettingsRow } from '@/data/mockDb';
import * as demo from '@/demo/demoDataService';

const useDemo = () => demo.shouldUseDemo();

// Simulate async
const delay = () => new Promise<void>(r => setTimeout(r, 50));

function db(): MockDb { return getDb(); }
function save(d: MockDb) { setDb(d); }

// ─── Plans ───
export async function getPlans(): Promise<PlanRow[]> {
  if (useDemo()) return demo.getPlans() as any;
  await delay();
  return [...db().plans].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createPlan(p: { name: string; price: number; duration_days: number; category?: string; benefits?: string[]; is_highlighted?: boolean; show_on_homepage?: boolean }): Promise<PlanRow> {
  if (useDemo()) return demo.createPlan(p) as any;
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
    .filter(m => !m.is_deleted)
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
  if (useDemo()) return demo.createMember(m) as any;
  const row: MemberRow = { id: genId(), user_id: 'demo-user', ...m, status: 'active', created_at: new Date().toISOString(), is_deleted: false, deleted_at: null };
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
    .filter(p => !p.is_deleted)
    .map(p => {
      const member = d.members.find(m => m.id === p.member_id);
      return { ...p, members: member ? { name: member.name } : null };
    })
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}

export async function createPayment(p: { member_id: string; amount: number; payment_date: string; method: string; status: string; note?: string }): Promise<PaymentRow> {
  if (useDemo()) return demo.createPayment(p) as any;
  const row: PaymentRow = { id: genId(), user_id: 'demo-user', ...p, note: p.note || null, created_at: new Date().toISOString(), is_deleted: false, deleted_at: null };
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
  return [...db().expenses].filter(e => !e.is_deleted).sort((a, b) => b.expense_date.localeCompare(a.expense_date));
}

export async function createExpense(e: { title: string; amount: number; expense_date: string; category?: string }): Promise<ExpenseRow> {
  if (useDemo()) return demo.createExpense(e) as any;
  const row: ExpenseRow = { id: genId(), user_id: 'demo-user', ...e, category: e.category || null, created_at: new Date().toISOString(), is_deleted: false, deleted_at: null };
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
  return [...db().leads].filter(l => !l.is_deleted).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createLead(l: { name: string; phone: string; fitness_goal?: string; status?: string }): Promise<LeadRow> {
  if (useDemo()) return demo.createLead(l) as any;
  const row: LeadRow = { id: genId(), user_id: 'demo-user', ...l, fitness_goal: l.fitness_goal || null, status: l.status || 'new', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_deleted: false, deleted_at: null };
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
    id: genId(), user_id: 'demo-user', name: params.name, phone: params.phone,
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
  return db().gym_settings[0] || null;
}

export async function upsertGymSettings(updates: Partial<Omit<GymSettingsRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  await delay();
  const d = db();
  if (d.gym_settings.length > 0) {
    d.gym_settings[0] = { ...d.gym_settings[0], ...updates, updated_at: new Date().toISOString() };
  } else {
    d.gym_settings.push({
      id: genId(), user_id: 'demo-user',
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
  return db().contact_settings[0] || null;
}

export async function upsertContactSettings(updates: Partial<Pick<ContactSettingsRow, 'whatsapp_number' | 'whatsapp_message' | 'instagram_url'>>): Promise<void> {
  await delay();
  const d = db();
  if (d.contact_settings.length > 0) {
    d.contact_settings[0] = { ...d.contact_settings[0], ...updates, updated_at: new Date().toISOString() };
  } else {
    d.contact_settings.push({
      id: genId(), user_id: 'demo-user', gym_id: null,
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
  d.payments.push({
    id: genId(), user_id: 'demo-user', member_id: params.memberId, amount: params.amount,
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
  if (useDemo()) return demo.getDashboardStats() as any;
  await delay();
  const raw = db();
  const d: MockDb = {
    ...raw,
    members: raw.members.filter(m => !m.is_deleted),
    payments: raw.payments.filter(p => !p.is_deleted),
    leads: raw.leads.filter(l => !l.is_deleted),
    expenses: raw.expenses.filter(e => !e.is_deleted),
  };
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
  if (useDemo()) return demo.getRevenueChart() as any;
  await delay();
  const raw = db();
  const d = { ...raw, payments: raw.payments.filter(p => !p.is_deleted) };
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

// ─── Analytics (time-range based) ───
export type AnalyticsRange = { from: string; to: string }; // YYYY-MM-DD inclusive

export interface AnalyticsResult {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    newMembers: number;
    membersLeft: number;
    activeMembers: number;
    pendingPayments: number;
    pendingAmount: number;
    newLeads: number;
    convertedLeads: number;
  };
  series: { label: string; revenue: number; expenses: number; newMembers: number }[];
  planDistribution: { name: string; value: number }[];
  expenseBreakdown: { name: string; value: number }[];
  members: { id: string; name: string; phone: string; plan: string; start_date: string; expiry_date: string; status: string }[];
  payments: { id: string; member_name: string; amount: number; payment_date: string; method: string; status: string }[];
  leads: { id: string; name: string; phone: string; goal: string; status: string; created_at: string }[];
  topDay?: { label: string; revenue: number };
}

function bucketLabelsForRange(from: Date, to: Date, granularity: 'day' | 'month') {
  const labels: { label: string; key: string; start: Date; end: Date }[] = [];
  if (granularity === 'day') {
    const cur = new Date(from);
    while (cur <= to) {
      const start = new Date(cur);
      const end = new Date(cur); end.setHours(23, 59, 59, 999);
      labels.push({
        label: start.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        key: start.toISOString().slice(0, 10),
        start, end,
      });
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= to) {
      const start = new Date(cur);
      const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
      labels.push({
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        start, end,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return labels;
}

export async function getAnalytics(range: AnalyticsRange, granularity: 'day' | 'month' = 'day'): Promise<AnalyticsResult> {
  if (useDemo()) return demo.getAnalytics(range, granularity) as any;
  await delay();
  const raw = db();
  const d: MockDb = {
    ...raw,
    members: raw.members.filter(m => !m.is_deleted),
    payments: raw.payments.filter(p => !p.is_deleted),
    leads: raw.leads.filter(l => !l.is_deleted),
    expenses: raw.expenses.filter(e => !e.is_deleted),
  };
  const from = range.from;
  const to = range.to;
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const inRange = (dateStr: string) => dateStr >= from && dateStr <= to;
  const inRangeIso = (iso: string) => {
    const day = iso.slice(0, 10);
    return day >= from && day <= to;
  };

  const paid = d.payments.filter(p => p.status === 'paid' && inRange(p.payment_date));
  const totalRevenue = paid.reduce((s, p) => s + p.amount, 0);

  const exp = d.expenses.filter(e => inRange(e.expense_date));
  const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);

  const newMembersList = d.members.filter(m => inRangeIso(m.created_at));
  const newMembers = newMembersList.length;

  const today = new Date().toISOString().slice(0, 10);
  const membersLeft = d.members.filter(m => inRange(m.expiry_date) && m.expiry_date < today).length;
  const activeMembers = d.members.filter(m => m.expiry_date >= today).length;

  const pendingList = d.payments.filter(p => (p.status === 'pending' || p.status === 'overdue') && inRange(p.payment_date));
  const pendingPayments = pendingList.length;
  const pendingAmount = pendingList.reduce((s, p) => s + p.amount, 0);

  const leadsInRange = d.leads.filter(l => inRangeIso(l.created_at));
  const newLeads = leadsInRange.length;
  const convertedLeads = leadsInRange.filter(l => l.status === 'joined').length;

  const buckets = bucketLabelsForRange(fromDate, toDate, granularity);
  const series = buckets.map(b => {
    const bs = b.start.toISOString().slice(0, 10);
    const be = b.end.toISOString().slice(0, 10);
    const bRevenue = d.payments
      .filter(p => p.status === 'paid' && p.payment_date >= bs && p.payment_date <= be)
      .reduce((s, p) => s + p.amount, 0);
    const bExpenses = d.expenses
      .filter(e => e.expense_date >= bs && e.expense_date <= be)
      .reduce((s, e) => s + e.amount, 0);
    const bNew = d.members.filter(m => {
      const day = m.created_at.slice(0, 10);
      return day >= bs && day <= be;
    }).length;
    return { label: b.label, revenue: bRevenue, expenses: bExpenses, newMembers: bNew };
  });

  const topDay = series.length ? series.reduce((best, cur) => cur.revenue > best.revenue ? cur : best, series[0]) : undefined;

  const planCount: Record<string, number> = {};
  newMembersList.forEach(m => {
    const plan = d.plans.find(p => p.id === m.plan_id);
    const key = plan?.name ?? 'Unknown';
    planCount[key] = (planCount[key] ?? 0) + 1;
  });
  const planDistribution = Object.entries(planCount).map(([name, value]) => ({ name, value }));

  const catCount: Record<string, number> = {};
  exp.forEach(e => {
    const key = e.category ?? 'Other';
    catCount[key] = (catCount[key] ?? 0) + e.amount;
  });
  const expenseBreakdown = Object.entries(catCount).map(([name, value]) => ({ name, value }));

  const members = newMembersList.map(m => {
    const plan = d.plans.find(p => p.id === m.plan_id);
    return {
      id: m.id, name: m.name, phone: m.phone, plan: plan?.name ?? '—',
      start_date: m.start_date, expiry_date: m.expiry_date,
      status: m.expiry_date < today ? 'expired' : 'active',
    };
  });

  const paymentsTable = d.payments
    .filter(p => inRange(p.payment_date))
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
    .map(p => {
      const member = d.members.find(m => m.id === p.member_id);
      return {
        id: p.id, member_name: member?.name ?? 'Unknown',
        amount: p.amount, payment_date: p.payment_date,
        method: p.method, status: p.status,
      };
    });

  const leadsTable = leadsInRange
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(l => ({
      id: l.id, name: l.name, phone: l.phone,
      goal: l.fitness_goal ?? '—', status: l.status,
      created_at: l.created_at,
    }));

  return {
    kpis: {
      totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses,
      newMembers, membersLeft, activeMembers,
      pendingPayments, pendingAmount,
      newLeads, convertedLeads,
    },
    series,
    planDistribution,
    expenseBreakdown,
    members,
    payments: paymentsTable,
    leads: leadsTable,
    topDay: topDay ? { label: topDay.label, revenue: topDay.revenue } : undefined,
  };
}
