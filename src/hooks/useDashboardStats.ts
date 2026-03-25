import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, format, addDays } from 'date-fns';

export interface DashboardStats {
  monthlyRevenue: number;
  totalExpenses: number;
  profit: number;
  activeMembers: number;
  expiringMemberships: number;
  pendingPayments: number;
  recentPayments: { member_name: string; amount: number; date: string }[];
}

export function useDashboardStats() {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const sevenDaysFromNow = format(addDays(now, 7), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['dashboard', user?.id, monthStart],
    queryFn: async () => {
      const [paymentsRes, expensesRes, membersRes, pendingRes, recentRes] = await Promise.all([
        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'paid')
          .gte('payment_date', monthStart)
          .lte('payment_date', monthEnd),
        supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', monthStart)
          .lte('expense_date', monthEnd),
        supabase
          .from('members')
          .select('expiry_date'),
        supabase
          .from('payments')
          .select('id')
          .eq('status', 'pending'),
        supabase
          .from('payments')
          .select('amount, payment_date, members(name)')
          .eq('status', 'paid')
          .order('payment_date', { ascending: false })
          .limit(5),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (membersRes.error) throw membersRes.error;
      if (pendingRes.error) throw pendingRes.error;
      if (recentRes.error) throw recentRes.error;

      const monthlyRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const totalExpenses = (expensesRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
      const allMembers = membersRes.data || [];
      const activeMembers = allMembers.filter(m => m.expiry_date >= today).length;
      const expiringMemberships = allMembers.filter(m => m.expiry_date >= today && m.expiry_date <= sevenDaysFromNow).length;

      return {
        monthlyRevenue,
        totalExpenses,
        profit: monthlyRevenue - totalExpenses,
        activeMembers,
        expiringMemberships,
        pendingPayments: (pendingRes.data || []).length,
        recentPayments: (recentRes.data || []).map((p: any) => ({
          member_name: p.members?.name ?? 'Unknown',
          amount: Number(p.amount),
          date: p.payment_date,
        })),
      } as DashboardStats;
    },
    enabled: !!user,
  });
}
