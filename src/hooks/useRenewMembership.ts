import { db as supabase } from '@/integrations/supabase/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format } from 'date-fns';

interface RenewParams {
  memberId: string;
  planId: string;
  durationDays: number;
  amount: number;
  currentExpiry: string;
  method?: string;
}

export function useRenewMembership() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ memberId, planId, durationDays, amount, currentExpiry, method = 'cash' }: RenewParams) => {
      const today = new Date();
      const expiryBase = new Date(currentExpiry) > today ? new Date(currentExpiry) : today;
      const newExpiry = format(addDays(expiryBase, durationDays), 'yyyy-MM-dd');
      const newStart = format(today, 'yyyy-MM-dd');

      // Create payment
      const { error: payErr } = await (supabase.from('payments' as any) as any).insert({
        member_id: memberId,
        user_id: user!.id,
        amount,
        payment_date: newStart,
        method,
        status: 'paid',
        note: 'Membership renewal — auto-renewed',
      });
      if (payErr) throw payErr;

      // Update member expiry
      const { error: memErr } = await (supabase.from('members' as any) as any)
        .update({ plan_id: planId, start_date: newStart, expiry_date: newExpiry, status: 'active' })
        .eq('id', memberId);
      if (memErr) throw memErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
