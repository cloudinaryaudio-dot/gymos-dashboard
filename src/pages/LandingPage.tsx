import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePublicGymSettings } from '@/hooks/useGymSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FloatingContactButtons } from '@/components/FloatingContactButtons';
import { useToast } from '@/hooks/use-toast';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Dumbbell, Send, ChevronRight, Users, Award, Calendar, Star, ArrowRight, Play, Phone, User, Target,
  MapPin, Mail, Clock, Image as ImageIcon,
} from 'lucide-react';
import type { HeroContent, SocialProofConfig, PricingContent, TrainersContent, TestimonialsContent, GalleryContent, GalleryMediaItem, ServicesContent, EquipmentContent, ReviewsContent, BranchesContent, OrbitContent, NavbarContent, LoaderContent, StatsContent, FooterSocialContent, SupplementsContent, AchievementsContent, ProductsContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';
import { VideoEmbed } from '@/components/VideoEmbed';
import OrbitAnimation from '@/components/OrbitAnimation';
import { Lightbox } from '@/components/Lightbox';
import { PageLoader } from '@/components/PageLoader';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PremiumCard, SectionHeader } from '@/components/PremiumCard';
import { PricingSection } from '@/components/landing/PricingSection';
import { ReviewsCarousel } from '@/components/landing/ReviewsCarousel';
import { BranchesCarousel } from '@/components/landing/BranchesCarousel';
import { VideoTestimonialsSection } from '@/components/landing/VideoTestimonialsSection';
import { AchievementsSection } from '@/components/landing/AchievementsSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { FooterSocial } from '@/components/landing/FooterSocial';
import { ProductsBanner } from '@/components/landing/ProductsBanner';
import * as ds from '@/services/dataService';

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

function SlideCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-60px', amount: 0.2 });
  const fromLeft = index % 2 === 0;
  const xOffset = fromLeft ? -30 : 30;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: xOffset }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: xOffset }}
      transition={{ duration: 0.65, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
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
  const { toast } = useToast();
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadGoal, setLeadGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apply public theme class so the gradient binds to html/body/#root
  useEffect(() => {
    document.documentElement.classList.add('theme-public');
    document.body.classList.add('theme-public');
    return () => {
      document.documentElement.classList.remove('theme-public');
      document.body.classList.remove('theme-public');
    };
  }, []);

  // Live preview support: when rendered inside an iframe (Settings page),
  // listen for { type: 'gymos-theme-preview', vars: {...} } messages and
  // apply the CSS variables in real time so the owner sees changes instantly
  // without saving.
  useEffect(() => {
    if (window.parent === window) return; // not in iframe
    function onMsg(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== 'gymos-theme-preview' || !data.vars) return;
      const root = document.documentElement;
      Object.entries(data.vars as Record<string, string>).forEach(([k, v]) => {
        root.style.setProperty(k, v);
      });
    }
    window.addEventListener('message', onMsg);
    // Tell parent we're ready to receive a snapshot
    try { window.parent.postMessage({ type: 'gymos-preview-ready' }, '*'); } catch {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['public-landing'],
    queryFn: async () => {
      const [content, plans] = await Promise.all([
        ds.getPublicWebsiteContent(),
        ds.getPlans(),
      ]);
      const rows = content as WebsiteContentRow[];
      const getSection = (key: string) => rows.find(r => r.section_key === key);
      const sortedPlans = plans.sort((a, b) => a.price - b.price);
      // Pick up to 3 plans for homepage: prioritize show_on_homepage, then is_highlighted, then fill
      const homepagePlans = (() => {
        const marked = sortedPlans.filter(p => (p as any).show_on_homepage);
        const highlighted = sortedPlans.filter(p => p.is_highlighted && !marked.includes(p));
        const rest = sortedPlans.filter(p => !marked.includes(p) && !highlighted.includes(p));
        return [...marked, ...highlighted, ...rest].slice(0, 3);
      })();
      return {
        sections: rows,
        plans: sortedPlans,
        homepagePlans,
        hero: getSection('hero'),
        pricing: getSection('pricing'),
        trainers: getSection('trainers'),
        testimonials: getSection('testimonials'),
        gallery: getSection('gallery'),
        services: getSection('services'),
        equipment: getSection('equipment'),
        reviews: getSection('reviews'),
        branches: getSection('branches'),
        orbit: getSection('orbit'),
        navbar: getSection('navbar'),
        loader: getSection('loader'),
        stats: getSection('stats'),
        footer_social: getSection('footer_social'),
        supplements: getSection('supplements'),
        achievements: getSection('achievements'),
        products: getSection('products'),
      };
    },
  });

  const { data: gymBranding } = usePublicGymSettings();
  const brandName = gymBranding?.gym_name || 'GymOS';
  const brandLogo = gymBranding?.logo_url;

  const heroContent = (data?.hero?.content ?? {}) as HeroContent;
  const pricingContent = (data?.pricing?.content ?? {}) as PricingContent;
  const trainersContent = (data?.trainers?.content ?? {}) as TrainersContent;
  const testimonialsContent = (data?.testimonials?.content ?? {}) as TestimonialsContent;
  const galleryContent = (data?.gallery?.content ?? {}) as GalleryContent;
  const servicesContent = (data?.services?.content ?? {}) as ServicesContent;
  const equipmentContent = (data?.equipment?.content ?? {}) as EquipmentContent;
  const reviewsContent = (data?.reviews?.content ?? {}) as ReviewsContent;
  const branchesContent = (data?.branches?.content ?? {}) as BranchesContent;
  const orbitContent = (data?.orbit?.content ?? {}) as OrbitContent;
  const orbitEnabled = data?.orbit?.is_enabled !== false;
  const navbarContent = (data?.navbar?.content ?? {}) as NavbarContent;
  const loaderContent = (data?.loader?.content ?? {}) as LoaderContent;
  const statsContent = (data?.stats?.content ?? { items: [
    { icon_url: '', value: '500+', label: 'Happy Members' },
    { icon_url: '', value: '200+', label: 'Transformations' },
    { icon_url: '', value: '5+', label: 'Years Experience' },
    { icon_url: '', value: '4.8', label: 'Google Rating' },
  ] }) as StatsContent;
  const statsEnabled = data?.stats?.is_enabled !== false;
  const footerSocialContent = (data?.footer_social?.content ?? { instagram_url: '', whatsapp_url: '', facebook_url: '', youtube_url: '', instagram_enabled: true, whatsapp_enabled: true, facebook_enabled: true, youtube_enabled: true }) as FooterSocialContent;
  // Supplements section removed from landing page (still available via Products module)
  const achievementsContent = (data?.achievements?.content ?? { title: 'Achievements & Certifications', subtitle: '', items: [] }) as AchievementsContent;
  const productsContent = (data?.products?.content ?? { title: 'Shop Fitness Essentials', subtitle: '', items: [], banner_images: [] }) as ProductsContent;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setSubmitting(true);
    try {
      await ds.createLead({ name: leadName.trim(), phone: leadPhone.trim(), fitness_goal: leadGoal || undefined });
      toast({ title: '🎉 Welcome!', description: "We'll contact you shortly to get started." });
      setLeadName(''); setLeadPhone(''); setLeadGoal('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const navLinks = [
    { label: 'Home', id: 'hero' },
    ...(data?.services ? [{ label: 'Services', id: 'services' }] : []),
    ...(data?.pricing ? [{ label: 'Plans', id: 'pricing' }] : []),
    ...(data?.trainers ? [{ label: 'Trainers', id: 'trainers' }] : []),
    { label: 'Contact', id: 'lead-form' },
  ];

  return (
    <div
      id="theme-root"
      className="min-h-screen overflow-x-hidden scroll-smooth"
      style={{
        background: 'var(--bg-gradient)',
        color: 'var(--text-heading)',
        minHeight: '100vh',
      }}
    >
      <PageLoader
        brandName={brandName}
        brandLogo={brandLogo}
        loaderText={loaderContent.text || undefined}
        duration={(loaderContent.duration || 3) * 1000}
        enabled={loaderContent.enabled !== false}
      />
      <PublicNavbar
        config={navbarContent}
        brandName={brandName}
        brandLogo={brandLogo}
        navLinks={navLinks}
        onScrollTo={scrollTo}
      />

      {/* ─── HERO ─── */}
      <section id="hero" className="relative min-h-screen md:min-h-screen flex items-center overflow-hidden">
        {heroContent.video_url ? (
          <>
            <HeroBackground url={heroContent.video_url} className="hidden md:block" />
            {heroContent.mobile_video_url ? (
              <HeroBackground url={heroContent.mobile_video_url} className="md:hidden" />
            ) : heroContent.mobile_image_url ? (
              <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${heroContent.mobile_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : null}
          </>
        ) : heroContent.image_url ? (
          <>
            <div className="absolute inset-0 hidden md:block" style={{ backgroundImage: `url(${heroContent.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${heroContent.mobile_image_url || heroContent.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-website-bg/50 via-website-bg/70 to-website-bg" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center">
          {/* LEFT: Content */}
          <div className="text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-8 backdrop-blur-sm">
                <Star className="h-4 w-4 fill-primary" /> Trusted by 500+ Members
              </div>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display leading-[1.05] tracking-tight">
              {heroContent.title || (<>Transform Your Body.{' '}<br className="hidden sm:block" /><span className="bg-gradient-to-r from-primary to-highlight bg-clip-text text-transparent">Build Your Discipline.</span></>)}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-lg text-ws-text-muted max-w-lg mx-auto md:mx-0 leading-relaxed">
              {heroContent.subtitle || 'World-class equipment, expert trainers, and a community that pushes you beyond limits.'}
            </motion.p>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-wrap justify-center md:justify-start gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-shadow duration-300" onClick={() => scrollTo('lead-form')}>
                  {heroContent.cta_text || 'Start Free Trial'} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-ws-border-light bg-website-bg-secondary/50 text-ws-text hover:bg-ws-border backdrop-blur-sm transition-all duration-300" onClick={() => scrollTo('lead-form')}>
                  <Calendar className="mr-2 h-5 w-5" /> Book a Visit
                </Button>
              </motion.div>
            </motion.div>

            {/* Social Proof */}
            {heroContent.social_proof?.enabled !== false && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6"
              >
                <div className="flex items-center gap-3 group cursor-default transition-transform duration-200 hover:scale-[1.03]">
                  <div className="flex -space-x-3">
                    {(heroContent.social_proof?.profile_images?.length
                      ? heroContent.social_proof.profile_images.slice(0, 3)
                      : [
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
                        ]
                    ).map((url, i) => (
                      <motion.img
                        key={i}
                        src={url}
                        alt="Member"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
                        className="h-9 w-9 rounded-full border-2 border-website-bg object-cover shadow-md"
                        loading="lazy"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-ws-text-label">
                    {heroContent.social_proof?.member_count_text || '500+ Happy Members'}
                  </span>
                </div>

                <div className="hidden sm:block w-px h-8 bg-ws-border-light" />

                <div className="flex items-center gap-2 group cursor-default transition-transform duration-200 hover:scale-[1.03]">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-ws-text">
                      {heroContent.social_proof?.rating_value || '4.8'}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-ws-text-subtle">
                    {heroContent.social_proof?.rating_text || 'Rated on Google'}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
          {/* RIGHT: Orbit Animation */}
          {orbitEnabled && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.4 }}
              className="flex items-center justify-center">
              <OrbitAnimation
                speed="normal"
                pauseOnHover
                personUrl={orbitContent.person_url || undefined}
                icons={orbitContent.icons?.some(i => i.url) ? orbitContent.icons.filter(i => i.url).map(i => ({ src: i.url, alt: i.label })) : undefined}
              />
            </motion.div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-website-bg to-transparent" />
      </section>

      {/* ─── STATS / SOCIAL PROOF ─── */}
   {statsEnabled && (statsContent.items?.length ?? 0) > 0 && (
  <section
    className="relative -mt-1 overflow-hidden border-y"
    style={{
      background: 'var(--bg-secondary)',
      borderColor: 'var(--card-border)',
    }}
  >

    {/* soft accent glow background (uses theme accent) */}
    <div className="absolute inset-0 pointer-events-none opacity-60">
      <div
        className="absolute top-0 left-1/3 w-80 h-80 blur-3xl rounded-full"
        style={{ background: 'hsl(var(--accent) / 0.18)' }}
      />
      <div
        className="absolute bottom-0 right-1/3 w-80 h-80 blur-3xl rounded-full"
        style={{ background: 'hsl(var(--highlight) / 0.18)' }}
      />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
        {statsContent.items.map((stat, i) => (
          <motion.div
            key={stat.label + i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group relative text-center rounded-2xl backdrop-blur-xl border p-6 md:p-8 shadow-md hover:shadow-2xl transition-all duration-500"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >

            {/* glow hover border (theme accent) */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"
              style={{
                background:
                  'linear-gradient(to right, hsl(var(--accent) / 0.20), hsl(var(--highlight) / 0.20))',
              }}
            />

            {/* ICON */}
            <div
              className="relative inline-flex items-center justify-center h-14 w-14 rounded-xl mx-auto mb-4 shadow-inner group-hover:scale-110 transition"
              style={{
                background:
                  'linear-gradient(135deg, hsl(var(--accent) / 0.18), hsl(var(--highlight) / 0.18))',
              }}
            >
              {stat.icon_url ? (
                <img
                  src={stat.icon_url}
                  alt={stat.label}
                  className="h-7 w-7 object-contain"
                  loading="lazy"
                />
              ) : (
                (() => {
                  const label = stat.label.toLowerCase();
                  const cls = 'h-6 w-6 transition';
                  const style = { color: 'hsl(var(--accent))' } as React.CSSProperties;
                  if (label.includes('member')) return <Users className={cls} style={style} />;
                  if (label.includes('transform')) return <Award className={cls} style={style} />;
                  if (label.includes('experience') || label.includes('year'))
                    return <Calendar className={cls} style={style} />;
                  if (label.includes('rating') || label.includes('star'))
                    return <Star className={cls} style={{ ...style, fill: 'hsl(var(--accent))' }} />;
                  return <Award className={cls} style={style} />;
                })()
              )}
            </div>

            {/* VALUE — uses accent color for emphasis */}
            <p
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: 'hsl(var(--accent))' }}
            >
              {stat.value}
            </p>

            {/* LABEL — themed description color */}
            <p
              className="text-xs sm:text-sm font-medium uppercase tracking-wider mt-2"
              style={{ color: 'var(--text-description)' }}
            >
              {stat.label}
            </p>

          </motion.div>
        ))}
      </div>
    </div>
  </section>
)}

      {/* ─── SERVICES (bg primary) ─── */}
      {data?.services && (servicesContent.items?.length ?? 0) > 0 && (() => {
        const items = servicesContent.items;
        const marked = items.filter(i => (i as any).show_on_homepage);
        const rest = items.filter(i => !marked.includes(i));
        const homepageItems = [...marked, ...rest].slice(0, 6);
        return (
          <div style={{ background: 'var(--bg-primary)' }}>
            <ServicesSection
              content={{ ...servicesContent, items: homepageItems }}
              showViewAll={items.length > 6}
            />
          </div>
        );
      })()}

      {/* ─── EQUIPMENT (bg secondary) ─── */}
      {data?.equipment && (equipmentContent.items?.length ?? 0) > 0 && (() => {
        const items = equipmentContent.items;
        const marked = items.filter(i => (i as any).show_on_homepage);
        const rest = items.filter(i => !marked.includes(i));
        const homepageItems = [...marked, ...rest].slice(0, 6);
        const showViewAll = items.length > 6;
        return (
          <section id="equipment" className="py-28 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-secondary)' }}>
            <div className="max-w-7xl mx-auto">
              <SectionHeader tag="Our Facility" title={equipmentContent.title || 'World-Class Equipment'} subtitle={equipmentContent.subtitle} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {homepageItems.map((eq, i) => (
                  <PremiumCard
                    key={i}
                    index={i}
                    imageUrl={eq.image_url}
                    title={eq.name}
                    description={eq.description}
                    fallbackType="equipment"
                    aspectRatio="aspect-[4/3]"
                  />
                ))}
              </div>
              {showViewAll && (
                <div className="text-center mt-12">
                  <Link to="/equipment">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="rounded-xl h-12 px-8 font-semibold shadow-lg shadow-primary/20" style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}>
                        View All Equipment <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ─── PRICING (bg primary) ─── */}
      {data?.pricing && (data?.homepagePlans?.length ?? 0) > 0 && (
        <div style={{ background: 'var(--bg-primary)' }}>
          <PricingSection
            plans={data!.homepagePlans}
            content={pricingContent}
            onCtaClick={() => scrollTo('lead-form')}
            showViewAll={(data?.plans?.length ?? 0) > 3}
          />
        </div>
      )}

      {/* ─── TRAINERS (bg secondary) ─── */}
      {data?.trainers && (trainersContent.items?.length ?? 0) > 0 && (() => {
        const items = trainersContent.items;
        const marked = items.filter(i => (i as any).show_on_homepage);
        const rest = items.filter(i => !marked.includes(i));
        const homepageItems = [...marked, ...rest].slice(0, 6);
        const showViewAll = items.length > 6;
        return (
          <section id="trainers" className="py-28 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-secondary)' }}>
            <div className="max-w-7xl mx-auto">
              <SectionHeader tag="Expert Coaching" title={trainersContent.title || 'Meet Our Trainers'} subtitle={trainersContent.subtitle} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {homepageItems.map((t, i) => (
                  <PremiumCard
                    key={i}
                    index={i}
                    imageUrl={t.image_url}
                    fallbackType="trainer"
                    aspectRatio="aspect-[4/5]"
                    imageOverlay={
                      <div>
                        <h3 className="font-display font-bold text-xl text-white">{t.name}</h3>
                        {t.specialization && <p className="text-primary font-semibold text-sm mt-1">{t.specialization}</p>}
                      </div>
                    }
                  />
                ))}
              </div>
              {showViewAll && (
                <div className="text-center mt-12">
                  <Link to="/trainers">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="rounded-xl h-12 px-8 font-semibold shadow-lg shadow-primary/20" style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}>
                        View All Trainers <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ─── VIDEO TESTIMONIALS (bg primary) — only 3 video shorts on landing ─── */}
      {data?.testimonials && (testimonialsContent.items?.length ?? 0) > 0 && (() => {
        const allItems = testimonialsContent.items;
        const videoItems = allItems.filter(t => !!t.video_url);
        const marked = videoItems.filter(i => (i as any).show_on_homepage);
        const rest = videoItems.filter(i => !marked.includes(i));
        const homepageVideos = [...marked, ...rest].slice(0, 3);
        // Show "View All" if there's any extra content (more videos OR text reviews exist)
        const showViewAll = videoItems.length > 3 || allItems.some(t => !t.video_url);
        if (homepageVideos.length === 0) return null;
        return (
          <VideoTestimonialsSection
            items={homepageVideos}
            title={testimonialsContent.title || 'What Our Members Say'}
            subtitle={testimonialsContent.subtitle}
            showViewAll={showViewAll}
            bg="primary"
          />
        );
      })()}

      {/* ─── GALLERY (bg secondary) ─── */}
      {data?.gallery && (galleryContent.items?.length ?? 0) > 0 && (() => {
        const items = galleryContent.items;
        const marked = items.filter(i => (i as any).show_on_homepage);
        const rest = items.filter(i => !marked.includes(i));
        const homepageItems = [...marked, ...rest].slice(0, 6);
        return (
          <section id="gallery" className="py-28 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-secondary)' }}>
            <div className="max-w-7xl mx-auto">
              <SectionHeader tag="Our Space" title={galleryContent.title || 'Gallery'} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {homepageItems.map((g, i) => {
                  const url = (g as any).url || (g as any).image_url || '';
                  const type = (g as any).type || 'image';
                  return (
                    <PremiumCard
                      key={i}
                      index={i}
                      imageUrl={type === 'image' ? url : undefined}
                      fallbackType={type === 'video' ? 'video' : 'gallery'}
                      aspectRatio="aspect-square"
                      imageGradient={false}
                      overlay={type === 'video' ? <Play className="h-12 w-12 text-primary/60" /> : undefined}
                    >
                      {g.caption && <p className="text-xs text-ws-text-subtle truncate">{g.caption}</p>}
                    </PremiumCard>
                  );
                })}
              </div>
              {items.length > 6 && (
                <div className="text-center mt-10">
                  <Link to="/gallery">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="rounded-xl h-12 px-8 font-semibold shadow-lg shadow-primary/20" style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}>
                        View Full Gallery <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ─── GOOGLE REVIEWS (bg primary) ─── */}
      {data?.reviews && (reviewsContent.items?.length ?? 0) > 0 && (
        <div style={{ background: 'var(--bg-primary)' }}>
          <ReviewsCarousel reviews={reviewsContent.items} content={reviewsContent} gymName={brandName} logoUrl={gymBranding?.logo_url ?? null} />
        </div>
      )}

      {/* ─── BRANCHES AUTO CAROUSEL (bg secondary) ─── */}
      {data?.branches && (branchesContent.items?.length ?? 0) > 0 && (() => {
        const items = branchesContent.items;
        const marked = items.filter(i => (i as any).show_on_homepage);
        const rest = items.filter(i => !marked.includes(i));
        const homepageItems = [...marked, ...rest].slice(0, 6);
        return (
          <BranchesCarousel
            branches={homepageItems}
            content={branchesContent}
            totalCount={items.length}
            bg="secondary"
          />
        );
      })()}

      {/* ─── PRODUCTS BANNER (bg primary) ─── */}
      {data?.products && data.products.is_enabled !== false && (
        <div style={{ background: 'var(--bg-primary)' }}>
          <ProductsBanner content={productsContent} />
        </div>
      )}

      {/* ─── ACHIEVEMENTS (bg secondary) ─── */}
      {data?.achievements && (achievementsContent.items?.length ?? 0) > 0 && (
        <div style={{ background: 'var(--bg-secondary)' }}>
          <AchievementsSection content={achievementsContent} />
        </div>
      )}


      {/* ─── CTA BLOCK (bg primary) ─── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
        </div>
        <AnimatedSection variant="scale">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="rounded-3xl border border-primary/20 p-14 sm:p-20" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), var(--card-bg))' }}>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight">
                Start Your Fitness Journey{' '}<span className="bg-gradient-to-r from-primary to-highlight bg-clip-text text-transparent">Today</span>
              </h2>
              <p className="mt-6 text-lg text-ws-text-subtle max-w-xl mx-auto">Join hundreds of members who've transformed their lives.</p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-shadow duration-300" onClick={() => scrollTo('lead-form')}>
                    Join Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-ws-border-light bg-transparent text-ws-text hover:bg-ws-border transition-all duration-300" onClick={() => scrollTo('lead-form')}>
                    <Play className="mr-2 h-5 w-5" /> Book Free Trial
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─── LEAD FORM (bg secondary) ─── */}
      <section id="lead-form" className="py-28 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-10">
            <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Get Started</p>
            <h2 className="text-4xl sm:text-5xl font-bold font-display">Join Us Today</h2>
            <p className="mt-5 text-ws-text-subtle text-lg">Fill in your details and our team will reach out within 24 hours.</p>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <form onSubmit={handleLeadSubmit} className="rounded-2xl bg-ws-card border border-ws-border p-8 space-y-5 shadow-2xl shadow-black/20">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ws-text-label flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Full Name</label>
                <Input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your name" required className="h-12 bg-ws-input border-ws-border text-ws-text placeholder:text-ws-text-faint focus:border-primary/50 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-ws-text-label flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Phone Number</label>
                <Input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="+91 98765 43210" required className="h-12 bg-ws-input border-ws-border text-ws-text placeholder:text-ws-text-faint focus:border-primary/50 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-ws-text-label flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Fitness Goal</label>
                <Select value={leadGoal} onValueChange={setLeadGoal}>
                  <SelectTrigger className="h-12 bg-ws-input border-ws-border text-ws-text rounded-xl"><SelectValue placeholder="Select your goal" /></SelectTrigger>
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
      <footer className="border-t border-ws-border-dim bg-ws-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-highlight flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-display">{brandName}</span>
              </div>
              <p className="text-ws-text-dimmer text-sm max-w-sm leading-relaxed">Your premium fitness destination.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-ws-text-muted">Quick Links</h4>
              <div className="space-y-2">
                {navLinks.map(link => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block text-sm text-ws-text-dimmer hover:text-primary transition-colors">{link.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-ws-text-muted">Contact</h4>
              <div className="space-y-3 text-sm text-ws-text-dimmer">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary shrink-0" /> Your City, India</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary shrink-0" /> +91 98765 43210</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary shrink-0" /> hello@gymos.in</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary shrink-0" /> 6 AM – 10 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-ws-border-dim flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-ws-text-micro">© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
            <FooterSocial content={footerSocialContent} />
            <Link to="/app/dashboard" className="text-xs text-ws-text-micro hover:text-primary transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </footer>

      <FloatingContactButtons />
    </div>
  );
}
