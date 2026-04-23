import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbox } from '@/components/Lightbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Image, Film, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import * as ds from '@/services/dataService';
import type { GalleryContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';

type FilterType = 'all' | 'image' | 'video';

function isVideoUrl(url: string) {
  return /youtu\.?be|youtube\.com|instagram\.com\/(p|reel|tv)\//i.test(url);
}

export default function GalleryPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const { data, isLoading } = useQuery({
    queryKey: ['public-gallery'],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'gallery');
      if (!row) return [];
      const c = row.content as GalleryContent;
      return (c.items ?? []).map(item => {
        // Support legacy format (image_url field)
        const url = (item as any).url || (item as any).image_url || '';
        const type = (item as any).type || (isVideoUrl(url) ? 'video' : 'image');
        return { url, type: type as 'image' | 'video', caption: item.caption };
      });
    },
  });

  const items = data ?? [];
  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="min-h-screen bg-[hsl(220,25%,4%)] text-[hsl(220,10%,92%)]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => { window.location.href = '/#gallery'; }} className="inline-flex items-center gap-2 text-sm text-[hsl(220,10%,50%)] hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Gallery
        </button>
        

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">Gallery</h1>
          <p className="text-[hsl(220,10%,50%)] text-lg">Explore our space, transformations, and community</p>
        </motion.div>

        {/* Filters */}
        <div className="flex justify-center gap-3 mb-10">
          {([
            { key: 'all', label: 'All', icon: LayoutGrid },
            { key: 'image', label: 'Images', icon: Image },
            { key: 'video', label: 'Videos', icon: Film },
          ] as const).map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={filter !== f.key ? 'border-[hsl(220,20%,15%)] bg-[hsl(220,25%,7%)] text-[hsl(220,10%,60%)] hover:bg-[hsl(220,20%,12%)]' : ''}
            >
              <f.icon className="h-4 w-4 mr-1.5" />{f.label}
            </Button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl bg-[hsl(220,20%,10%)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[hsl(220,10%,40%)] py-20">No items to show</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative rounded-xl overflow-hidden group cursor-pointer aspect-square bg-[hsl(220,25%,7%)]"
                onClick={() => setLightboxIndex(items.indexOf(item))}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-[hsl(220,20%,8%)]">
                    <Film className="h-12 w-12 text-primary/50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : (
                  <img src={item.url} alt={item.caption || 'Gallery'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                  {item.caption && (
                    <p className="p-3 text-xs font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {item.caption}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        items={items}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
