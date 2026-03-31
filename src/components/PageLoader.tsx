import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

interface PageLoaderProps {
  brandName?: string;
  brandLogo?: string | null;
}

export function PageLoader({ brandName = 'GymOS', brandLogo }: PageLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('gymos-loaded')) {
      setVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 80);

    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('gymos-loaded', '1');
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[hsl(220,25%,4%)]"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
            />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {brandLogo ? (
              <motion.img
                src={brandLogo}
                alt={brandName}
                className="h-20 w-20 rounded-2xl object-cover shadow-2xl shadow-primary/20"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <motion.div
                className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(142,71%,35%)] flex items-center justify-center shadow-2xl shadow-primary/30"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Dumbbell className="h-10 w-10 text-primary-foreground" />
              </motion.div>
            )}

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold font-display tracking-tight text-[hsl(220,10%,92%)]"
            >
              {brandName}
            </motion.span>

            {/* Progress bar */}
            <div className="w-48 h-1 rounded-full bg-[hsl(220,20%,12%)] overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-[hsl(142,80%,55%)] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
