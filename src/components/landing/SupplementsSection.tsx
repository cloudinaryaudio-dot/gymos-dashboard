import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';
import type { SupplementsContent } from '@/hooks/useWebsiteContent';

interface Props {
  content: SupplementsContent;
}

export function SupplementsSection({ content }: Props) {
  const items = content.items ?? [];
  if (!items.length) return null;

  return (
    <section id="supplements" className="py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader tag="Shop" title={content.title || 'Recommended Supplements'} subtitle={content.subtitle} />

        {/* Desktop: grid, Mobile: horizontal scroll */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <SupplementCard key={i} item={item} index={i} />
          ))}
        </div>
        <div className="sm:hidden flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {items.map((item, i) => (
            <div key={i} className="min-w-[280px] snap-start">
              <SupplementCard item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupplementCard({ item, index }: { item: SupplementsContent['items'][0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: (index % 4) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.25 } }}
      className="group cursor-pointer h-full"
    >
      <div className="rounded-2xl bg-ws-card border border-ws-border overflow-hidden hover:border-primary/40 transition-all duration-500 h-full flex flex-col shadow-sm hover:shadow-xl hover:shadow-primary/5">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/20">
              <ShoppingBag className="h-12 w-12 text-primary/40" />
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col gap-2">
          <h3 className="font-display font-bold text-base">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-ws-text-subtle leading-relaxed flex-1">{item.description}</p>
          )}
          {item.external_link && (
            <Button
              size="sm"
              className="mt-2 w-full rounded-xl font-semibold shadow-md shadow-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.external_link, '_blank', 'noopener');
              }}
            >
              Buy Now <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
