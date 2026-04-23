import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Pause, Play, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';

interface ReviewItem {
  name: string;
  rating: number;
  text?: string | null;
  image_url?: string | null;
}

interface ReviewsContent {
  title?: string;
  subtitle?: string;
}

interface ReviewsCarouselProps {
  reviews: ReviewItem[];
  content: ReviewsContent;
}

function ReviewCard({ review, index }: { review: ReviewItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-[300px] sm:min-w-[340px] snap-center flex-shrink-0"
    >
      <div className="rounded-2xl bg-ws-card border border-ws-border p-7 space-y-4 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col">
        {/* Stars */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              className={`h-5 w-5 transition-colors ${
                s <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-ws-text-icon text-ws-text-icon'
              }`}
            />
          ))}
        </div>

        {/* Review text */}
        {review.text && (
          <p className="text-ws-text-label leading-relaxed flex-1 text-sm">"{review.text}"</p>
        )}

        {/* Reviewer */}
        <div className="flex items-center gap-3 pt-4 border-t border-ws-border">
          {review.image_url ? (
            <img
              src={review.image_url}
              alt={review.name}
              className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
              loading="lazy"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {review.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-display font-semibold text-sm">{review.name}</p>
            <p className="text-xs text-ws-text-dimmer">Google Review</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ReviewsCarousel({ reviews, content }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 2) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: 350, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isPlaying && reviews.length > 3) {
      intervalRef.current = setInterval(scroll, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, scroll, reviews.length]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const handleMouseLeave = () => {
    if (isPlaying && reviews.length > 3) {
      intervalRef.current = setInterval(scroll, 4000);
    }
  };

  return (
    <section id="reviews" className="py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          tag="Trusted By Many"
          title={content.title || 'Google Reviews'}
          subtitle={content.subtitle || 'See what our members say about us.'}
        />

        {/* Controls */}
        {reviews.length > 3 && (
          <div className="flex justify-center mb-8 -mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-ws-text-muted hover:text-primary gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        )}

        {/* Carousel */}
        <div
          ref={scrollRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
