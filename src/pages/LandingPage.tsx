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
import { motion, useInView } from 'framer-motion';
import {
  Dumbbell, Send, ChevronRight, Users, Award, Calendar, Star, ArrowRight, Play, Phone, User, Target,
  MapPin, Mail, Clock, Menu, X,
} from 'lucide-react';
import type { HeroContent, PricingContent, TrainersContent, TestimonialsContent, GalleryContent, GalleryMediaItem, WebsiteContentRow } from '@/hooks/useWebsiteContent';
import { VideoEmbed } from '@/components/VideoEmbed';
import { Lightbox } from '@/components/Lightbox';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
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
    ...(data?.pricing ? [{ label: 'Plans', id: 'pricing' }] : []),
    ...(data?.trainers ? [{ label: 'Trainers', id: 'trainers' }] : []),
    { label: 'Contact', id: 'lead-form' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,25%,4%)] text-[hsl(220,10%,92%)] overflow-x-hidden">
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

      {/* ─── HERO (always show with defaults if enabled or no data yet) ─── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center"
        style={heroContent.image_url ? {
          backgroundImage: `linear-gradient(180deg, hsla(220,25%,4%,0.5) 0%, hsla(220,25%,4%,0.85) 60%, hsl(220,25%,4%) 100%), url(${heroContent.image_url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        } : {}}
      >
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
            <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200" onClick={() => scrollTo('lead-form')}>
              {heroContent.cta_text || 'Start Free Trial'} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-[hsl(220,20%,18%)] bg-[hsl(220,25%,8%)]/50 text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,12%)] backdrop-blur-sm hover:scale-[1.02] transition-all duration-200" onClick={() => scrollTo('lead-form')}>
              <Calendar className="mr-2 h-5 w-5" /> Book a Visit
            </Button>
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

      {/* ─── PRICING (only if enabled) ─── */}
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

      {/* ─── TESTIMONIALS (only if enabled & has items) ─── */}
      {data?.testimonials && (testimonialsContent.items?.length ?? 0) > 0 && (
        <section id="testimonials" className="py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Success Stories</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{testimonialsContent.title || 'What Our Members Say'}</h2>
              <p className="mt-5 text-[hsl(220,10%,50%)] max-w-xl mx-auto text-lg">{testimonialsContent.subtitle || 'Real results from real people.'}</p>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonialsContent.items.map((t, i) => (
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

      {/* ─── GALLERY (only if enabled & has items, limit 6) ─── */}
      {data?.gallery && (galleryContent.items?.length ?? 0) > 0 && (
        <section id="gallery" className="py-28 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,5%)]">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Our Space</p>
              <h2 className="text-4xl sm:text-5xl font-bold font-display">{galleryContent.title || 'Gallery'}</h2>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {galleryContent.items.slice(0, 6).map((g, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-square">
                    <img src={g.image_url} alt={g.caption || 'Gallery'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-end">
                      {g.caption && <p className="p-4 text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">{g.caption}</p>}
                    </div>
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
        <AnimatedSection>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-[hsl(220,25%,7%)] to-[hsl(220,25%,5%)] border border-primary/20 p-14 sm:p-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight">
                Start Your Fitness Journey{' '}<span className="bg-gradient-to-r from-primary to-[hsl(142,80%,55%)] bg-clip-text text-transparent">Today</span>
              </h2>
              <p className="mt-6 text-lg text-[hsl(220,10%,50%)] max-w-xl mx-auto">Join hundreds of members who've transformed their lives.</p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all" onClick={() => scrollTo('lead-form')}>
                  Join Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-[hsl(220,20%,18%)] bg-transparent text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,12%)] hover:scale-[1.02] transition-all" onClick={() => scrollTo('lead-form')}>
                  <Play className="mr-2 h-5 w-5" /> Book Free Trial
                </Button>
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
