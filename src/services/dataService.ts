/**
 * Data service abstraction layer.
 * All data operations go through here. Currently backed by local mock data.
 * Switch DATA_SOURCE to 'supabase' for production migration.
 */
import { getDb, setDb, genId, type MockDb, type MemberRow, type PlanRow, type PaymentRow, type ExpenseRow, type LeadRow, type WebsiteContentRow, type GymSettingsRow, type ContactSettingsRow } from '@/data/mockDb';

// Simulate async
const delay = () => new Promise<void>(r => setTimeout(r, 50));

function db(): MockDb { return getDb(); }
function save(d: MockDb) { setDb(d); }

// ─── Plans ───
export async function getPlans(): Promise<PlanRow[]> {
  await delay();
  return [...db().plans].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createPlan(p: { name: string; price: number; duration_days: number }): Promise<PlanRow> {
  await delay();
  const row: PlanRow = { id: genId(), user_id: 'demo-user', ...p, created_at: new Date().toISOString() };
  const d = db();
  d.plans.push(row);
  save(d);
  return row;
}

export async function updatePlan(id: string, p: { name: string; price: number; duration_days: number }): Promise<PlanRow> {
  await delay();
  const d = db();
  const idx = d.plans.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Plan not found');
  d.plans[idx] = { ...d.plans[idx], ...p };
  save(d);
  return d.plans[idx];
}

export async function deletePlan(id: string): Promise<void> {
  await delay();
  const d = db();
  d.plans = d.plans.filter(x => x.id !== id);
  save(d);
}

// ─── Members ───
export async function getMembers(): Promise<(MemberRow & { plans?: { name: string; duration_days: number } | null })[]> {
  await delay();
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
  await delay();
  const d = db();
  const idx = d.members.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Member not found');
  const today = new Date().toISOString().split('T')[0];
  d.members[idx] = { ...d.members[idx], ...m, status: m.expiry_date < today ? 'expired' : 'active' };
  save(d);
  return d.members[idx];
}

export async function deleteMember(id: string): Promise<void> {
  await delay();
  const d = db();
  d.members = d.members.filter(x => x.id !== id);
  save(d);
}

// ─── Payments ───
export async function getPayments(): Promise<(PaymentRow & { members?: { name: string } | null })[]> {
  await delay();
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
  await delay();
  const d = db();
  d.payments = d.payments.filter(x => x.id !== id);
  save(d);
}

export async function updatePaymentStatus(id: string, status: string): Promise<void> {
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
  await delay();
  const d = db();
  d.expenses = d.expenses.filter(x => x.id !== id);
  save(d);
}

// ─── Leads ───
export async function getLeads(): Promise<LeadRow[]> {
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
  await delay();
  const d = db();
  d.leads = d.leads.filter(x => x.id !== id);
  save(d);
}

export async function convertLeadToMember(params: { leadId: string; planId: string; startDate: string; expiryDate: string; name: string; phone: string }): Promise<void> {
  await delay();
  const d = db();
  // Create member
  d.members.push({
    id: genId(), user_id: 'demo-user', name: params.name, phone: params.phone,
    plan_id: params.planId, start_date: params.startDate, expiry_date: params.expiryDate,
    status: 'active', created_at: new Date().toISOString(),
  });
  // Update lead status
  const idx = d.leads.findIndex(x => x.id === params.leadId);
  if (idx !== -1) {
    d.leads[idx].status = 'joined';
    d.leads[idx].updated_at = new Date().toISOString();
  }
  save(d);
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
  await delay();
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
  await delay();
  return db().plans.length > 0;
}
