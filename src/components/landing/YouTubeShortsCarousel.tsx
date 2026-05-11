import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/PremiumCard';

const YT_PLAY_EVENT = 'gymos:yt-video-play';

/** Extract YouTube ID strictly from /shorts/ URLs */
function getShortsId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

interface Props {
  /** Raw YouTube Shorts URLs from dashboard */
  links?: string[];
  bg?: 'primary' | 'secondary';
  title?: string;
  subtitle?: string;
  /** Auto-advance interval (ms). 0 disables. */
  interval?: number;
}

export function YouTubeShortsCarousel({
  links = [],
  bg = 'primary',
  title,
  subtitle,
  interval = 5000,
}: Props) {
  const ids = useMemo(
    () => Array.from(new Set(links.map(getShortsId).filter(Boolean) as string[])),
    [links]
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const instanceId = useRef(`yt-shorts-${Math.random().toString(36).slice(2)}`).current;

  const goTo = useCallback(
    (next: number) => {
      if (ids.length === 0) return;
      const n = ((next % ids.length) + ids.length) % ids.length;
      setIndex(n);
      setPlaying(false); // stop previous video
    },
    [ids.length]
  );

  const handlePlay = useCallback(() => {
    setPlaying(true);
    window.dispatchEvent(new CustomEvent(YT_PLAY_EVENT, { detail: instanceId }));
  }, [instanceId]);

  // Stop when another carousel starts a video
  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (id !== instanceId) setPlaying(false);
    };
    window.addEventListener(YT_PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(YT_PLAY_EVENT, onOtherPlay);
  }, [instanceId]);


  // Auto carousel — pause when video is playing or user interacting
  useEffect(() => {
    if (!interval || ids.length < 2 || playing || paused) return;
    const t = setInterval(() => {
      setIndex(i => (i + 1) % ids.length);
    }, interval);
    return () => clearInterval(t);
  }, [interval, ids.length, playing, paused]);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
    // resume after a moment
    setTimeout(() => setPaused(false), 1500);
  };

  if (ids.length === 0) return null;

  const currentId = ids[index];

  return (
    <section
      className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ background: bg === 'primary' ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}
    >
      <div className="max-w-md sm:max-w-lg mx-auto">
        <SectionHeader
          tag="Gym Shorts"
          title={title || 'Quick Gym Stories'}
          subtitle={subtitle || 'Bite-sized moments from our community.'}
        />

        <div
          className="relative mt-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Vertical 9:16 card */}
          <div
            className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 bg-black"
            style={{ aspectRatio: '9 / 16' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentId}-${playing ? 'play' : 'thumb'}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {!playing ? (
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="group absolute inset-0 w-full h-full cursor-pointer"
                    aria-label="Play short"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${currentId}/hqdefault.jpg`}
                      alt="Short video thumbnail"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      whileHover={{ scale: 1.08 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="h-16 w-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Play className="h-7 w-7 fill-current ml-1" />
                      </div>
                    </motion.div>
                  </button>
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${currentId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${currentId}`}
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube short"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrows */}
          {ids.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous short"
                className="absolute left-0 sm:-left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/95 hover:bg-primary hover:text-white text-foreground flex items-center justify-center shadow-xl transition-colors z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next short"
                className="absolute right-0 sm:-right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/95 hover:bg-primary hover:text-white text-foreground flex items-center justify-center shadow-xl transition-colors z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Dots */}
          {ids.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {ids.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to short ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-primary' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
