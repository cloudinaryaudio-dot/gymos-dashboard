import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { Award } from 'lucide-react';
import { SectionHeader } from '@/components/PremiumCard';
import type { AchievementsContent } from '@/hooks/useWebsiteContent';

interface Props {
  content: AchievementsContent;
}

export function AchievementsSection({ content }: Props) {
  const items = content.items ?? [];
  if (!items.length) return null;

  const needsScroll = items.length > 3;

  return (
    <section id="achievements" className="py-28 px-4 sm:px-6 lg:px-8 bg-ws-card-alt">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="Trust"
          title={content.title || 'Achievements & Certifications'}
          subtitle={content.subtitle}
        />
        {needsScroll ? (
          <AutoScrollCarousel items={items} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <AchievementCard key={i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AutoScrollCarousel({ items }: { items: AchievementsContent['items'] }) {
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const scroll = useCallback(() => {
    if (!scrollRef.current || paused) {
      animRef.current = requestAnimationFrame(scroll);
      return;
    }
    const el = scrollRef.current;
    el.scrollLeft += 0.5;
    if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
      el.scrollLeft = 0;
    }
    animRef.current = requestAnimationFrame(scroll);
  }, [paused]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animRef.current);
  }, [scroll]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {items.map((item, i) => (
        <div key={i} className="min-w-[300px] sm:min-w-[340px] snap-start flex-shrink-0">
          <AchievementCard item={item} index={i} />
        </div>
      ))}
    </div>
  );
}

function AchievementCard({ item, index }: { item: AchievementsContent['items'][0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div className="rounded-2xl bg-ws-card border border-ws-border overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col items-center text-center p-8">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-secondary/20 mb-6 flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" loading="lazy" />
          ) : (
            <Award className="h-10 w-10 text-primary/50" />
          )}
        </div>
        <h3 className="font-display font-bold text-base mb-2">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-ws-text-subtle leading-relaxed">{item.description}</p>
        )}
      </div>
    </motion.div>
  );
}
