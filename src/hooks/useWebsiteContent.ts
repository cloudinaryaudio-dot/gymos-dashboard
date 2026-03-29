import { db as supabase } from '@/integrations/supabase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WebsiteSection {
  id: string;
  user_id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  user_id: string;
  name: string;
  content: string | null;
  video_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Trainer {
  id: string;
  user_id: string;
  name: string;
  specialization: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export function useWebsiteContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const sectionsQuery = useQuery({
    queryKey: ['website_sections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('website_sections' as any).select('*').order('sort_order');
      if (error) throw error;
      return data as WebsiteSection[];
    },
    enabled: !!user,
  });

  const testimonialsQuery = useQuery({
    queryKey: ['testimonials', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('testimonials' as any).select('*').order('sort_order');
      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: !!user,
  });

  const galleryQuery = useQuery({
    queryKey: ['gallery', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('gallery' as any).select('*').order('sort_order');
      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!user,
  });

  const trainersQuery = useQuery({
    queryKey: ['trainers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('trainers' as any).select('*').order('sort_order');
      if (error) throw error;
      return data as Trainer[];
    },
    enabled: !!user,
  });

  const upsertSection = useMutation({
    mutationFn: async (section: Partial<WebsiteSection> & { section_type: string }) => {
      const payload = { ...section, user_id: user!.id, updated_at: new Date().toISOString() };
      if (section.id) {
        const { error } = await (supabase.from('website_sections' as any) as any).update(payload).eq('id', section.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('website_sections' as any) as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website_sections'] });
      toast({ title: 'Section saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('website_sections' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website_sections'] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addTestimonial = useMutation({
    mutationFn: async (t: { name: string; content?: string; video_url?: string }) => {
      const { error } = await (supabase.from('testimonials' as any) as any).insert({ ...t, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: 'Testimonial added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('testimonials' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['testimonials'] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addGalleryItem = useMutation({
    mutationFn: async (item: { image_url: string; caption?: string }) => {
      const { error } = await (supabase.from('gallery' as any) as any).insert({ ...item, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] });
      toast({ title: 'Image added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteGalleryItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('gallery' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addTrainer = useMutation({
    mutationFn: async (t: { name: string; specialization?: string; image_url?: string }) => {
      const { error } = await (supabase.from('trainers' as any) as any).insert({ ...t, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainers'] });
      toast({ title: 'Trainer added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteTrainer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('trainers' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainers'] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    sections: sectionsQuery.data ?? [],
    testimonials: testimonialsQuery.data ?? [],
    gallery: galleryQuery.data ?? [],
    trainers: trainersQuery.data ?? [],
    isLoading: sectionsQuery.isLoading,
    upsertSection,
    deleteSection,
    addTestimonial,
    deleteTestimonial,
    addGalleryItem,
    deleteGalleryItem,
    addTrainer,
    deleteTrainer,
  };
}
