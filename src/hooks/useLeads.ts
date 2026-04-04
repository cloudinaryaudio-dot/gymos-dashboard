import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as ds from '@/services/dataService';

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
  const { toast } = useToast();
  const qc = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: () => ds.getLeads() as Promise<Lead[]>,
  });

  const addLead = useMutation({
    mutationFn: (lead: { name: string; phone: string; fitness_goal?: string; status?: string }) =>
      ds.createLead(lead),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast({ title: 'Lead added' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      ds.updateLeadStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast({ title: 'Lead updated' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => ds.deleteLead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast({ title: 'Lead deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const convertToMember = useMutation({
    mutationFn: (params: { leadId: string; planId: string; startDate: string; expiryDate: string; name: string; phone: string }) =>
      ds.convertLeadToMember(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: '🎉 Lead converted to member!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { leads: leadsQuery.data ?? [], isLoading: leadsQuery.isLoading, addLead, updateLeadStatus, deleteLead, convertToMember };
}
