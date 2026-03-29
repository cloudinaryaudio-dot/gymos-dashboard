import { db as supabase } from '@/integrations/supabase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type LeadStatus = 'new' | 'contacted' | 'converted';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  fitness_goal: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ['leads', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });

  const addLead = useMutation({
    mutationFn: async (lead: { name: string; phone: string; fitness_goal?: string }) => {
      const { error } = await (supabase.from('leads' as any) as any).insert({ ...lead, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await (supabase.from('leads' as any) as any).update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('leads' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { leads: leadsQuery.data ?? [], isLoading: leadsQuery.isLoading, addLead, updateLeadStatus, deleteLead };
}
