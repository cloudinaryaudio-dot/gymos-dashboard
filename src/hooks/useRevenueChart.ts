import { db as supabase } from '@/integrations/supabase/db';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export function useRevenueChart() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['revenue-chart', user?.id],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));
      const start = format(sixMonthsAgo, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('payments' as any)
        .select('amount, payment_date')
        .eq('status', 'paid')
        .gte('payment_date', start)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(now, i);
        monthMap.set(format(m, 'MMM yyyy'), 0);
      }

      for (const p of (data as any[]) ?? []) {
        const key = format(new Date(p.payment_date), 'MMM yyyy');
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) ?? 0) + Number(p.amount));
        }
      }

      return Array.from(monthMap.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      })) as MonthlyRevenue[];
    },
    enabled: !!user,
  });
}
