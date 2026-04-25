import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ExternalLink, Tag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as ds from '@/services/dataService';
import type { ProductsContent, ProductItem, WebsiteContentRow } from '@/hooks/useWebsiteContent';

export default function PublicProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const idx = parseInt(id ?? '', 10);

  const { data, isLoading } = useQuery({
    queryKey: ['public-product-detail', id],
    queryFn: async () => {
      const content = await ds.getPublicWebsiteContent();
      const row = (content as WebsiteContentRow[]).find(r => r.section_key === 'products');
      const c = (row?.content as ProductsContent) ?? null;
      return c;
    },
  });

  const items: ProductItem[] = data?.items ?? [];
  const product = !Number.isNaN(idx) ? items[idx] : undefined;

  return (
    <div className="min-h-screen bg-website-bg text-ws-text">
      <div className="border-b border-ws-border-dim bg-ws-darker/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/products">
            <Button variant="ghost" className="text-ws-text-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !product ? (
          <div className="text-center py-20">
            <p className="text-ws-text-muted text-lg">Product not found.</p>
            <Link to="/products" className="mt-4 inline-block">
              <Button className="mt-4">Back to Products</Button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
          >
            {/* Image */}
            <div
              className="rounded-3xl overflow-hidden border aspect-square"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-primary/40" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <p className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Product</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight">
                {product.title}
              </h1>

              {/* Static rating display (no rating field exists; use placeholder) */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-ws-text-muted">Recommended by GymOS</span>
              </div>

              {product.description && (
                <p className="text-ws-text-subtle leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                </p>
              )}

              {product.coupon_code && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-primary/40 text-primary font-bold text-sm"
                  style={{ background: 'hsl(var(--primary) / 0.1)' }}
                >
                  <Tag className="h-4 w-4" /> Coupon: {product.coupon_code}
                </div>
              )}

              {product.buy_link && (
                <div className="pt-4">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
                    style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
                    onClick={() => window.open(product.buy_link, '_blank', 'noopener')}
                  >
                    Buy Now <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
