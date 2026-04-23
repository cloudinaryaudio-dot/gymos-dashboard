import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Branch {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  contact: string | null;
  image_url: string | null;
  sort_order: number | null;
  created_at: string | null;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('branches' as any) as any).select('*').order('sort_order');
      if (error) throw error;
      return data as Branch[];
    },
  });
}

export function usePublicBranches() {
  return useQuery({
    queryKey: ['public-branches'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('branches' as any) as any).select('*').order('sort_order');
      if (error) throw error;
      return data as Branch[];
    },
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (branch: { name: string; location?: string; contact?: string; image_url?: string; sort_order?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase.from('branches' as any) as any).insert({ ...branch, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...branch }: { id: string; name: string; location?: string; contact?: string; image_url?: string }) => {
      const { error } = await (supabase.from('branches' as any) as any).update(branch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('branches' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
}
