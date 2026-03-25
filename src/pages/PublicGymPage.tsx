import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoEmbed } from '@/components/VideoEmbed';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Send } from 'lucide-react';

export default function PublicGymPage() {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['public-gym', userId],
    queryFn: async () => {
      const [sectionsRes, testimonialsRes, galleryRes, trainersRes, plansRes, profileRes] = await Promise.all([
        supabase.from('website_sections').select('*').eq('user_id', userId!).eq('is_visible', true).order('sort_order'),
        supabase.from('testimonials').select('*').eq('user_id', userId!).eq('is_visible', true).order('sort_order'),
        supabase.from('gallery').select('*').eq('user_id', userId!).order('sort_order'),
        supabase.from('trainers').select('*').eq('user_id', userId!).order('sort_order'),
        supabase.from('plans').select('name, price, duration_days').eq('user_id', userId!),
        supabase.from('profiles').select('full_name, gym_id').eq('user_id', userId!).single(),
      ]);
      return {
        sections: (sectionsRes.data ?? []) as any[],
        testimonials: (testimonialsRes.data ?? []) as any[],
        gallery: (galleryRes.data ?? []) as any[],
        trainers: (trainersRes.data ?? []) as any[],
        plans: (plansRes.data ?? []) as any[],
        profile: profileRes.data as any,
      };
    },
    enabled: !!userId,
  });

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim() || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from('leads').insert({ name: leadName.trim(), phone: leadPhone.trim(), user_id: userId });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Thank you!', description: "We'll contact you soon." });
      setLeadName('');
      setLeadPhone('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hero = data?.sections.find((s: any) => s.section_type === 'hero');
  const pricing = data?.sections.find((s: any) => s.section_type === 'pricing');
  const gymName = data?.profile?.full_name ?? 'Our Gym';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center px-4" style={hero?.image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${hero.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-display">{hero?.title || gymName}</h1>
          {hero?.subtitle && <p className="text-xl text-muted-foreground">{hero.subtitle}</p>}
          {hero?.content && <p className="text-muted-foreground max-w-2xl mx-auto">{hero.content}</p>}
          {hero?.video_url && <VideoEmbed url={hero.video_url} className="max-w-2xl mx-auto mt-6" />}
          <Button size="lg" className="mt-4" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Get Started
          </Button>
        </div>
      </section>

      {/* Pricing */}
      {(data?.plans?.length > 0 || pricing) && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-2">{pricing?.title || 'Our Plans'}</h2>
            {pricing?.subtitle && <p className="text-muted-foreground text-center mb-8">{pricing.subtitle}</p>}
            {pricing?.content && <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">{pricing.content}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data?.plans.map((plan: any, i: number) => (
                <div key={i} className="rounded-xl border bg-card p-6 text-center space-y-3 hover:border-primary transition-colors">
                  <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                  <p className="text-3xl font-bold text-primary">₹{plan.price}</p>
                  <p className="text-sm text-muted-foreground">{plan.duration_days} days</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trainers */}
      {data?.trainers?.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-8">Our Trainers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {data.trainers.map((t: any) => (
                <div key={t.id} className="rounded-xl border bg-card p-6 text-center space-y-3">
                  {t.image_url && <img src={t.image_url} alt={t.name} className="w-24 h-24 rounded-full mx-auto object-cover" />}
                  <h3 className="font-display font-semibold">{t.name}</h3>
                  {t.specialization && <p className="text-sm text-muted-foreground">{t.specialization}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {data?.testimonials?.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-8">What Our Members Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.testimonials.map((t: any) => (
                <div key={t.id} className="rounded-xl border bg-card p-6 space-y-3">
                  <p className="font-medium">{t.name}</p>
                  {t.content && <p className="text-muted-foreground text-sm italic">"{t.content}"</p>}
                  {t.video_url && <VideoEmbed url={t.video_url} />}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {data?.gallery?.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-8">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.gallery.map((g: any) => (
                <div key={g.id} className="rounded-lg overflow-hidden">
                  <img src={g.image_url} alt={g.caption || 'Gallery'} className="w-full aspect-square object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead Form */}
      <section id="lead-form" className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-2">Join Us Today</h2>
          <p className="text-muted-foreground text-center mb-8">Leave your details and we'll get back to you!</p>
          <form onSubmit={handleLeadSubmit} className="space-y-4 rounded-xl border bg-card p-6">
            <div>
              <Input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your Name" required />
            </div>
            <div>
              <Input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="Phone Number" required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />{submitting ? 'Submitting...' : 'Get in Touch'}
            </Button>
          </form>
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        Powered by GymOS
      </footer>
    </div>
  );
}
