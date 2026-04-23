import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductsContent } from '@/hooks/useWebsiteContent';

interface Props {
  content: ProductsContent;
}

export function ProductsBanner({ content }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const images = (content.banner_images?.length ? content.banner_images : []).filter(Boolean);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section id="products" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden border border-ws-border shadow-2xl shadow-black/30 min-h-[420px] sm:min-h-[480px]"
        >
          {/* Carousel background */}
          <div className="absolute inset-0 bg-ws-card">
            <AnimatePresence mode="sync">
              {images.length > 0 ? (
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                  className="absolute inset-0"
                  style={{ backgroundImage: `url(${images[activeIdx]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-ws-card to-ws-card-alt" />
              )}
            </AnimatePresence>
          </div>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

          {/* Content */}
          <div className="relative z-10 p-8 sm:p-14 lg:p-20 max-w-2xl flex flex-col justify-center min-h-[420px] sm:min-h-[480px]">
            <div className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
              <ShoppingBag className="h-3.5 w-3.5" /> Online Shop
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white leading-[1.1]">
              {content.title || 'Shop Fitness Essentials'}
            </h2>
            {content.subtitle && (
              <p className="mt-5 text-base sm:text-lg text-white/80 max-w-lg leading-relaxed">
                {content.subtitle}
              </p>
            )}
            {content.coupon_highlight && (
              <div className="mt-6 inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg bg-white/10 border border-dashed border-white/40 text-white text-sm font-semibold backdrop-blur-sm">
                <Tag className="h-4 w-4 text-primary" /> {content.coupon_highlight}
              </div>
            )}
            <div className="mt-8">
              <Link to="/products">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/30">
                    {content.cta_text || 'Explore Products'} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Carousel dots */}
          {images.length > 1 && (
            <div className="absolute bottom-5 right-5 z-10 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-primary' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}