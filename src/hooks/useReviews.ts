import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  user_id: string;
  name: string;
  rating: number;
  text: string | null;
  image_url: string | null;
  sort_order: number | null;
  created_at: string | null;
}

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('reviews' as any) as any).select('*').order('sort_order');
      if (error) throw error;
      return data as Review[];
    },
  });
}

export function usePublicReviews() {
  return useQuery({
    queryKey: ['public-reviews'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('reviews' as any) as any).select('*').order('sort_order');
      if (error) throw error;
      return data as Review[];
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: { name: string; rating: number; text?: string; image_url?: string; sort_order?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase.from('reviews' as any) as any).insert({ ...review, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...review }: { id: string; name: string; rating: number; text?: string; image_url?: string }) => {
      const { error } = await (supabase.from('reviews' as any) as any).update(review).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('reviews' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
