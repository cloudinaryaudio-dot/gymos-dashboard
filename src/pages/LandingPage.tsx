import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoEmbed } from '@/components/VideoEmbed';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dumbbell, Send, ChevronRight, Users, Award, Calendar, Star, ArrowRight, Play, Phone, User, Target,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadGoal, setLeadGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch public data (use first user's data for now — in production, use gym slug)
  const { data, isLoading } = useQuery({
    queryKey: ['public-landing'],
    queryFn: async () => {
      const [sectionsRes, testimonialsRes, galleryRes, trainersRes, plansRes] = await Promise.all([
        supabase.from('website_sections').select('*').eq('is_visible', true).order('sort_order').limit(20),
        supabase.from('testimonials').select('*').eq('is_visible', true).order('sort_order').limit(20),
        supabase.from('gallery').select('*').order('sort_order').limit(12),
        supabase.from('trainers').select('*').order('sort_order').limit(10),
        supabase.from('plans').select('*').order('price').limit(10),
      ]);
      return {
        sections: sectionsRes.data ?? [],
        testimonials: testimonialsRes.data ?? [],
        gallery: galleryRes.data ?? [],
        trainers: trainersRes.data ?? [],
        plans: plansRes.data ?? [],
      };
    },
  });

  const hero = data?.sections.find((s: any) => s.section_type === 'hero');

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setSubmitting(true);
    // Get the first available user_id from plans or sections for lead assignment
    const ownerId = data?.plans?.[0]?.user_id || data?.sections?.[0]?.user_id;
    if (!ownerId) {
      toast({ title: 'Error', description: 'Unable to submit. Please try again later.', variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from('leads').insert({
      name: leadName.trim(),
      phone: leadPhone.trim(),
      fitness_goal: leadGoal || null,
      user_id: ownerId,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🎉 Welcome!', description: "We'll contact you shortly to get started." });
      setLeadName('');
      setLeadPhone('');
      setLeadGoal('');
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-[hsl(220,10%,92%)]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[hsl(220,25%,6%)]/80 border-b border-[hsl(220,20%,15%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">GymOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#pricing" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,92%)] transition-colors">Pricing</a>
            <a href="#trainers" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,92%)] transition-colors">Trainers</a>
            <a href="#testimonials" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,92%)] transition-colors">Testimonials</a>
            <a href="#gallery" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,92%)] transition-colors">Gallery</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,92%)]" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Book Free Trial
            </Button>
            <Link to={user ? '/app/dashboard' : '/login'}>
              <Button variant="outline" size="sm" className="border-[hsl(220,20%,20%)] bg-transparent text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,14%)]">
                {user ? 'Dashboard' : 'Admin Login'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={hero?.image_url ? {
          backgroundImage: `linear-gradient(to bottom, hsla(220,25%,6%,0.7), hsla(220,25%,6%,0.95)), url(${hero.image_url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Star className="h-4 w-4" /> #1 Rated Gym in the City
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight">
              {hero?.title || (
                <>Transform Your Body.{' '}<span className="text-primary">Transform Your Life.</span></>
              )}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[hsl(220,10%,60%)] max-w-xl leading-relaxed">
              {hero?.subtitle || 'World-class equipment, expert trainers, and a community that pushes you to be your best. Your transformation starts here.'}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="h-14 px-8 text-base font-semibold" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Join Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-[hsl(220,20%,20%)] bg-transparent text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,14%)]" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <Play className="mr-2 h-5 w-5" /> Book Free Trial
              </Button>
            </div>
          </div>
        </div>
        {hero?.video_url && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
            <VideoEmbed url={hero.video_url} className="rounded-2xl overflow-hidden border border-[hsl(220,20%,15%)]" />
          </div>
        )}
      </section>

      {/* Social Proof Strip */}
      <section className="border-y border-[hsl(220,20%,12%)] bg-[hsl(220,25%,8%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: '500+', label: 'Active Members' },
              { icon: Award, value: '200+', label: 'Transformations' },
              { icon: Calendar, value: '10+', label: 'Years Experience' },
              { icon: Star, value: '4.9', label: 'Google Rating' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <stat.icon className="h-6 w-6 text-primary mx-auto" />
                <p className="text-3xl font-bold font-display">{stat.value}</p>
                <p className="text-sm text-[hsl(220,10%,50%)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      {(data?.plans?.length ?? 0) > 0 && (
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
              <h2 className="text-4xl font-bold font-display">Choose Your Plan</h2>
              <p className="mt-4 text-[hsl(220,10%,50%)] max-w-xl mx-auto">Flexible plans designed to fit your fitness journey. No hidden fees.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {data!.plans.map((plan: any, i: number) => {
                const isPopular = i === Math.floor((data!.plans.length - 1) / 2);
                return (
                  <div key={plan.id} className={`relative rounded-2xl p-8 text-center space-y-6 transition-all duration-300 hover:scale-105 ${isPopular ? 'bg-primary/10 border-2 border-primary ring-1 ring-primary/20' : 'bg-[hsl(220,25%,9%)] border border-[hsl(220,20%,15%)]'}`}>
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}
                    <h3 className="font-display font-semibold text-xl">{plan.name}</h3>
                    <div>
                      <span className="text-5xl font-bold font-display">₹{plan.price}</span>
                      <span className="text-[hsl(220,10%,50%)] ml-1">/ {plan.duration_days} days</span>
                    </div>
                    <Button className={`w-full h-12 ${isPopular ? '' : 'bg-[hsl(220,20%,14%)] text-[hsl(220,10%,92%)] hover:bg-[hsl(220,20%,18%)]'}`} onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
                      Get Started <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trainers */}
      {(data?.trainers?.length ?? 0) > 0 && (
        <section id="trainers" className="py-24 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,8%)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Expert Coaching</p>
              <h2 className="text-4xl font-bold font-display">Meet Our Trainers</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data!.trainers.map((t: any) => (
                <div key={t.id} className="group rounded-2xl bg-[hsl(220,25%,9%)] border border-[hsl(220,20%,15%)] overflow-hidden hover:border-primary/40 transition-colors">
                  {t.image_url ? (
                    <div className="aspect-[4/5] overflow-hidden">
                      <img src={t.image_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-[4/5] bg-[hsl(220,20%,12%)] flex items-center justify-center">
                      <User className="h-16 w-16 text-[hsl(220,10%,30%)]" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-display font-semibold text-lg">{t.name}</h3>
                    {t.specialization && <p className="text-sm text-primary mt-1">{t.specialization}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {(data?.testimonials?.length ?? 0) > 0 && (
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Success Stories</p>
              <h2 className="text-4xl font-bold font-display">What Our Members Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data!.testimonials.map((t: any) => (
                <div key={t.id} className="rounded-2xl bg-[hsl(220,25%,9%)] border border-[hsl(220,20%,15%)] p-8 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  {t.content && <p className="text-[hsl(220,10%,70%)] leading-relaxed italic">"{t.content}"</p>}
                  {t.video_url && <VideoEmbed url={t.video_url} className="rounded-xl overflow-hidden" />}
                  <p className="font-display font-semibold text-sm pt-2 border-t border-[hsl(220,20%,15%)]">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {(data?.gallery?.length ?? 0) > 0 && (
        <section id="gallery" className="py-24 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,8%)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Our Space</p>
              <h2 className="text-4xl font-bold font-display">Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data!.gallery.map((g: any) => (
                <div key={g.id} className="rounded-xl overflow-hidden group">
                  <img src={g.image_url} alt={g.caption || 'Gallery'} className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-[hsl(220,25%,9%)] to-primary/10 border border-primary/20 p-12 sm:p-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-display">
              Start Your Fitness Journey <span className="text-primary">Today</span>
            </h2>
            <p className="mt-6 text-lg text-[hsl(220,10%,55%)] max-w-xl mx-auto">
              Join hundreds of members who've already transformed their lives. Your best self is waiting.
            </p>
            <Button size="lg" className="mt-8 h-14 px-10 text-base font-semibold" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="lead-form" className="py-24 px-4 sm:px-6 lg:px-8 bg-[hsl(220,25%,8%)]">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Get Started</p>
            <h2 className="text-4xl font-bold font-display">Join Us Today</h2>
            <p className="mt-4 text-[hsl(220,10%,50%)]">Fill in your details and our team will reach out within 24 hours.</p>
          </div>
          <form onSubmit={handleLeadSubmit} className="rounded-2xl bg-[hsl(220,25%,9%)] border border-[hsl(220,20%,15%)] p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(220,10%,70%)] flex items-center gap-2">
                <User className="h-4 w-4" /> Full Name
              </label>
              <Input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your name" required className="h-12 bg-[hsl(220,25%,6%)] border-[hsl(220,20%,15%)] text-[hsl(220,10%,92%)] placeholder:text-[hsl(220,10%,35%)]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(220,10%,70%)] flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone Number
              </label>
              <Input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="+91 98765 43210" required className="h-12 bg-[hsl(220,25%,6%)] border-[hsl(220,20%,15%)] text-[hsl(220,10%,92%)] placeholder:text-[hsl(220,10%,35%)]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(220,10%,70%)] flex items-center gap-2">
                <Target className="h-4 w-4" /> Fitness Goal
              </label>
              <Select value={leadGoal} onValueChange={setLeadGoal}>
                <SelectTrigger className="h-12 bg-[hsl(220,25%,6%)] border-[hsl(220,20%,15%)] text-[hsl(220,10%,92%)]">
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                  <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                  <SelectItem value="General Fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-14 text-base font-semibold" disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />{submitting ? 'Submitting...' : 'Get Started'}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[hsl(220,20%,12%)] text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">GymOS</span>
          </div>
          <p className="text-sm text-[hsl(220,10%,40%)]">© {new Date().getFullYear()} GymOS. All rights reserved.</p>
          <Link to={user ? '/app/dashboard' : '/login'} className="text-sm text-[hsl(220,10%,40%)] hover:text-primary transition-colors">
            {user ? 'Go to Dashboard' : 'Admin Login'}
          </Link>
        </div>
      </footer>
    </div>
  );
}
