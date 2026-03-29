import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db as supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface GymSettings {
  id: string;
  user_id: string;
  gym_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<GymSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  gym_name: 'GymOS',
  logo_url: null,
  primary_color: '142 71% 45%',
  secondary_color: '220 25% 8%',
};

export function useGymSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['gym_settings', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('gym_settings' as any)
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();
        if (error) {
          // Table doesn't exist yet — return null gracefully
          if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
            return null;
          }
          throw error;
        }
        return data as GymSettings | null;
      } catch (e: any) {
        if (e?.code === 'PGRST205' || e?.message?.includes('Could not find')) {
          return null;
        }
        throw e;
      }
    },
    enabled: !!user,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<GymSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('gym_settings' as any)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gym_settings' as any)
          .insert({ ...DEFAULT_SETTINGS, ...updates, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym_settings'] });
      toast({ title: 'Branding saved!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const resolved = {
    gym_name: settings?.gym_name ?? DEFAULT_SETTINGS.gym_name,
    logo_url: settings?.logo_url ?? DEFAULT_SETTINGS.logo_url,
    primary_color: settings?.primary_color ?? DEFAULT_SETTINGS.primary_color,
    secondary_color: settings?.secondary_color ?? DEFAULT_SETTINGS.secondary_color,
  };

  return { settings, resolved, isLoading, upsertSettings };
}

/** Public hook for landing page — fetches by any user_id */
export function usePublicGymSettings(userId: string | undefined) {
  return useQuery({
    queryKey: ['gym_settings_public', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_settings' as any)
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as GymSettings | null;
    },
    enabled: !!userId,
  });
}
