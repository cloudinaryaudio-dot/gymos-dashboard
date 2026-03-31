import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db as supabase } from '@/integrations/supabase/db';
import { usePublicGymSettings } from '@/hooks/useGymSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FloatingContactButtons } from '@/components/FloatingContactButtons';
import { useToast } from '@/hooks/use-toast';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Dumbbell, Send, ChevronRight, Users, Award, Calendar, Star, ArrowRight, Play, Phone, User, Target,
  MapPin, Mail, Clock, Menu, X,
} from 'lucide-react';
import type { HeroContent, PricingContent, TrainersContent, TestimonialsContent, GalleryContent, GalleryMediaItem, ServicesContent, EquipmentContent, ReviewsContent, BranchesContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';
import { VideoEmbed } from '@/components/VideoEmbed';
import { Lightbox } from '@/components/Lightbox';
import { PageLoader } from '@/components/PageLoader';

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function HeroBackground({ url, className }: { url: string; className?: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&modestbranding=1&playsinline=1`}
        className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ''}`}
        style={{ border: 0, transform: 'scale(1.2)' }}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Hero background"
      />
    );
  }
  if (isDirectVideo(url)) {
    return <video autoPlay muted loop playsInline className={`absolute inset-0 w-full h-full object-cover ${className ?? ''}`} src={url} />;
  }
  return <div className={`absolute inset-0 ${className ?? ''}`} style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
}

type AnimationVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'blur';

