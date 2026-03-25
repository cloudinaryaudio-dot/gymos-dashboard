import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface Member {
  id: string;
  name: string;
  phone: string;
  plan_id: string | null;
  start_date: string;
  expiry_date: string;
  status: string;
  user_id: string;
  created_at: string;
  plans?: { name: string; duration_days: number } | null;
}

export function useMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['members', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*, plans(name, duration_days)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Auto-update expired statuses client-side for display
      const today = new Date().toISOString().split('T')[0];
      return (data as Member[]).map(m => ({
        ...m,
        status: m.expiry_date < today ? 'expired' : 'active',
      }));
    },
    enabled: !!user,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (member: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) => {
      const { data, error } = await supabase
        .from('members')
        .insert({ ...member, user_id: user!.id, status: 'active' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...member }: { id: string; name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) => {
      const today = new Date().toISOString().split('T')[0];
      const status = member.expiry_date < today ? 'expired' : 'active';
      const { data, error } = await supabase
        .from('members')
        .update({ ...member, status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}
