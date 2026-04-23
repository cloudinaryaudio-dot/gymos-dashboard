import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Dumbbell, User, Image as ImageIcon, Play } from 'lucide-react';

type FallbackType = 'service' | 'trainer' | 'gallery' | 'video' | 'equipment' | 'generic';

const fallbackIcons: Record<FallbackType, React.ReactNode> = {
  service: <Dumbbell className="h-12 w-12 text-primary/40" />,
  trainer: <User className="h-12 w-12 text-primary/40" />,
  gallery: <ImageIcon className="h-12 w-12 text-primary/40" />,
  video: <Play className="h-12 w-12 text-primary/40" />,
  equipment: <Dumbbell className="h-12 w-12 text-primary/40" />,
  generic: <ImageIcon className="h-12 w-12 text-primary/40" />,
};

interface PremiumCardProps {
  index: number;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  fallbackType?: FallbackType;
  aspectRatio?: string;
  /** Overlay content (e.g., play button for videos) */
  overlay?: React.ReactNode;
  /** Extra content below the card body */
  children?: React.ReactNode;
  /** Click handler for the whole card */
  onClick?: () => void;
  className?: string;
  /** Show gradient overlay on image */
  imageGradient?: boolean;
  /** Bottom overlay content on image (e.g., trainer name) */
  imageOverlay?: React.ReactNode;
}

export function PremiumCard({
  index,
  imageUrl,
  title,
  subtitle,
  description,
  fallbackType = 'generic',
  aspectRatio = 'aspect-[16/10]',
  overlay,
  children,
  onClick,
  className = '',
  imageGradient = true,
  imageOverlay,
}: PremiumCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-60px', amount: 0.2 });
  const [imgError, setImgError] = useState(false);

  // Alternating slide direction: even index from left, odd from right
  const fromLeft = index % 2 === 0;
  const xOffset = fromLeft ? -30 : 30;

  const hasImage = imageUrl && !imgError;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: xOffset }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: xOffset }}
      transition={{ duration: 0.65, delay: (index % 4) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className={`group cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="rounded-2xl bg-ws-card border border-ws-border overflow-hidden hover:border-primary/40 transition-all duration-500 h-full flex flex-col shadow-sm hover:shadow-xl hover:shadow-primary/5">
        {/* Image area */}
        <div className={`relative ${aspectRatio} overflow-hidden bg-secondary/30`}>
          {hasImage ? (
            <img
              src={imageUrl}
              alt={title || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/20">
              {fallbackIcons[fallbackType]}
            </div>
          )}
          {hasImage && imageGradient && (
            <div className="absolute inset-0 bg-gradient-to-t from-ws-card via-transparent to-transparent opacity-60" />
          )}
          {overlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              {overlay}
            </div>
          )}
          {imageOverlay && (
            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
              {imageOverlay}
            </div>
          )}
        </div>
        {/* Body */}
        {(title || subtitle || description || children) && (
          <div className="p-5 flex-1 flex flex-col gap-1.5">
            {title && <h3 className="font-display font-bold text-base">{title}</h3>}
            {subtitle && <p className="text-primary font-semibold text-sm">{subtitle}</p>}
            {description && <p className="text-sm text-ws-text-subtle leading-relaxed flex-1">{description}</p>}
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Section header with scroll animation */
export function SectionHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string;
  title: string;
  subtitle?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-center mb-16"
    >
      <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">{tag}</p>
      <h2 className="text-4xl sm:text-5xl font-bold font-display">{title}</h2>
      {subtitle && <p className="mt-5 text-ws-text-subtle max-w-xl mx-auto text-lg">{subtitle}</p>}
    </motion.div>
  );
}
