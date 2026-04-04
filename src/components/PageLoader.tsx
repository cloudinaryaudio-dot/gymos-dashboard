import { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

interface PageLoaderProps {
  brandName?: string;
  brandLogo?: string | null;
  loaderText?: string;
  duration?: number;
  enabled?: boolean;
}

export function PageLoader({
  brandName = 'GymOS',
  brandLogo,
  loaderText,
  duration = 3000,
  enabled = true,
}: PageLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!enabled || sessionStorage.getItem('gymos-loaded')) {
      setVisible(false);
      return;
    }

    const clampedDuration = Math.max(2000, Math.min(4000, duration));
    const progressInterval = clampedDuration * 0.7;
    const tickInterval = 60;
    const increment = 100 / (progressInterval / tickInterval);

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment + (Math.random() * increment * 0.3);
        return Math.min(next, 100);
      });
    }, tickInterval);

    const exitTimer = setTimeout(() => {
      setExiting(true);
      clearInterval(interval);
      setProgress(100);
    }, clampedDuration - 600);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('gymos-loaded', '1');
    }, clampedDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [enabled, duration]);

  if (!visible) return null;

  const displayText = loaderText || brandName;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[hsl(220,25%,4%)] transition-all duration-600 ${exiting ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
          style={{ animation: 'loader-glow 2s ease-in-out infinite' }}
        />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{ animation: 'loader-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
      >
        {/* Logo / Icon */}
        {brandLogo ? (
          <img
            src={brandLogo}
            alt={brandName}
            className="h-20 w-20 rounded-2xl object-cover shadow-2xl shadow-primary/20"
            style={{ animation: 'loader-pulse 2s ease-in-out infinite' }}
          />
        ) : (
          <div
            className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(142,71%,35%)] flex items-center justify-center shadow-2xl shadow-primary/30"
            style={{ animation: 'loader-pulse 2s ease-in-out infinite' }}
          >
            <Dumbbell className="h-10 w-10 text-primary-foreground" />
          </div>
        )}

        {/* Brand text */}
        <span
          className="text-2xl font-bold font-display tracking-tight text-[hsl(220,10%,92%)]"
          style={{ animation: 'loader-text-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both' }}
        >
          {displayText}
        </span>

        {/* Progress ring + bar combo */}
        <div className="flex flex-col items-center gap-4 mt-2">
          {/* Circular progress ring */}
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(220,20%,12%)" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke="url(#loader-gradient)" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(progress, 100) / 100)}`}
                className="transition-all duration-100"
              />
              <defs>
                <linearGradient id="loader-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" />
                  <stop offset="100%" stopColor="hsl(142, 80%, 55%)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[hsl(220,10%,60%)]">
              {Math.round(Math.min(progress, 100))}%
            </span>
          </div>

          {/* Linear progress bar */}
          <div className="w-48 h-1 rounded-full bg-[hsl(220,20%,12%)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[hsl(142,80%,55%)] rounded-full transition-all duration-100"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loader-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.25; }
        }
        @keyframes loader-enter {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes loader-text-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loader-pulse {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(3deg) scale(1.02); }
          75% { transform: rotate(-3deg) scale(1.02); }
        }
      `}</style>
    </div>
  );
}
