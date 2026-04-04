import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as ds from '@/services/dataService';

export interface ContactSettings {
  id: string;
  user_id: string;
  gym_id: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useContactSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['contact_settings'],
    queryFn: () => ds.getContactSettings() as Promise<ContactSettings | null>,
  });

  const upsertSettings = useMutation({
    mutationFn: (updates: Partial<Pick<ContactSettings, 'whatsapp_number' | 'whatsapp_message' | 'instagram_url'>>) =>
      ds.upsertContactSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_settings'] });
      toast({ title: 'Contact settings saved!' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { settings, isLoading, upsertSettings };
}

export function usePublicContactSettings(_userId?: string) {
  return useQuery({
    queryKey: ['contact_settings'],
    queryFn: () => ds.getContactSettings() as Promise<ContactSettings | null>,
  });
}
