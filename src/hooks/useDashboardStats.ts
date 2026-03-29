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
  newLeads: number;
  recentPayments: { member_name: string; amount: number; date: string }[];
  // Today's summary
  todayNewMembers: number;
  todayPayments: number;
  todayPaymentsAmount: number;
  todayLeads: number;
  // This month summary
  monthNewJoins: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const threeDaysFromNow = format(addDays(now, 3), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['dashboard', user?.id, monthStart],
    queryFn: async () => {
      const [paymentsRes, expensesRes, membersRes, pendingRes, recentRes, leadsRes, todayPaymentsRes, todayLeadsRes] = await Promise.all([
        supabase
          .from('payments' as any)
          .select('amount')
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
          .select('expiry_date, start_date, created_at'),
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
          .select('id, created_at')
          .eq('status', 'new'),
        // Today's payments
        supabase
          .from('payments' as any)
          .select('amount')
          .eq('status', 'paid')
          .eq('payment_date', today),
        // Today's leads
        supabase
          .from('leads' as any)
          .select('id')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
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
      const expiringMemberships = allMembers.filter((m: any) => m.expiry_date >= today && m.expiry_date <= threeDaysFromNow).length;
      const expiredMemberships = allMembers.filter((m: any) => m.expiry_date < today).length;

      // Today's new members (created today)
      const todayNewMembers = allMembers.filter((m: any) => {
        const created = m.created_at?.split('T')[0];
        return created === today;
      }).length;

      // This month new joins
      const monthNewJoins = allMembers.filter((m: any) => {
        const created = m.created_at?.split('T')[0];
        return created >= monthStart && created <= monthEnd;
      }).length;

      // Today's payments
      const todayPaymentsData = todayPaymentsRes.data || [];
      const todayPaymentsAmount = todayPaymentsData.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      // Today's leads
      const todayLeads = (todayLeadsRes.data || []).length;

      return {
        monthlyRevenue,
        totalExpenses,
        profit: monthlyRevenue - totalExpenses,
        activeMembers,
        expiringMemberships,
        expiredMemberships,
        pendingPayments: (pendingRes.data || []).length,
        newLeads: (leadsRes.data || []).length,
        recentPayments: (recentRes.data || []).map((p: any) => ({
          member_name: p.members?.name ?? 'Unknown',
          amount: Number(p.amount),
          date: p.payment_date,
        })),
        todayNewMembers,
        todayPayments: todayPaymentsData.length,
        todayPaymentsAmount,
        todayLeads,
        monthNewJoins,
      } as DashboardStats;
    },
    enabled: !!user,
  });
}
