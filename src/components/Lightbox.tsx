import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoEmbed } from './VideoEmbed';

interface LightboxProps {
  items: { url: string; type: 'image' | 'video'; caption?: string }[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ items, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) {
  const item = items[currentIndex];

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && currentIndex < items.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, items.length, onClose, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKey]);

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="h-6 w-6" />
          </button>

          {currentIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
              className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentIndex < items.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
              className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div onClick={e => e.stopPropagation()} className="max-w-5xl max-h-[90vh] w-full mx-4">
            {item.type === 'video' ? (
              <VideoEmbed url={item.url} className="w-full" />
            ) : (
              <img src={item.url} alt={item.caption || ''} className="w-full max-h-[85vh] object-contain rounded-lg" />
            )}
            {item.caption && (
              <p className="text-center text-white/70 text-sm mt-3">{item.caption}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
