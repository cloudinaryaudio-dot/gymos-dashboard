import { useEffect } from 'react';
import { useGymSettings } from '@/hooks/useGymSettings';

/**
 * Applies gym branding (primary/secondary colors) as CSS custom properties
 * on the document root, so all themed components update live.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { resolved, isLoading } = useGymSettings();

  useEffect(() => {
    if (isLoading) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', resolved.primary_color);
    root.style.setProperty('--ring', resolved.primary_color);
    root.style.setProperty('--accent', resolved.primary_color);
    root.style.setProperty('--sidebar-primary', resolved.primary_color);
    root.style.setProperty('--sidebar-ring', resolved.primary_color);
    root.style.setProperty('--chart-1', resolved.primary_color);

    return () => {
      // Reset to defaults when unmounting (e.g., logging out)
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--chart-1');
    };
  }, [resolved.primary_color, isLoading]);

  return <>{children}</>;
}
