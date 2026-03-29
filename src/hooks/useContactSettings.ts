import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db as supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['contact_settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') throw error;
      return data as ContactSettings | null;
    },
    enabled: !!user,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Partial<Pick<ContactSettings, 'whatsapp_number' | 'whatsapp_message' | 'instagram_url'>>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('contact_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_settings')
          .insert({ ...updates, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_settings'] });
      toast({ title: 'Contact settings saved!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return { settings, isLoading, upsertSettings };
}

/** Public hook — fetches contact settings by user_id (owner) for public pages */
export function usePublicContactSettings(userId: string | undefined) {
  return useQuery({
    queryKey: ['contact_settings_public', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') throw error;
      return data as ContactSettings | null;
    },
    enabled: !!userId,
  });
}
