import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, Building2 } from 'lucide-react';
import * as ds from '@/services/dataService';
import type { BranchesContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';

export default function PublicBranchesPage() {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['public-branches-page'],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'branches');
      return ((row?.content as BranchesContent)?.items ?? []) as any[];
    },
  });

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => { window.location.href = '/#branches'; }} className="flex items-center gap-2 text-ws-text-muted hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Branches
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">All Locations</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display">Our Branches</h1>
          <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">Find a location near you.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : branches.length === 0 ? (
          <p className="text-center text-ws-text-muted py-20">No branches listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {branches.map((b, i) => (
              <BranchCard key={b.id} branch={b} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BranchCard({ branch, index }: { branch: any; index: number }) {
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
        {branch.image_url && (
          <div className="aspect-[16/10] overflow-hidden bg-secondary/30">
            <img src={branch.image_url} alt={branch.name} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="p-7 space-y-4 flex-1 flex flex-col">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg">{branch.name}</h3>
          {branch.location && (
            <p className="text-sm text-ws-text-subtle leading-relaxed flex items-start gap-2 flex-1">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {branch.location}
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