const variants: Record<AnimationVariant, { initial: any; animate: any }> = {
  'fade-up': { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
  'fade-left': { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
  'fade-right': { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 } },
  'scale': { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  'blur': { initial: { opacity: 0, filter: 'blur(10px)' }, animate: { opacity: 1, filter: 'blur(0px)' } },
};

function AnimatedSection({ children, className = '', delay = 0, variant = 'fade-up' }: { children: React.ReactNode; className?: string; delay?: number; variant?: AnimationVariant }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const v = variants[variant];
  return (
    <motion.div ref={ref} initial={v.initial} animate={isInView ? v.animate : {}} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function ParallaxSection({ children, className = '', speed = 0.15 }: { children: React.ReactNode; className?: string; speed?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadGoal, setLeadGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch website_content + plans
  const { data, isLoading } = useQuery({
    queryKey: ['public-landing'],
    queryFn: async () => {
      const [contentRes, plansRes] = await Promise.all([
        supabase.from('website_content' as any).select('*').eq('is_enabled', true),
        supabase.from('plans').select('*').order('price').limit(10),
      ]);
      const rows = (contentRes.data ?? []) as WebsiteContentRow[];
      const getSection = (key: string) => rows.find(r => r.section_key === key);
      return {
        sections: rows,
        plans: plansRes.data ?? [],
        hero: getSection('hero'),
        pricing: getSection('pricing'),
        trainers: getSection('trainers'),
        testimonials: getSection('testimonials'),
        gallery: getSection('gallery'),
        services: getSection('services'),
        equipment: getSection('equipment'),
        reviews: getSection('reviews'),
        branches: getSection('branches'),
      };
    },
  });

  const gymId = data?.sections?.[0]?.user_id || (data?.plans?.[0] as any)?.user_id;
  const { data: gymBranding } = usePublicGymSettings(gymId);
  const brandName = gymBranding?.gym_name || 'GymOS';
  const brandLogo = gymBranding?.logo_url;

  useEffect(() => {
    if (gymBranding?.primary_color) {
      document.documentElement.style.setProperty('--primary', gymBranding.primary_color);
    }
    return () => { document.documentElement.style.removeProperty('--primary'); };
  }, [gymBranding?.primary_color]);

  const heroContent = (data?.hero?.content ?? {}) as HeroContent;
  const pricingContent = (data?.pricing?.content ?? {}) as PricingContent;
  const trainersContent = (data?.trainers?.content ?? {}) as TrainersContent;
  const testimonialsContent = (data?.testimonials?.content ?? {}) as TestimonialsContent;
  const galleryContent = (data?.gallery?.content ?? {}) as GalleryContent;
  const servicesContent = (data?.services?.content ?? {}) as ServicesContent;
  const equipmentContent = (data?.equipment?.content ?? {}) as EquipmentContent;
  const reviewsContent = (data?.reviews?.content ?? {}) as ReviewsContent;
  const branchesContent = (data?.branches?.content ?? {}) as BranchesContent;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setSubmitting(true);
    const ownerIdForLead = gymId;
    if (!ownerIdForLead) {
      toast({ title: 'Error', description: 'Unable to submit. Please try again later.', variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from('leads').insert({
      name: leadName.trim(), phone: leadPhone.trim(), fitness_goal: leadGoal || null, user_id: ownerIdForLead,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🎉 Welcome!', description: "We'll contact you shortly to get started." });
      setLeadName(''); setLeadPhone(''); setLeadGoal('');
    }
  };

  const navLinks = [
    { label: 'Home', id: 'hero' },
    ...(data?.services ? [{ label: 'Services', id: 'services' }] : []),
    ...(data?.pricing ? [{ label: 'Plans', id: 'pricing' }] : []),
    ...(data?.trainers ? [{ label: 'Trainers', id: 'trainers' }] : []),
    { label: 'Contact', id: 'lead-form' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,25%,4%)] text-[hsl(220,10%,92%)] overflow-x-hidden scroll-smooth">
      <PageLoader brandName={brandName} brandLogo={brandLogo} />
      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[hsl(220,25%,4%)]/95 backdrop-blur-xl shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {brandLogo ? (
              <img src={brandLogo} alt={brandName} className="h-10 w-10 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(142,71%,35%)] flex items-center justify-center shadow-lg shadow-primary/25">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <span className="text-xl font-bold font-display tracking-tight">{brandName}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="text-[hsl(220,10%,55%)] hover:text-[hsl(220,10%,92%)] transition-colors duration-200 relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,10%)]" onClick={() => scrollTo('lead-form')}>
              Book Free Trial
            </Button>
            <Link to={user ? '/app/dashboard' : '/login'}>
              <Button size="sm" className="bg-[hsl(220,20%,12%)] text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,16%)] border border-[hsl(220,20%,18%)]">
                {user ? 'Dashboard' : 'Admin Login'}
              </Button>
            </Link>
          </div>
          <button className="md:hidden p-2 text-[hsl(220,10%,60%)]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-[hsl(220,25%,6%)] border-t border-[hsl(220,20%,12%)] px-4 py-6 space-y-4">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left text-[hsl(220,10%,70%)] hover:text-[hsl(220,10%,92%)] py-2 text-lg font-medium">
                {link.label}
              </button>
            ))}
            <Link to={user ? '/app/dashboard' : '/login'} className="block">
              <Button className="w-full mt-2">{user ? 'Dashboard' : 'Admin Login'}</Button>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video or Image */}
        {heroContent.video_url ? (
          <>
            <video
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover hidden md:block"
              src={heroContent.video_url}
            />
            {heroContent.mobile_video_url ? (
              <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover md:hidden" src={heroContent.mobile_video_url} />
            ) : heroContent.mobile_image_url ? (
              <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${heroContent.mobile_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : null}
          </>
        ) : heroContent.image_url ? (
          <>
            <div className="absolute inset-0 hidden md:block" style={{ backgroundImage: `url(${heroContent.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            {heroContent.mobile_image_url ? (
              <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${heroContent.mobile_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : (
              <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${heroContent.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
          </>
        ) : null}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsla(220,25%,4%,0.5)] via-[hsla(220,25%,4%,0.7)] to-[hsl(220,25%,4%)]" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-8 backdrop-blur-sm">
              <Star className="h-4 w-4 fill-primary" /> Trusted by 500+ Members
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-display leading-[1.05] tracking-tight max-w-5xl mx-auto">
            {heroContent.title || (<>Transform Your Body.{' '}<br className="hidden sm:block" /><span className="bg-gradient-to-r from-primary to-[hsl(142,80%,55%)] bg-clip-text text-transparent">Build Your Discipline.</span></>)}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 text-lg sm:text-xl text-[hsl(220,10%,55%)] max-w-2xl mx-auto leading-relaxed">
            {heroContent.subtitle || 'World-class equipment, expert trainers, and a community that pushes you beyond limits.'}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-shadow duration-300" onClick={() => scrollTo('lead-form')}>
                {heroContent.cta_text || 'Start Free Trial'} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-[hsl(220,20%,18%)] bg-[hsl(220,25%,8%)]/50 text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,12%)] backdrop-blur-sm transition-all duration-300" onClick={() => scrollTo('lead-form')}>
                <Calendar className="mr-2 h-5 w-5" /> Book a Visit
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(220,25%,4%)] to-transparent" />
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="relative -mt-1 border-y border-[hsl(220,20%,10%)] bg-[hsl(220,25%,6%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '500+', label: 'Active Members' },
              { icon: Award, value: '200+', label: 'Transformations' },
              { icon: Calendar, value: '10+', label: 'Years Experience' },
              { icon: Star, value: '4.9★', label: 'Google Rating' },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.1} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mx-auto">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-4xl font-bold font-display">{stat.value}</p>
                <p className="text-sm text-[hsl(220,10%,45%)] font-medium uppercase tracking-wider">{stat.label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES (only if enabled & has items) ─── */}
      {data?.services && (servicesContent.items?.length ?? 0) > 0 && (
        <section id="services" className="py-28 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection className="text-center mb-16" variant="blur">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">What We Offer</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{servicesContent.title || 'Our Services'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{servicesContent.subtitle || 'Explore our range of fitness programs.'}</p>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {servicesContent.items.map((s, i) => (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <div className="group rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] overflow-hidden hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
                    {s.image_url ? (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={s.image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,25%,7%)] via-transparent to-transparent opacity-60" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center pt-8 pb-2">
                        <span className="text-5xl">{s.icon || '💪'}</span>
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
                      {s.description && <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed flex-1">{s.description}</p>}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── EQUIPMENT (only if enabled & has items) ─── */}
      {data?.equipment && (equipmentContent.items?.length ?? 0) > 0 && (
        <section id="equipment" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Our Facility</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{equipmentContent.title || 'World-Class Equipment'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{equipmentContent.subtitle || 'Train with the best machines and gear.'}</p>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipmentContent.items.map((eq, i) => (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <div className="group rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] overflow-hidden hover:border-primary/40 transition-all duration-500 hover:-translate-y-1">
                    {eq.image_url ? (
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={eq.image_url} alt={eq.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,25%,7%)] via-transparent to-transparent opacity-60" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-[hsl(220,20%,10%)] flex items-center justify-center">
                        <Dumbbell className="h-16 w-16 text-[hsl(220,10%,25%)]" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-display font-bold text-lg mb-2">{eq.name}</h3>
                      {eq.description && <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed">{eq.description}</p>}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {data?.pricing && (data?.plans?.length ?? 0) > 0 && (
        <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Pricing</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{pricingContent.title || 'Choose Your Plan'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{pricingContent.subtitle || 'Flexible plans designed to fit your fitness journey.'}</p>
              {pricingContent.cta_note && <p className="mt-3 text-primary/80 font-semibold text-sm">{pricingContent.cta_note}</p>}
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {data!.plans.map((plan: any, i: number) => {
                const isPopular = i === Math.floor((data!.plans.length - 1) / 2);
                return (
                  <AnimatedSection key={plan.id} delay={i * 0.12}>
                    <div className={`relative rounded-2xl p-8 text-center space-y-6 transition-all duration-300 hover:-translate-y-2 ${isPopular ? 'bg-gradient-to-b from-primary/15 to-[hsl(220,25%,7%)] border-2 border-primary/50 shadow-2xl shadow-primary/10' : 'bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,13%)] hover:border-[hsl(220,20%,20%)]'}`}>
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-primary to-[hsl(142,71%,35%)] text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider shadow-lg">Most Popular</div>
                      )}
                      <h3 className="font-display font-semibold text-xl">{plan.name}</h3>
                      <div>
                        <span className="text-5xl font-bold font-display">₹{plan.price}</span>
                        <span className="text-[hsl(220,10%,45%)] ml-1 text-sm">/ {plan.duration_days} days</span>
                      </div>
                      <ul className="text-left space-y-3 text-sm text-[hsl(220,10%,60%)]">
                        <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary shrink-0" /> Full gym access</li>
                        <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary shrink-0" /> Expert guidance</li>
                        <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary shrink-0" /> Diet consultation</li>
                      </ul>
                      <Button className={`w-full h-12 rounded-xl font-bold transition-all duration-200 ${isPopular ? 'shadow-lg shadow-primary/25' : 'bg-[hsl(220,20%,12%)] text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,16%)]'}`} onClick={() => scrollTo('lead-form')}>
                        Get Started <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── TRAINERS (only if enabled & has items) ─── */}
      {data?.trainers && (trainersContent.items?.length ?? 0) > 0 && (
        <section id="trainers" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Expert Coaching</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{trainersContent.title || 'Meet Our Trainers'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{trainersContent.subtitle || 'Certified professionals dedicated to your transformation.'}</p>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {trainersContent.items.map((t, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="group rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] overflow-hidden hover:border-primary/40 transition-all duration-500 hover:-translate-y-1">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {t.image_url ? (
                        <img src={t.image_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-[hsl(220,20%,10%)] flex items-center justify-center">
                          <User className="h-20 w-20 text-[hsl(220,10%,25%)]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,25%,4%)] via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="font-display font-bold text-xl">{t.name}</h3>
                        {t.specialization && <p className="text-primary font-semibold text-sm mt-1">{t.specialization}</p>}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── TESTIMONIALS (text + video) ─── */}
      {data?.testimonials && (testimonialsContent.items?.length ?? 0) > 0 && (() => {
        const textItems = testimonialsContent.items.filter(t => !t.video_url);
        const videoItems = testimonialsContent.items.filter(t => !!t.video_url);
        return (
          <>
            {/* Text testimonials */}
            {textItems.length > 0 && (
              <section id="testimonials" className="py-28 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                  <AnimatedSection className="text-center mb-16">
                    <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Success Stories</p>
                    <h2 className="text-4xl sm:text-5xl font-bold font-display">{testimonialsContent.title || 'What Our Members Say'}</h2>
                    <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{testimonialsContent.subtitle || 'Real results from real people.'}</p>
                  </AnimatedSection>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {textItems.map((t, i) => (
                      <AnimatedSection key={i} delay={i * 0.1}>
                        <div className="rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] p-8 space-y-5 hover:border-primary/30 transition-colors duration-300 h-full flex flex-col">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
                          </div>
                          {t.content && <p className="text-[hsl(220,10%,65%)] leading-relaxed flex-1">"{t.content}"</p>}
                          <div className="flex items-center gap-3 pt-4 border-t border-[hsl(220,20%,12%)]">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <p className="font-display font-semibold">{t.name}</p>
                          </div>
                        </div>
                      </AnimatedSection>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Video testimonials */}
            {videoItems.length > 0 && (
              <section id="video-testimonials" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
                <div className="max-w-7xl mx-auto">
                  <AnimatedSection className="text-center mb-16">
                    <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Video Stories</p>
                    <h2 className="text-4xl sm:text-5xl font-bold font-display">Hear From Our Members</h2>
                  </AnimatedSection>
                  <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                    {videoItems.map((t, i) => (
                      <AnimatedSection key={i} delay={i * 0.1} className="min-w-[320px] max-w-[400px] snap-center flex-shrink-0">
                        <div className="rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] overflow-hidden hover:border-primary/30 transition-colors duration-300">
                          <VideoEmbed url={t.video_url!} />
                          <div className="p-5 space-y-2">
                            <p className="font-display font-semibold">{t.name}</p>
                            {t.content && <p className="text-sm text-[hsl(220,10%,55%)]">{t.content}</p>}
                          </div>
                        </div>
                      </AnimatedSection>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        );
      })()}

      {/* ─── GALLERY (preview, limit 6) ─── */}
      {data?.gallery && (galleryContent.items?.length ?? 0) > 0 && (
        <section id="gallery" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Our Space</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{galleryContent.title || 'Gallery'}</h2>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryContent.items.slice(0, 6).map((g, i) => {
                const url = (g as any).url || (g as any).image_url || '';
                const type = (g as any).type || 'image';
                return (
                  <AnimatedSection key={i} delay={i * 0.05}>
                    <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-square">
                      {type === 'video' ? (
                        <div className="w-full h-full bg-[hsl(220,20%,8%)] flex items-center justify-center">
                          <Play className="h-12 w-12 text-primary/50" />
                        </div>
                      ) : (
                        <img src={url} alt={g.caption || 'Gallery'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-end">
                        {g.caption && <p className="p-4 text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">{g.caption}</p>}
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
            {galleryContent.items.length > 6 && (
              <div className="text-center mt-10">
                <Link to="/gallery">
                  <Button variant="outline" className="border-[hsl(220,20%,18%)] bg-[hsl(220,25%,8%)]/50 text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,12%)]">
                    View Full Gallery <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── GOOGLE REVIEWS (only if enabled & has items) ─── */}
      {data?.reviews && (reviewsContent.items?.length ?? 0) > 0 && (
        <section id="reviews" className="py-28 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Trusted By Many</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{reviewsContent.title || 'Google Reviews'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{reviewsContent.subtitle || 'See what our members say about us.'}</p>
            </AnimatedSection>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
              {reviewsContent.items.map((r, i) => (
                <AnimatedSection key={i} delay={i * 0.08} className="min-w-[300px] snap-center flex-shrink-0 lg:min-w-0">
                  <div className="rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] p-8 space-y-4 hover:border-primary/30 transition-colors duration-300 h-full flex flex-col">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-5 w-5 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-[hsl(220,10%,20%)] text-[hsl(220,10%,20%)]'}`} />
                      ))}
                    </div>
                    {r.text && <p className="text-[hsl(220,10%,65%)] leading-relaxed flex-1 text-sm">"{r.text}"</p>}
                    <div className="flex items-center gap-3 pt-4 border-t border-[hsl(220,20%,12%)]">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-[hsl(220,10%,40%)]">Google Review</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── BRANCHES / FRANCHISE (only if enabled & has items) ─── */}
      {data?.branches && (branchesContent.items?.length ?? 0) > 0 && (
        <section id="branches" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Locations</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{branchesContent.title || 'Our Branches'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{branchesContent.subtitle || 'Find a location near you.'}</p>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {branchesContent.items.map((b, i) => (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <div className="rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] p-8 space-y-4 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl">{b.name}</h3>
                    {b.location && <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed">{b.location}</p>}
                    {b.contact && (
                      <p className="text-sm text-[hsl(220,10%,60%)] flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary shrink-0" /> {b.contact}
                      </p>
                    )}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA BLOCK ─── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
        </div>
        <AnimatedSection variant="scale">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-[hsl(220,25%,7%)] to-[hsl(220,25%,5%)] border border-primary/20 p-14 sm:p-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight">
                Start Your Fitness Journey{' '}<span className="bg-gradient-to-r from-primary to-[hsl(142,80%,55%)] bg-clip-text text-transparent">Today</span>
              </h2>
              <p className="mt-6 text-lg text-[hsl(220,10%,50%)] max-w-xl mx-auto">Join hundreds of members who've transformed their lives.</p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-shadow duration-300" onClick={() => scrollTo('lead-form')}>
                    Join Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-[hsl(220,20%,18%)] bg-transparent text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,12%)] transition-all duration-300" onClick={() => scrollTo('lead-form')}>
                    <Play className="mr-2 h-5 w-5" /> Book Free Trial
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─── LEAD FORM ─── */}
      <section id="lead-form" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-10">
            <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Get Started</p>
            <h2 className="text-4xl sm:text-5xl font-bold font-display">Join Us Today</h2>
            <p className="mt-5 text-[hsl(220,10%,50%)] text-lg">Fill in your details and our team will reach out within 24 hours.</p>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <form onSubmit={handleLeadSubmit} className="rounded-2xl bg-[hsl(220,25%,7%)] border border-[hsl(220,20%,12%)] p-8 space-y-5 shadow-2xl shadow-black/20">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(220,10%,65%)] flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Full Name</label>
                <Input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your name" required className="h-12 bg-[hsl(220,25%,4%)] border-[hsl(220,20%,13%)] text-[hsl(220,10%,92%)] placeholder:text-[hsl(220,10%,30%)] focus:border-primary/50 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(220,10%,65%)] flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Phone Number</label>
                <Input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="+91 98765 43210" required className="h-12 bg-[hsl(220,25%,4%)] border-[hsl(220,20%,13%)] text-[hsl(220,10%,92%)] placeholder:text-[hsl(220,10%,30%)] focus:border-primary/50 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(220,10%,65%)] flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Fitness Goal</label>
                <Select value={leadGoal} onValueChange={setLeadGoal}>
                  <SelectTrigger className="h-12 bg-[hsl(220,25%,4%)] border-[hsl(220,20%,13%)] text-[hsl(220,10%,92%)] rounded-xl"><SelectValue placeholder="Select your goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                    <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                    <SelectItem value="General Fitness">General Fitness</SelectItem>
                    <SelectItem value="Strength Training">Strength Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25 transition-all" disabled={submitting}>
                <Send className="h-4 w-4 mr-2" />{submitting ? 'Submitting...' : "Get Started — It's Free"}
              </Button>
            </form>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[hsl(220,20%,10%)] bg-[hsl(220,25%,4%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(142,71%,35%)] flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-display">{brandName}</span>
              </div>
              <p className="text-[hsl(220,10%,40%)] text-sm max-w-sm leading-relaxed">Your premium fitness destination.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-[hsl(220,10%,60%)]">Quick Links</h4>
              <div className="space-y-2">
                {navLinks.map(link => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block text-sm text-[hsl(220,10%,40%)] hover:text-primary transition-colors">{link.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-[hsl(220,10%,60%)]">Contact</h4>
              <div className="space-y-3 text-sm text-[hsl(220,10%,40%)]">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary shrink-0" /> Your City, India</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary shrink-0" /> +91 98765 43210</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary shrink-0" /> hello@gymos.in</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary shrink-0" /> 6 AM – 10 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[hsl(220,20%,10%)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[hsl(220,10%,35%)]">© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
            <Link to={user ? '/app/dashboard' : '/login'} className="text-xs text-[hsl(220,10%,35%)] hover:text-primary transition-colors">
              {user ? 'Go to Dashboard' : 'Admin Login'}
            </Link>
          </div>
        </div>
      </footer>

      <FloatingContactButtons gymId={gymId} />
    </div>
  );
}
