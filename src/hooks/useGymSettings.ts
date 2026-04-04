import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as ds from '@/services/dataService';

export interface GymSettings {
  id: string;
  user_id: string;
  gym_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  highlight_color: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS = {
  gym_name: 'GymOS',
  logo_url: null,
  primary_color: '222 47% 11%',
  secondary_color: '220 26% 14%',
  accent_color: '142 71% 45%',
  highlight_color: '142 80% 55%',
};

export function useGymSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['gym_settings'],
    queryFn: () => ds.getGymSettings() as Promise<GymSettings | null>,
  });

  const upsertSettings = useMutation({
    mutationFn: (updates: Partial<Omit<GymSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
      ds.upsertGymSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym_settings'] });
      toast({ title: 'Branding saved!' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const resolved = {
    gym_name: settings?.gym_name ?? DEFAULT_SETTINGS.gym_name,
    logo_url: settings?.logo_url ?? DEFAULT_SETTINGS.logo_url,
    primary_color: settings?.primary_color ?? DEFAULT_SETTINGS.primary_color,
    secondary_color: settings?.secondary_color ?? DEFAULT_SETTINGS.secondary_color,
    accent_color: settings?.accent_color ?? DEFAULT_SETTINGS.accent_color,
    highlight_color: settings?.highlight_color ?? DEFAULT_SETTINGS.highlight_color,
  };

  return { settings, resolved, isLoading, upsertSettings };
}

export function usePublicGymSettings(_userId?: string) {
  return useQuery({
    queryKey: ['gym_settings'],
    queryFn: () => ds.getGymSettings() as Promise<GymSettings | null>,
  });
}
