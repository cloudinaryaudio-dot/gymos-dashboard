import { useEffect } from 'react';
import { useGymSettings } from '@/hooks/useGymSettings';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { resolved, isLoading } = useGymSettings();

  useEffect(() => {
    if (isLoading) return;
    const root = document.documentElement;

    // Primary/secondary are now background tones; accent is the brand color
    root.style.setProperty('--primary', resolved.accent_color);
    root.style.setProperty('--ring', resolved.accent_color);
    root.style.setProperty('--sidebar-primary', resolved.accent_color);
    root.style.setProperty('--sidebar-ring', resolved.accent_color);
    root.style.setProperty('--chart-1', resolved.accent_color);
    root.style.setProperty('--accent', resolved.accent_color);

    // Expose highlight for gradient usage
    root.style.setProperty('--highlight', resolved.highlight_color);

    // Website background tones
    root.style.setProperty('--website-bg', resolved.primary_color);
    root.style.setProperty('--website-bg-secondary', resolved.secondary_color);

    return () => {
      ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--chart-1', '--accent', '--highlight', '--website-bg', '--website-bg-secondary'].forEach(v => root.style.removeProperty(v));
    };
  }, [resolved, isLoading]);

  return <>{children}</>;
}
