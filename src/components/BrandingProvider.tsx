import { useEffect } from 'react';
import { useGymSettings } from '@/hooks/useGymSettings';

function hexToHSL(hex: string): string | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function deriveShades(primaryHex: string, secondaryHex: string) {
  const p = hexToHSL(primaryHex);
  const s = hexToHSL(secondaryHex);
  if (!p || !s) return null;

  // Parse HSL components from primary
  const [pH, pS, pL] = p.split(' ').map((v, i) => i === 0 ? parseInt(v) : parseInt(v));

  // Generate derived shades based on primary hue/sat
  const hue = pH;
  const sat = Math.min(pS, 25); // Keep saturation subtle for backgrounds

  return {
    '--website-bg': p,
    '--website-bg-secondary': s,
    '--ws-card': `${hue} ${sat}% 7%`,
    '--ws-card-alt': `${hue} ${sat}% 5%`,
    '--ws-darker': `${hue} ${sat}% 4%`,
    '--ws-border': `${hue} ${Math.min(sat, 20)}% 12%`,
    '--ws-border-light': `${hue} ${Math.min(sat, 20)}% 18%`,
    '--ws-border-dim': `${hue} ${Math.min(sat, 20)}% 10%`,
    '--ws-social-proof': `${hue} ${sat}% 6%`,
    '--ws-input': `${hue} ${sat}% 4%`,
  };
}

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

    // Derive all website shades from primary/secondary
    const shades = deriveShades(resolved.primary_color, resolved.secondary_color);
    if (shades) {
      Object.entries(shades).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    return () => {
      ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--chart-1', '--accent', '--highlight',
       '--website-bg', '--website-bg-secondary',
       '--ws-card', '--ws-card-alt', '--ws-darker', '--ws-border', '--ws-border-light', '--ws-border-dim',
       '--ws-social-proof', '--ws-input',
      ].forEach(v => root.style.removeProperty(v));
    };
  }, [resolved, isLoading]);

  return <>{children}</>;
}
