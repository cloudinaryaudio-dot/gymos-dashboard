import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';

interface ReviewItem {
  name: string;
  rating: number;
  text?: string | null;
  image_url?: string | null;
  time_ago?: string | null;
}

interface ReviewsContent {
  title?: string;
  subtitle?: string;
  google_url?: string;
}

interface ReviewsCarouselProps {
  reviews: ReviewItem[];
  content: ReviewsContent;
  gymName?: string;
  logoUrl?: string | null;
}

function GoogleGIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.385a4.6 4.6 0 0 1-1.997 3.018v2.51h3.232c1.89-1.74 2.98-4.305 2.98-7.35Z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.62-2.422l-3.232-2.51c-.896.6-2.04.957-3.388.957-2.605 0-4.81-1.76-5.598-4.122H3.064v2.59A10 10 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.402 13.903a6.005 6.005 0 0 1 0-3.806V7.507H3.064a10 10 0 0 0 0 8.986l3.338-2.59Z"/>
      <path fill="#EA4335" d="M12 5.977c1.47 0 2.787.504 3.823 1.495l2.866-2.866C16.96 2.99 14.696 2 12 2A10 10 0 0 0 3.064 7.507l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977Z"/>
    </svg>
  );
}

function ReviewCard({ review, index }: { review: ReviewItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="snap-start flex-shrink-0 w-[85%] sm:w-[320px] md:w-[300px] lg:w-[300px]"
    >
      <div
        className="group relative h-full rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{
          background: 'var(--card-bg, hsl(var(--card)))',
          border: '1px solid hsl(var(--border) / 0.6)',
          boxShadow: '0 2px 10px hsl(0 0% 0% / 0.06)',
        }}
      >
        {/* Header: avatar + name + Google icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {review.image_url ? (
              <img
                src={review.image_url}
                alt={review.name}
                loading="lazy"
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                {review.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-heading, hsl(var(--foreground)))' }}>
                {review.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-description, hsl(var(--muted-foreground)))' }}>
                {review.time_ago || '2 years ago'}
              </p>
            </div>
          </div>
          <GoogleGIcon className="h-5 w-5 flex-shrink-0" />
        </div>

        {/* Stars */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
            />
          ))}
        </div>

        {/* Review text */}
        {review.text && (
          <p
            className="text-sm leading-relaxed line-clamp-3"
            style={{ color: 'var(--text-description, hsl(var(--muted-foreground)))' }}
          >
            {review.text}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ReviewsCarousel({ reviews, content, gymName, logoUrl }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const totalReviews = reviews.length;
  const googleUrl = content.google_url || `https://www.google.com/search?q=${encodeURIComponent((gymName || 'gym') + ' reviews')}`;

  const scrollByAmount = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-review-card]') as HTMLElement | null;
    const step = (card?.offsetWidth ?? 320) + 24;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }, []);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollByAmount(1);
    }
  }, [scrollByAmount]);

  useEffect(() => {
    if (isPlaying && reviews.length > 2) {
      intervalRef.current = setInterval(autoScroll, 4500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, autoScroll, reviews.length]);

  const handleMouseEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const handleMouseLeave = () => {
    if (isPlaying && reviews.length > 2) {
      intervalRef.current = setInterval(autoScroll, 4500);
    }
  };

  const fullStars = Math.round(avgRating);

  return (
    <section id="reviews" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          tag="Trusted By Many"
          title={content.title || 'Our Google Reviews'}
          subtitle={content.subtitle || 'See what our members say about us.'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12 items-start mt-2">
          {/* LEFT: Summary block */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-6 text-center flex flex-col items-center gap-3 mx-auto w-full max-w-xs lg:mx-0 lg:-mt-2 lg:self-start"
            style={{
              background: 'var(--card-bg, hsl(var(--card)))',
              border: '1px solid hsl(var(--border) / 0.6)',
              boxShadow: '0 4px 16px hsl(0 0% 0% / 0.08)',
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={gymName} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center font-bold text-xl"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                {(gymName || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <p className="font-display font-bold text-base tracking-wide uppercase" style={{ color: 'var(--text-heading, hsl(var(--foreground)))' }}>
              {gymName || 'Our Gym'}
            </p>

            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-display font-bold" style={{ color: 'var(--text-heading, hsl(var(--foreground)))' }}>
                {avgRating.toFixed(1)}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${s <= fullStars ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-description, hsl(var(--muted-foreground)))' }}>
                Based on {totalReviews} review{totalReviews === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-description, hsl(var(--muted-foreground)))' }}>
              <span>powered by</span>
              <GoogleGIcon className="h-3.5 w-3.5" />
              <span className="font-semibold">Google</span>
            </div>

            <Button
              asChild
              size="sm"
              className="mt-2 rounded-full gap-2"
              style={{ background: 'var(--button-bg, hsl(var(--primary)))', color: 'var(--button-text, hsl(var(--primary-foreground)))' }}
            >
              <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                review us on
                <GoogleGIcon className="h-4 w-4" />
              </a>
            </Button>
          </motion.aside>

          {/* RIGHT: scrollable cards */}
          <div className="relative">
            {/* Controls */}
            {reviews.length > 2 && (
              <div className="hidden md:flex absolute -top-14 right-0 gap-2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => { setIsPlaying(false); scrollByAmount(-1); }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setIsPlaying(p => !p)}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => { setIsPlaying(false); scrollByAmount(1); }}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div
              ref={scrollRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {reviews.map((r, i) => (
                <div key={i} data-review-card className="flex">
                  <ReviewCard review={r} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
