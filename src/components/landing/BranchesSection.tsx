import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, ArrowRight, Building2 } from 'lucide-react';
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

interface BranchesSectionProps {
  branches: BranchItem[];
  content: BranchesContent;
  totalCount?: number;
}

function BranchCard({ branch, index }: { branch: BranchItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const fromLeft = index % 2 === 0;
  const xOffset = fromLeft ? -30 : 30;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: xOffset }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      <div className="rounded-2xl bg-ws-card border border-ws-border overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col">
        {/* Image */}
        {branch.image_url ? (
          <div className="aspect-[16/10] overflow-hidden bg-secondary/30">
            <img
              src={branch.image_url}
              alt={branch.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ) : null}

        {/* Content */}
        <div className="p-7 space-y-4 flex-1 flex flex-col">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
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
    </motion.div>
  );
}

export function BranchesSection({ branches, content, totalCount }: BranchesSectionProps) {
  const displayBranches = branches.slice(0, 6);
  const hasMore = (totalCount ?? branches.length) > 6;

  return (
    <section id="branches" className="py-28 px-4 sm:px-6 lg:px-8 bg-ws-card-alt">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="Locations"
          title={content.title || 'Our Branches'}
          subtitle={content.subtitle || 'Find a location near you.'}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {displayBranches.map((b, i) => (
            <BranchCard key={i} branch={b} index={i} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-12">
            <Link to="/branches">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="border-ws-border-light bg-ws-card/50 text-ws-text hover:bg-ws-border rounded-xl h-12 px-8 font-semibold">
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
