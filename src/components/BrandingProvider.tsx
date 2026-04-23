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

/** Accept either an HSL triple ("220 25% 8%") or a hex (#0F172A) and return HSL triple. */
function toHsl(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith('#')) return hexToHSL(v);
  return v;
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

    // ── Detect light vs dark theme based on primary bg lightness ──
    // resolved.primary_color is an HSL triple like "220 25% 6%"
    const lightnessStr = resolved.primary_color.split(' ')[2] ?? '0%';
    const lightness = parseFloat(lightnessStr);
    if (Number.isFinite(lightness) && lightness > 60) {
      root.setAttribute('data-theme-mode', 'light');
    } else {
      root.setAttribute('data-theme-mode', 'dark');
    }

    // Derive all website shades from primary/secondary
    const shades = deriveShades(resolved.primary_color, resolved.secondary_color);
    if (shades) {
      Object.entries(shades).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // ── Full design-token system ──────────────────────────────────────
    // Background gradient (primary -> secondary)
    const primaryHsl = resolved.primary_color;
    const secondaryHsl = resolved.secondary_color;
    root.style.setProperty(
      '--bg-gradient',
      `linear-gradient(to bottom, hsl(${primaryHsl}), hsl(${secondaryHsl}))`,
    );

    // Optional admin overrides (each falls back to a sensible derived value)
    const cardOverride = toHsl(resolved.card_color);
    if (cardOverride) {
      root.style.setProperty('--card', cardOverride);
      root.style.setProperty('--ws-card', cardOverride);
    }

    const headingOverride = toHsl(resolved.heading_color);
    if (headingOverride) {
      root.style.setProperty('--foreground', headingOverride);
      root.style.setProperty('--ws-text', headingOverride);
      root.style.setProperty('--card-foreground', headingOverride);
    }

    const descOverride = toHsl(resolved.description_color);
    if (descOverride) {
      root.style.setProperty('--muted-foreground', descOverride);
      root.style.setProperty('--ws-text-muted', descOverride);
      root.style.setProperty('--ws-text-label', descOverride);
    }

    const buttonOverride = toHsl(resolved.button_color);
    if (buttonOverride) {
      // Button color overrides primary (which drives all primary buttons)
      root.style.setProperty('--primary', buttonOverride);
      root.style.setProperty('--ring', buttonOverride);
      root.style.setProperty('--accent', buttonOverride);
    }

    // ── Alias tokens (--bg-primary, --card-bg, --button-bg ...) ──
    // Always recompute from the *currently* resolved tokens so any change
    // flows through to components that use these aliases directly.
    const finalCard = cardOverride ?? `${resolved.primary_color.split(' ')[0]} ${Math.min(parseInt(resolved.primary_color.split(' ')[1]) || 25, 25)}% 7%`;
    const finalHeading = headingOverride ?? '220 10% 92%';
    const finalDesc = descOverride ?? '220 10% 55%';
    const accentForBtn = buttonOverride ?? resolved.accent_color;

    root.style.setProperty('--bg-primary', `hsl(${resolved.primary_color})`);
    root.style.setProperty('--bg-secondary', `hsl(${resolved.secondary_color})`);
    root.style.setProperty('--card-bg', `hsl(${finalCard})`);
    root.style.setProperty('--card-border', `hsl(${resolved.primary_color.split(' ')[0]} 20% 18%)`);
    root.style.setProperty('--color-accent', `hsl(${resolved.accent_color})`);
    root.style.setProperty('--button-bg', `hsl(${accentForBtn})`);
    root.style.setProperty('--button-hover', `hsl(${resolved.highlight_color})`);
    root.style.setProperty('--button-text', '#FFFFFF');
    root.style.setProperty('--text-heading', `hsl(${finalHeading})`);
    root.style.setProperty('--text-description', `hsl(${finalDesc})`);
    root.style.setProperty('--navbar-bg', `hsl(${resolved.primary_color})`);
    root.style.setProperty('--footer-bg', `hsl(${resolved.secondary_color})`);

    return () => {
      ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--chart-1', '--accent', '--highlight',
       '--website-bg', '--website-bg-secondary',
       '--ws-card', '--ws-card-alt', '--ws-darker', '--ws-border', '--ws-border-light', '--ws-border-dim',
       '--ws-social-proof', '--ws-input',
       '--bg-gradient', '--card', '--foreground', '--card-foreground',
       '--ws-text', '--muted-foreground', '--ws-text-muted', '--ws-text-label',
       '--bg-primary', '--bg-secondary', '--card-bg', '--card-border', '--color-accent',
       '--button-bg', '--button-hover', '--button-text', '--text-heading', '--text-description',
       '--navbar-bg', '--footer-bg',
      ].forEach(v => root.style.removeProperty(v));
    };
  }, [resolved, isLoading]);

  return <>{children}</>;
}
