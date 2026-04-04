import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  expense_date: string;
  category: string | null;
  created_at: string;
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => ds.getExpenses() as Promise<Expense[]>,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: { title: string; amount: number; expense_date: string; category?: string }) =>
      ds.createExpense(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ds.deleteExpense(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
