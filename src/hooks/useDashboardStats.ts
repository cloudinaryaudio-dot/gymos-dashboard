import { db as supabase } from '@/integrations/supabase/db';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, format, addDays } from 'date-fns';

export interface DashboardStats {
  monthlyRevenue: number;
  totalExpenses: number;
  profit: number;
  activeMembers: number;
  expiringMemberships: number;
  expiredMemberships: number;
  pendingPayments: number;
  overdueCount: number;
  totalPendingAmount: number;
  newLeads: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  recentPayments: { member_name: string; amount: number; date: string }[];
  todayNewMembers: number;
  todayPayments: number;
  todayPaymentsAmount: number;
  todayLeads: number;
  monthNewMembers: number;
  revenueAtRisk: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const threeDaysFromNow = format(addDays(now, 3), 'yyyy-MM-dd');
  const sevenDaysFromNow = format(addDays(now, 7), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['dashboard', user?.id, monthStart],
    queryFn: async () => {
      const [paymentsRes, expensesRes, membersRes, pendingRes, recentRes, leadsRes] = await Promise.all([
        supabase
          .from('payments' as any)
          .select('amount, payment_date')
          .eq('status', 'paid')
          .gte('payment_date', monthStart)
          .lte('payment_date', monthEnd),
        supabase
          .from('expenses' as any)
          .select('amount')
          .gte('expense_date', monthStart)
          .lte('expense_date', monthEnd),
        supabase
          .from('members' as any)
          .select('expiry_date, start_date, created_at, plan_id, plans(price)'),
        supabase
          .from('payments' as any)
          .select('id')
          .eq('status', 'pending'),
        supabase
          .from('payments' as any)
          .select('amount, payment_date, members(name)')
          .eq('status', 'paid')
          .order('payment_date', { ascending: false })
          .limit(5),
        supabase
          .from('leads' as any)
          .select('id, created_at, status'),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (membersRes.error) throw membersRes.error;
      if (pendingRes.error) throw pendingRes.error;
      if (recentRes.error) throw recentRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const monthlyRevenue = (paymentsRes.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const allMembers = membersRes.data || [];
      const activeMembers = allMembers.filter((m: any) => m.expiry_date >= today).length;
      const expiringMemberships = allMembers.filter((m: any) => m.expiry_date >= today && m.expiry_date <= sevenDaysFromNow).length;
      const expiredMemberships = allMembers.filter((m: any) => m.expiry_date < today).length;
      const atRiskMembers = allMembers.filter((m: any) => m.expiry_date < today || (m.expiry_date >= today && m.expiry_date <= sevenDaysFromNow));
      const revenueAtRisk = atRiskMembers.reduce((sum: number, m: any) => sum + Number(m.plans?.price ?? 0), 0);

      // Today stats
      const todayNewMembers = allMembers.filter((m: any) => m.created_at?.startsWith(today)).length;
      const todayPaymentsData = (paymentsRes.data || []).filter((p: any) => p.payment_date === today);
      const todayPayments = todayPaymentsData.length;
      const todayPaymentsAmount = todayPaymentsData.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const todayLeads = (leadsRes.data || []).filter((l: any) => l.created_at?.startsWith(today)).length;

      // Month stats
      const monthNewMembers = allMembers.filter((m: any) => m.created_at >= monthStart && m.created_at <= monthEnd).length;

      const allLeads = leadsRes.data || [];
      const totalLeads = allLeads.length;
      const newLeadsCount = allLeads.filter((l: any) => l.status === 'new').length;
      const convertedLeads = allLeads.filter((l: any) => l.status === 'joined').length;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      const pendingPaymentsList = pendingRes.data || [];
      const overduePayments = (paymentsRes.data || []).filter(() => false); // placeholder - use payments table status
      // Count overdue from payments table
      const allPaymentsForOverdue = await supabase
        .from('payments' as any)
        .select('id, amount, status');
      const allPay = allPaymentsForOverdue.data || [];
      const overdueCount = allPay.filter((p: any) => p.status === 'overdue').length;
      const totalPendingAmount = allPay.filter((p: any) => p.status === 'pending' || p.status === 'overdue').reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return {
        monthlyRevenue,
        totalExpenses,
        profit: monthlyRevenue - totalExpenses,
        activeMembers,
        expiringMemberships,
        expiredMemberships,
        pendingPayments: pendingPaymentsList.length,
        overdueCount,
        totalPendingAmount,
        newLeads: newLeadsCount,
        totalLeads,
        convertedLeads,
        conversionRate,
        recentPayments: (recentRes.data || []).map((p: any) => ({
          member_name: p.members?.name ?? 'Unknown',
          amount: Number(p.amount),
          date: p.payment_date,
        })),
        todayNewMembers,
        todayPayments,
        todayPaymentsAmount,
        todayLeads,
        monthNewMembers,
        revenueAtRisk,
      } as DashboardStats;
    },
    enabled: !!user,
  });
}
