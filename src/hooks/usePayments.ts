import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export interface Payment {
  id: string;
  user_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  method: string;
  status: string;
  note: string | null;
  created_at: string;
  members?: { name: string } | null;
}

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => ds.getPayments() as Promise<Payment[]>,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { member_id: string; amount: number; payment_date: string; method: string; status: string; note?: string }) =>
      ds.createPayment(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ds.deletePayment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ds.updatePaymentStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
