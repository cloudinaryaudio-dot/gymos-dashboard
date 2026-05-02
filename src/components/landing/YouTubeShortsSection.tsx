import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { SectionHeader } from '@/components/PremiumCard';

const SHORTS = [
  'https://www.youtube.com/shorts/Z6AKEtAj1d4',
  'https://www.youtube.com/shorts/lzB4ZPX_jbw',
  'https://www.youtube.com/shorts/ieLmv0MOwoc',
  'https://www.youtube.com/shorts/ieLmv0MOeoc',
  'https://www.youtube.com/shorts/ieLmv0MOtoc',
];

// STRICT: only accept URLs containing "/shorts/" — ignore everything else
function getShortId(url: string): string | null {
  if (!url.includes('/shorts/')) return null;
  const m = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

interface ShortCardProps {
  videoId: string;
  isPlaying: boolean;
  onPlay: () => void;
}

function ShortCard({ videoId, isPlaying, onPlay }: ShortCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
      className="relative flex-shrink-0 snap-center w-[230px] sm:w-[260px] md:w-[280px] rounded-2xl overflow-hidden shadow-lg shadow-black/30 cursor-pointer group"
      style={{ aspectRatio: '9 / 16', background: '#000' }}
      onClick={onPlay}
    >
      {!isPlaying ? (
        <>
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="YouTube Short thumbnail"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          {/* play button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="h-16 w-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Play className="h-7 w-7 fill-current ml-1" />
            </div>
          </motion.div>
        </>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}`}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube Short"
        />
      )}
    </motion.div>
  );
}

export function YouTubeShortsSection({ bg = 'primary' }: { bg?: 'primary' | 'secondary' }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  const ids = SHORTS.map(getShortId).filter(Boolean) as string[];

  // Mobile auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    let raf: number;
    let last = performance.now();
    const SPEED = 25; // px / sec

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && playingIndex === null) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          let next = el.scrollLeft + SPEED * dt;
          if (next >= max - 1) next = 0; // loop
          el.scrollLeft = next;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => { pausedRef.current = true; };
    const resume = () => {
      pausedRef.current = false;
      // resume after short delay handled implicitly; use timeout for explicit interaction recovery
    };
    const resumeDelayed = () => {
      pausedRef.current = true;
      window.setTimeout(() => { pausedRef.current = false; }, 1500);
    };

    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resumeDelayed, { passive: true });
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resumeDelayed);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, [playingIndex]);

  const handlePlay = useCallback((idx: number) => {
    setPlayingIndex(idx);
    pausedRef.current = true;
  }, []);

  if (ids.length === 0) return null;

  return (
    <section
      className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: bg === 'primary' ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="Shorts"
          title="Watch Our Shorts"
          subtitle="Quick glimpses of training, transformations & community moments."
        />

        {/* Mobile: auto-scroll snap carousel */}
        <div
          ref={scrollRef}
          className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4"
          style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}
        >
          {/* duplicate for seamless loop feel */}
          {[...ids, ...ids].map((id, i) => (
            <ShortCard
              key={`${id}-${i}`}
              videoId={id}
              isPlaying={playingIndex === i}
              onPlay={() => handlePlay(i)}
            />
          ))}
        </div>

        {/* Desktop: centered row */}
        <div className="hidden md:flex justify-center items-stretch gap-6 flex-wrap">
          {ids.map((id, i) => (
            <ShortCard
              key={id}
              videoId={id}
              isPlaying={playingIndex === i}
              onPlay={() => handlePlay(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
