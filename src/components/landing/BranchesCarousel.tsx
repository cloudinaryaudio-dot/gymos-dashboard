import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/PremiumCard';

interface BranchItem {
  name: string;
  location?: string | null;
  contact?: string | null;
  image_url?: string | null;
}

interface BranchesContent {
  title?: string;
  subtitle?: string;
}

interface Props {
  branches: BranchItem[];
  content: BranchesContent;
  totalCount?: number;
  /** background variant: 'primary' or 'secondary' for strict alternation */
  bg?: 'primary' | 'secondary';
}

function BranchCard({ branch }: { branch: BranchItem }) {
  return (
    <div
      className="w-[300px] sm:w-[340px] flex-shrink-0 rounded-2xl overflow-hidden border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      {branch.image_url ? (
        <div className="aspect-[16/10] overflow-hidden bg-secondary/30">
          <img
            src={branch.image_url}
            alt={branch.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-6 space-y-3 flex-1 flex flex-col">
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-display font-bold text-lg">{branch.name}</h3>
        {branch.location && (
          <p className="text-sm text-ws-text-subtle leading-relaxed flex items-start gap-2 flex-1">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{branch.location}</span>
          </p>
        )}
        {branch.contact && (
          <p className="text-sm text-ws-text-muted flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary shrink-0" /> {branch.contact}
          </p>
        )}
      </div>
    </div>
  );
}

export function BranchesCarousel({ branches, content, totalCount, bg = 'secondary' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const hasMore = (totalCount ?? branches.length) > branches.length || (totalCount ?? branches.length) > 6;

  // Duplicate items for seamless loop
  const loopItems = branches.length > 0 ? [...branches, ...branches] : [];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || branches.length === 0) return;
    let raf: number;
    let last = performance.now();
    const speed = 40; // px/sec

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused) {
        track.scrollLeft += speed * dt;
        const half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) {
          track.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, branches.length]);

  return (
    <section
      id="branches"
      className="py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: bg === 'primary' ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="Locations"
          title={content.title || 'Our Branches'}
          subtitle={content.subtitle || 'Find a location near you.'}
        />

        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          className="flex gap-6 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 pb-4"
          style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}
        >
          {loopItems.map((b, i) => (
            <BranchCard key={i} branch={b} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-12">
            <Link to="/branches">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="rounded-xl h-12 px-8 font-semibold shadow-lg shadow-primary/20"
                  style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
                >
                  View All Branches <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
