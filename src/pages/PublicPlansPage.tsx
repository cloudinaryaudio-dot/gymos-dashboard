import { useRef } from 'react';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Check, Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicGymSettings } from '@/hooks/useGymSettings';
import * as ds from '@/services/dataService';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  category?: string;
  benefits?: string[];
  is_highlighted?: boolean;
}

const CATEGORY_ORDER = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Male', 'Female', 'Couple', 'Student', 'general'];

export default function PublicPlansPage() {
  usePublicTheme();
  const navigate = useNavigate();
  const { data: gymBranding } = usePublicGymSettings();
  const brandName = gymBranding?.gym_name || 'GymOS';

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => ds.getPlans() as Promise<Plan[]>,
  });

  const categories = new Map<string, Plan[]>();
  plans.forEach(p => {
    const cat = p.category || 'general';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(p);
  });
  const sortedCategories = [...categories.entries()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a[0]);
    const ib = CATEGORY_ORDER.indexOf(b[0]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const handleBackToPricing = () => {
    navigate('/#pricing');
    setTimeout(() => {
      const el = document.getElementById('pricing');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={handleBackToPricing} className="flex items-center gap-2 text-ws-text-muted hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Pricing
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">All Plans</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display">Choose Your Perfect Plan</h1>
          <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">
            Flexible memberships for every fitness goal and budget.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sortedCategories.length === 0 ? (
          <p className="text-center text-ws-text-muted py-20">No plans available yet.</p>
        ) : (
          sortedCategories.map(([category, categoryPlans]) => (
            <div key={category} className="mb-16">
              {sortedCategories.length > 1 && category !== 'general' && (
                <h2 className="text-2xl font-bold font-display mb-8 text-center capitalize">{category}</h2>
              )}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${categoryPlans.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6 max-w-5xl mx-auto`}>
                {categoryPlans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} index={i} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const isPopular = plan.is_highlighted;
  const benefits = plan.benefits?.length ? plan.benefits : ['Full gym access', 'Expert guidance', 'Diet consultation'];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <div className={`relative rounded-2xl p-8 text-center space-y-6 h-full flex flex-col ${
        isPopular
          ? 'bg-gradient-to-b from-primary/15 via-primary/5 to-ws-card border-2 border-primary/50 shadow-2xl shadow-primary/10'
          : 'bg-ws-card border border-ws-border hover:border-ws-border-light shadow-sm hover:shadow-xl'
      }`}>
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-primary to-highlight text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" /> Most Popular
          </div>
        )}
        <h3 className="font-display font-semibold text-xl">{plan.name}</h3>
        <div>
          <span className="text-5xl font-bold font-display">₹{plan.price.toLocaleString()}</span>
          <span className="text-ws-text-dim ml-1 text-sm">/ {plan.duration_days} days</span>
        </div>
        <ul className="text-left space-y-3 text-sm text-ws-text-muted flex-1">
          {benefits.map((b, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${isPopular ? 'bg-primary/20' : 'bg-primary/10'}`}>
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Button className={`w-full h-12 rounded-xl font-bold ${isPopular ? 'shadow-lg shadow-primary/25' : 'bg-ws-border text-ws-text hover:bg-ws-border-light'}`}>
          Get Started <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
