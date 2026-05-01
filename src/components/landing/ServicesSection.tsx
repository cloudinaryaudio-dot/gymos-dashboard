import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';
import type { ServicesContent } from '@/hooks/useWebsiteContent';

interface Props {
  content: ServicesContent;
  showViewAll?: boolean;
}

export function ServicesSection({ content, showViewAll }: Props) {
  const items = content.items ?? [];
  if (!items.length) return null;

  // Build a bento-style layout: first 2 items are large (top row), rest fill bottom row
  const topItems = items.slice(0, 2);
  const bottomItems = items.slice(2, 4);
  const extraItems = items.slice(4);

  return (
    <section id="services" className="py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          tag="What We Offer"
          title={content.title || 'Explore Diverse Workout Programs'}
          subtitle={content.subtitle}
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {topItems.map((item, i) => (
            <ServiceCard key={i} item={item} index={i} size="large" />
          ))}
          {bottomItems.map((item, i) => (
            <ServiceCard key={i + 2} item={item} index={i + 2} size="large" />
          ))}
        </div>

        {/* Extra items in a 3-col grid if more than 4 */}
        {extraItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
            {extraItems.map((item, i) => (
              <ServiceCard key={i + 4} item={item} index={i + 4} size="normal" />
            ))}
          </div>
        )}

        {showViewAll && (
          <div className="text-center mt-12">
            <Link to="/services">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="rounded-xl h-12 px-8 font-semibold shadow-lg shadow-primary/20" style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }} >
                  View All Services <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceCard({
  item,
  index,
  size,
}: {
  item: ServicesContent['items'][0];
  index: number;
  size: 'large' | 'normal';
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const aspectClass = size === 'large' ? 'aspect-[16/10]' : 'aspect-[4/3]';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: (index % 4) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
    >
      <div className={`relative ${aspectClass} w-full overflow-hidden bg-secondary/30`}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <Dumbbell className="h-16 w-16 text-primary/30" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Bottom-left red accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className="font-display font-black text-xl sm:text-2xl lg:text-3xl uppercase tracking-wide text-white drop-shadow-lg leading-tight">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-white/70 text-sm mt-1.5 line-clamp-2 max-w-md">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
