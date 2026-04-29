import { useRef, useState } from 'react';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ExternalLink, Copy, Check, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as ds from '@/services/dataService';
import type { ProductsContent, ProductItem, WebsiteContentRow } from '@/hooks/useWebsiteContent';

export default function PublicProductsPage() {
  usePublicTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['public-products-page'],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'products');
      return (row?.content as ProductsContent) ?? null;
    },
  });

  const items = data?.items ?? [];
  const couponHighlight = data?.coupon_highlight || 'Use code GYM10 for 10% off';

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => { window.location.href = '/#products'; }} className="text-ws-text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-10">
          <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">Shop</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-display">{data?.title || 'Fitness Essentials'}</h1>
          {data?.subtitle && <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">{data.subtitle}</p>}
        </motion.div>

        {/* Coupon highlight */}
        <div className="flex justify-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-semibold text-sm shadow-lg shadow-primary/10"
          >
            <Tag className="h-4 w-4" /> {couponHighlight}
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ws-text-muted py-20">No products yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((it, i) => <ProductCard key={i} item={it} index={i} productId={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ item, index, productId }: { item: ProductItem; index: number; productId: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [copied, setCopied] = useState(false);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Coupon copied!', { description: code });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.25 } }}
      className="group rounded-2xl bg-ws-card border border-ws-border overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <ShoppingBag className="h-12 w-12 text-primary/40" />
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-display font-bold text-base leading-tight">{item.title}</h3>
        {item.description && <p className="text-sm text-ws-text-subtle leading-relaxed flex-1">{item.description}</p>}

        {item.coupon_code && (
          <button
            onClick={() => copyCoupon(item.coupon_code!)}
            className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg bg-primary/10 border border-dashed border-primary/40 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> {item.coupon_code}
            </span>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}

        <div className="flex flex-col gap-2 mt-1">
          <Link to={`/products/${productId}`}>
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-xl font-semibold border-ws-border-light hover:bg-ws-border"
            >
              View Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
          {item.buy_link && (
            <Button
              size="sm"
              className="w-full rounded-xl font-semibold shadow-md shadow-primary/20"
              style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
              onClick={() => window.open(item.buy_link, '_blank', 'noopener')}
            >
              Buy Now <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
