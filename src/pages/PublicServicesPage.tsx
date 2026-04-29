import { useRef } from 'react';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicGymSettings } from '@/hooks/useGymSettings';
import type { ServicesContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';
import * as ds from '@/services/dataService';

export default function PublicServicesPage() {
  usePublicTheme();
  const navigate = useNavigate();
  const { data: gymBranding } = usePublicGymSettings();
  const brandName = gymBranding?.gym_name || 'GymOS';

  const { data, isLoading } = useQuery({
    queryKey: ['public-services-page'],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'services');
      return (row?.content as ServicesContent)?.items ?? [];
    },
  });

  const items = data ?? [];

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="text-ws-text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Services
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
          <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">What We Offer</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display">All Services</h1>
          <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">Explore our complete range of fitness programs.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ws-text-muted py-20">No services listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {items.map((item, i) => (
              <ServiceFullCard key={i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceFullCard({ item, index }: { item: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/30">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <Dumbbell className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className="font-display font-black text-xl uppercase tracking-wide text-white drop-shadow-lg leading-tight">{item.title}</h3>
          {item.description && <p className="text-white/70 text-sm mt-1.5 line-clamp-2 max-w-md">{item.description}</p>}
        </div>
      </div>
    </motion.div>
  );
}
