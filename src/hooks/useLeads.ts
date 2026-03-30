import { db as supabase } from '@/integrations/supabase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type LeadStatus = 'new' | 'contacted' | 'visit_scheduled' | 'joined' | 'lost';

export const LEAD_STAGES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'visit_scheduled', label: 'Visit Scheduled' },
  { value: 'joined', label: 'Joined' },
  { value: 'lost', label: 'Lost' },
];

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
    mutationFn: async (lead: { name: string; phone: string; fitness_goal?: string; status?: string }) => {
      const { error } = await (supabase.from('leads' as any) as any).insert({
        ...lead,
        user_id: user!.id,
        status: lead.status || 'new',
      });
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
      const { error } = await (supabase.from('leads' as any) as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
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

  const convertToMember = useMutation({
    mutationFn: async ({
      leadId,
      planId,
      startDate,
      expiryDate,
      name,
      phone,
    }: {
      leadId: string;
      planId: string;
      startDate: string;
      expiryDate: string;
      name: string;
      phone: string;
    }) => {
      // Create member
      const { error: memberError } = await (supabase.from('members' as any) as any).insert({
        name,
        phone,
        plan_id: planId,
        start_date: startDate,
        expiry_date: expiryDate,
        status: 'active',
        user_id: user!.id,
      });
      if (memberError) throw memberError;

      // Update lead status to joined
      const { error: leadError } = await (supabase.from('leads' as any) as any)
        .update({ status: 'joined', updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (leadError) throw leadError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: '🎉 Lead converted to member!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { leads: leadsQuery.data ?? [], isLoading: leadsQuery.isLoading, addLead, updateLeadStatus, deleteLead, convertToMember };
}
