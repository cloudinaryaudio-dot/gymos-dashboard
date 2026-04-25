import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';
import { VideoEmbed } from '@/components/VideoEmbed';

interface VideoTestimonialItem {
  name: string;
  content?: string | null;
  video_url?: string | null;
}

interface Props {
  items: VideoTestimonialItem[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  /** background variant: 'primary' or 'secondary' for strict alternation */
  bg?: 'primary' | 'secondary';
}

function VideoCard({ item, index }: { item: VideoTestimonialItem; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="min-w-[280px] sm:min-w-0 snap-center flex-shrink-0 sm:flex-shrink"
    >
      <div
        className="rounded-2xl overflow-hidden border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="aspect-[9/16] sm:aspect-[9/16]">
          <VideoEmbed url={item.video_url!} />
        </div>
        <div className="p-5 space-y-1">
          <p className="font-display font-semibold">{item.name}</p>
          {item.content && <p className="text-sm text-ws-text-muted line-clamp-2">{item.content}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function VideoTestimonialsSection({ items, title, subtitle, showViewAll, bg = 'primary' }: Props) {
  const display = items.slice(0, 3);
  if (display.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: bg === 'primary' ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="Video Stories"
          title={title || 'What Members Say'}
          subtitle={subtitle || 'Hear real stories from our community.'}
        />

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="sm:grid sm:grid-cols-3 sm:gap-6 hidden">
          {display.map((it, i) => (
            <VideoCard key={i} item={it} index={i} />
          ))}
        </div>
        <div
          className="sm:hidden flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {display.map((it, i) => (
            <VideoCard key={i} item={it} index={i} />
          ))}
        </div>

        {showViewAll && (
          <div className="text-center mt-12">
            <Link to="/testimonials">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="rounded-xl h-12 px-8 font-semibold shadow-lg shadow-primary/20"
                  style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
                >
                  View All Testimonials <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
