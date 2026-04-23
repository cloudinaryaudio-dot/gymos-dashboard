import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as ds from '@/services/dataService';
import type { EquipmentContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';

export default function PublicEquipmentPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['public-equipment-page'],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'equipment');
      return (row?.content as EquipmentContent)?.items ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => { window.location.href = '/#equipment'; }} className="text-ws-text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Equipment
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
          <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Our Facility</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display">All Equipment</h1>
          <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">Train with the best machines and gear.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ws-text-muted py-20">No equipment listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {items.map((it, i) => <EquipmentFullCard key={i} item={it} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentFullCard({ item, index }: { item: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
      className="group rounded-2xl overflow-hidden bg-ws-card border border-ws-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <Dumbbell className="h-16 w-16 text-primary/30" />
          </div>
        )}
      </div>
      <div className="p-6 space-y-2 flex-1">
        <h3 className="font-display font-bold text-lg">{item.name}</h3>
        {item.description && <p className="text-sm text-ws-text-subtle leading-relaxed">{item.description}</p>}
      </div>
    </motion.div>
  );
}