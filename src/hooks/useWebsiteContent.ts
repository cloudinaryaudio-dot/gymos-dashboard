import { db as supabase } from '@/integrations/supabase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// ─── Section content types ───
export interface HeroContent {
  title?: string;
  subtitle?: string;
  image_url?: string;
  video_url?: string;
  mobile_image_url?: string;
  mobile_video_url?: string;
  cta_text?: string;
}

export interface PricingContent {
  title?: string;
  subtitle?: string;
  cta_note?: string;
}

export interface TrainerItem {
  name: string;
  specialization?: string;
  image_url?: string;
}
export interface TrainersContent {
  title?: string;
  subtitle?: string;
  items: TrainerItem[];
}

export interface TestimonialItem {
  name: string;
  content?: string;
  video_url?: string;
}
export interface TestimonialsContent {
  title?: string;
  subtitle?: string;
  items: TestimonialItem[];
}

export interface GalleryMediaItem {
  url: string;
  type: 'image' | 'video';
  caption?: string;
}
export interface GalleryContent {
  title?: string;
  items: GalleryMediaItem[];
}

// Keep backward compat alias
export interface GalleryImageItem {
  image_url: string;
  caption?: string;
}

export interface ServiceItem {
  title: string;
  description?: string;
  icon?: string;
  image_url?: string;
}
export interface ServicesContent {
  title?: string;
  subtitle?: string;
  items: ServiceItem[];
}

export interface EquipmentItem {
  name: string;
  description?: string;
  image_url?: string;
}
export interface EquipmentContent {
  title?: string;
  subtitle?: string;
  items: EquipmentItem[];
}

export interface ReviewItem {
  name: string;
  rating: number;
  text?: string;
}
export interface ReviewsContent {
  title?: string;
  subtitle?: string;
  items: ReviewItem[];
}

export interface BranchItem {
  name: string;
  location?: string;
  contact?: string;
}
export interface BranchesContent {
  title?: string;
  subtitle?: string;
  items: BranchItem[];
}

export type SectionKey = 'hero' | 'pricing' | 'trainers' | 'testimonials' | 'gallery' | 'services' | 'equipment' | 'reviews' | 'branches';

export interface WebsiteContentRow {
  id: string;
  user_id: string;
  section_key: SectionKey;
  is_enabled: boolean;
  content: any;
  created_at: string;
  updated_at: string;
}

// ─── Defaults ───
export const SECTION_DEFAULTS: Record<SectionKey, { label: string; defaultContent: any }> = {
  hero: {
    label: 'Hero',
    defaultContent: { title: '', subtitle: '', image_url: '', video_url: '', mobile_image_url: '', mobile_video_url: '', cta_text: 'Start Free Trial' } as HeroContent,
  },
  pricing: {
    label: 'Pricing',
    defaultContent: { title: 'Choose Your Plan', subtitle: 'Flexible plans for your fitness journey.', cta_note: '⚡ Limited slots — Join now' } as PricingContent,
  },
  trainers: {
    label: 'Trainers',
    defaultContent: { title: 'Meet Our Trainers', subtitle: 'Certified professionals dedicated to your transformation.', items: [] } as TrainersContent,
  },
  testimonials: {
    label: 'Testimonials',
    defaultContent: { title: 'What Our Members Say', subtitle: 'Real results from real people.', items: [] } as TestimonialsContent,
  },
  gallery: {
    label: 'Gallery',
    defaultContent: { title: 'Gallery', items: [] } as GalleryContent,
  },
  services: {
    label: 'Services',
    defaultContent: { title: 'Our Services', subtitle: 'Explore our range of fitness programs.', items: [] } as ServicesContent,
  },
  equipment: {
    label: 'Equipment',
    defaultContent: { title: 'World-Class Equipment', subtitle: 'Train with the best machines and gear.', items: [] } as EquipmentContent,
  },
  reviews: {
    label: 'Reviews',
    defaultContent: { title: 'Google Reviews', subtitle: 'See what our members say about us.', items: [] } as ReviewsContent,
  },
  branches: {
    label: 'Branches',
    defaultContent: { title: 'Our Branches', subtitle: 'Find a location near you.', items: [] } as BranchesContent,
  },
};

export const ALL_SECTION_KEYS: SectionKey[] = ['hero', 'pricing', 'services', 'equipment', 'trainers', 'testimonials', 'reviews', 'gallery', 'branches'];

// ─── Hook for admin (authenticated) ───
export function useWebsiteContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['website_content', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_content' as any)
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as WebsiteContentRow[];
    },
    enabled: !!user,
  });

  const getSection = (key: SectionKey): WebsiteContentRow | undefined =>
    query.data?.find(r => r.section_key === key);

  const getSectionContent = <T,>(key: SectionKey): T =>
    (getSection(key)?.content ?? SECTION_DEFAULTS[key].defaultContent) as T;

  const isSectionEnabled = (key: SectionKey): boolean =>
    getSection(key)?.is_enabled ?? false;

  const upsertSection = useMutation({
    mutationFn: async ({ section_key, is_enabled, content }: { section_key: SectionKey; is_enabled: boolean; content: any }) => {
      const existing = getSection(section_key);
      const payload = {
        user_id: user!.id,
        section_key,
        is_enabled,
        content,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await (supabase.from('website_content' as any) as any)
          .update({ is_enabled, content, updated_at: payload.updated_at })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('website_content' as any) as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website_content'] });
      toast({ title: 'Section saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    sections: query.data ?? [],
    isLoading: query.isLoading,
    getSection,
    getSectionContent,
    isSectionEnabled,
    upsertSection,
  };
}

// ─── Hook for public page (unauthenticated) ───
export function usePublicWebsiteContent(userId: string | undefined) {
  return useQuery({
    queryKey: ['public_website_content', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_content' as any)
        .select('*')
        .eq('user_id', userId!)
        .eq('is_enabled', true);
      if (error) throw error;
      return (data ?? []) as WebsiteContentRow[];
    },
    enabled: !!userId,
  });
}
