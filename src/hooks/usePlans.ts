import { db as supabase } from '@/integrations/supabase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  user_id: string;
  created_at: string;
}

export function usePlans() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Plan[];
    },
    enabled: !!user,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plan: { name: string; price: number; duration_days: number }) => {
      const { data, error } = await (supabase.from('plans' as any) as any)
        .insert({ ...plan, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...plan }: { id: string; name: string; price: number; duration_days: number }) => {
      const { data, error } = await (supabase.from('plans' as any) as any)
        .update(plan)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('plans' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
}
