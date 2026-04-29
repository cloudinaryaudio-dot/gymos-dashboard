import { useRef } from 'react';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoEmbed } from '@/components/VideoEmbed';
import * as ds from '@/services/dataService';
import type { TestimonialsContent, WebsiteContentRow } from '@/hooks/useWebsiteContent';

export default function PublicTestimonialsPage() {
  usePublicTheme();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['public-testimonials-page'],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'testimonials');
      return (row?.content as TestimonialsContent)?.items ?? [];
    },
  });

  const textItems = items.filter((t: any) => !t.video_url);
  const videoItems = items.filter((t: any) => !!t.video_url);

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => { window.location.href = '/#testimonials'; }} className="text-ws-text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Testimonials
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
          <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Success Stories</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display">All Testimonials</h1>
          <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">Real results from real members.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ws-text-muted py-20">No testimonials yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {textItems.map((t: any, i: number) => <TextTestimonialCard key={i} item={t} index={i} />)}
            </div>
            {videoItems.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold font-display text-center mb-8">Video Stories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {videoItems.map((t: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}>
                      <div className="rounded-2xl bg-ws-card border border-ws-border overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                        <VideoEmbed url={t.video_url!} />
                        <div className="p-5 space-y-2">
                          <p className="font-display font-semibold">{t.name}</p>
                          {t.content && <p className="text-sm text-ws-text-muted">{t.content}</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TextTestimonialCard({ item, index }: { item: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
      className="rounded-2xl bg-ws-card border border-ws-border p-7 space-y-4 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col"
    >
      <div className="flex gap-1">
        {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
      </div>
      {item.content && <p className="text-ws-text-label leading-relaxed flex-1">"{item.content}"</p>}
      <div className="flex items-center gap-3 pt-4 border-t border-ws-border">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <p className="font-display font-semibold">{item.name}</p>
      </div>
    </motion.div>
  );
}
