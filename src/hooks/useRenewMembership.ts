import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

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
  return useMutation({
    mutationFn: (params: RenewParams) => ds.renewMembership(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
