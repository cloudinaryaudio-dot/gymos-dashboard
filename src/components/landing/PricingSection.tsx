import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ChevronRight, ArrowRight, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  category?: string;
  benefits?: string[];
  is_highlighted?: boolean;
}

interface PricingContent {
  title?: string;
  subtitle?: string;
  cta_note?: string;
}

interface PricingSectionProps {
  plans: Plan[];
  content: PricingContent;
  onCtaClick: () => void;
  showViewAll?: boolean;
}

function PlanCard({ plan, index, isPopular, onCtaClick }: { plan: Plan; index: number; isPopular: boolean; onCtaClick: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const fromLeft = index % 2 === 0;
  const xOffset = fromLeft ? -30 : 30;

  const benefits = plan.benefits?.length
    ? plan.benefits
    : ['Full gym access', 'Expert guidance', 'Diet consultation'];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: xOffset, y: 20 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <div className={`relative rounded-2xl p-8 text-center space-y-6 transition-all duration-300 h-full flex flex-col ${
        isPopular
          ? 'bg-gradient-to-b from-primary/15 via-primary/5 to-ws-card border-2 border-primary/50 shadow-2xl shadow-primary/10'
          : 'bg-ws-card border border-ws-border hover:border-ws-border-light shadow-sm hover:shadow-xl hover:shadow-primary/5'
      }`}>
        {isPopular && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.12 + 0.3 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-primary to-highlight text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5"
          >
            <Crown className="h-3.5 w-3.5" /> Most Popular
          </motion.div>
        )}

        {plan.category && plan.category !== 'general' && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary/70 bg-primary/10 rounded-full px-3 py-1 mx-auto">
            {plan.category}
          </span>
        )}

        <h3 className="font-display font-semibold text-xl">{plan.name}</h3>

        <div>
          <span className="text-5xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">₹{plan.price.toLocaleString()}</span>
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

        <Button
          className={`w-full h-12 rounded-xl font-bold transition-all duration-200 ${
            isPopular
              ? 'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40'
              : 'bg-ws-border text-ws-text hover:bg-ws-border-light'
          }`}
          onClick={onCtaClick}
        >
          Get Started <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function PricingSection({ plans, content, onCtaClick, showViewAll }: PricingSectionProps) {
  const highlightedPlan = plans.find(p => p.is_highlighted);

  return (
    <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          tag="Pricing"
          title={content.title || 'Choose Your Plan'}
          subtitle={content.subtitle || 'Flexible plans designed to fit your fitness journey.'}
        />
        {content.cta_note && (
          <p className="text-center -mt-10 mb-16 text-primary/80 font-semibold text-sm">{content.cta_note}</p>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${plans.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6 max-w-5xl mx-auto`}>
          {plans.map((plan, i) => {
            const isPopular = highlightedPlan ? plan.id === highlightedPlan.id : i === Math.floor((plans.length - 1) / 2);
            return (
              <PlanCard key={plan.id} plan={plan} index={i} isPopular={isPopular} onCtaClick={onCtaClick} />
            );
          })}
        </div>

        {showViewAll && (
          <div className="text-center mt-12">
            <Link to="/plans">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="border-ws-border-light bg-ws-card/50 text-ws-text hover:bg-ws-border rounded-xl h-12 px-8 font-semibold">
                  View All Plans <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
