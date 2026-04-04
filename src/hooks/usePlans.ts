import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  user_id: string;
  created_at: string;
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => ds.getPlans() as Promise<Plan[]>,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: { name: string; price: number; duration_days: number }) => ds.createPlan(plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...plan }: { id: string; name: string; price: number; duration_days: number }) =>
      ds.updatePlan(id, plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ds.deletePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}
