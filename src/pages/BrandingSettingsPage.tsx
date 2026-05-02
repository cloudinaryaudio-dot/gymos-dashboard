import { useState, useEffect, useRef, useMemo } from 'react';
import { useGymSettings } from '@/hooks/useGymSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Eye, Palette, Check, RefreshCw } from 'lucide-react';
import { useDemoMode } from '@/demo/DemoModeContext';
import { NoAccessCard } from '@/demo/NoAccessCard';



/* ── helpers ── */
function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
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

function hslToHex(hsl) {
    // Extract H, S, L values
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));

    const sNorm = s / 100;
    const lNorm = l / 100;

    // Calculate chroma
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;

    // Determine RGB based on hue
    if (h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    // Convert to HEX
    const toHex = (v) => {
        const hex = Math.round((v + m) * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToCss(hsl: string) { return `hsl(${hsl})`; }

interface ThemePreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;

  card: string;
  heading: string;
  description: string;
  button: string;
}

const PRESETS: ThemePreset[] = [
  {
    name: 'Fitness Green',
    primary: '#0F172A',
    secondary: '#111827',
    accent: '#22C55E',
    highlight: '#4ADE80',

    card: '#1F2937',
    heading: '#FFFFFF',
    description: '#9CA3AF',
    button: '#22C55E',
  },
  {
    name: 'Royal Blue',
    primary: '#0A192F',
    secondary: '#112240',
    accent: '#3B82F6',
    highlight: '#60A5FA',

    card: '#1E293B',
    heading: '#FFFFFF',
    description: '#94A3B8',
    button: '#3B82F6',
  },
  {
    name: 'Power Red',
    primary: '#1F0A0A',
    secondary: '#2A0E0E',
    accent: '#EF4444',
    highlight: '#F87171',

    card: '#2B1111',
    heading: '#FFFFFF',
    description: '#FCA5A5',
    button: '#EF4444',
  },
  {
    name: 'Premium Gold',
    primary: '#1A1405',
    secondary: '#2A2108',
    accent: '#EAB308',
    highlight: '#FACC15',

    card: '#2B220A',
    heading: '#FFFFFF',
    description: '#FDE68A',
    button: '#EAB308',
  },
  {
    name: 'Neon Purple',
    primary: '#140A1F',
    secondary: '#1E0F2A',
    accent: '#8B5CF6',
    highlight: '#A78BFA',

    card: '#221133',
    heading: '#FFFFFF',
    description: '#C4B5FD',
    button: '#8B5CF6',
  },
];

export default function BrandingSettingsPage() {
  const { resolved, isLoading, upsertSettings } = useGymSettings();
  const { isDemo, can } = useDemoMode();

  const [gymName, setGymName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [highlightColor, setHighlightColor] = useState('');
  const [cardColor, setCardColor] = useState('');
  const [headingColor, setHeadingColor] = useState('');
  const [descriptionColor, setDescriptionColor] = useState('');
  const [buttonColor, setButtonColor] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
  if (!isLoading && !initialized) {
    setGymName(resolved.gym_name);
    setLogoUrl(resolved.logo_url ?? '');

    setPrimaryColor(resolved.primary_color || "222 47% 11%");
    setSecondaryColor(resolved.secondary_color || "222 47% 15%");
    setAccentColor(resolved.accent_color || "142 71% 45%");
    setHighlightColor(resolved.highlight_color || "142 76% 60%");
    setCardColor(resolved.card_color || "217 33% 17%");
    setHeadingColor(resolved.heading_color || "0 0% 100%");
    setDescriptionColor(resolved.description_color || "215 20% 65%");
    setButtonColor(resolved.button_color || "142 71% 45%");

    // ✅ ADD HERE
    if (!resolved.primary_color) {
      applyPreset(PRESETS[0]);
      setActivePreset(PRESETS[0].name);
    }

    if (!resolved.card_color) {
  setCardColor(primaryColor);
}
if (!resolved.heading_color) {
  setHeadingColor("0 0% 100%");
}
if (!resolved.description_color) {
  setDescriptionColor("215 20% 65%");
}
if (!resolved.button_color) {
  setButtonColor(accentColor);
}

    setInitialized(true);
  }
}, [isLoading, initialized, resolved]);

  function applyPreset(preset: ThemePreset) {
  setPrimaryColor(hexToHsl(preset.primary));
  setSecondaryColor(hexToHsl(preset.secondary));
  setAccentColor(hexToHsl(preset.accent));
  setHighlightColor(hexToHsl(preset.highlight));

  setCardColor(hexToHsl(preset.card));
  setHeadingColor(hexToHsl(preset.heading));
  setDescriptionColor(hexToHsl(preset.description));
  setButtonColor(hexToHsl(preset.button));

  setActivePreset(preset.name);
}

  const handleSave = () => {
    upsertSettings.mutate({
      gym_name: gymName.trim() || 'My Gym',
      logo_url: logoUrl.trim() || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      highlight_color: highlightColor,
      card_color: cardColor.trim() || null,
      heading_color: headingColor.trim() || null,
      description_color: descriptionColor.trim() || null,
      button_color: buttonColor.trim() || null,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (isDemo && !can('settings', 'view')) return <NoAccessCard />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Branding Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your gym's brand identity and theme</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-6">
          {/* Theme Presets */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Theme Presets</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className={`relative rounded-xl p-3 text-left border transition-all duration-200 hover:scale-[1.02] ${
                      activePreset === p.name ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground/30'
                    }`}
                    style={{ background: p.primary }}
                  >
                    {activePreset === p.name && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex gap-1.5 mb-2">
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ background: p.accent }} />
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ background: p.highlight }} />
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ background: p.secondary }} />
                    </div>
                    <p className="text-xs font-medium" style={{ color: p.accent }}>{p.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Brand Identity</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Gym Name</Label>
                <Input value={gymName} onChange={e => setGymName(e.target.value)} placeholder="Elite Fitness Club" />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                {logoUrl && <img src={logoUrl} alt="Logo preview" className="mt-2 h-12 object-contain rounded" />}
              </div>
            </CardContent>
          </Card>

          <Card>
  <CardHeader>
    <CardTitle>Custom Colors (HSL)</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {[
      { label: 'Background (Primary)', value: primaryColor, set: setPrimaryColor },
      { label: 'Background (Secondary)', value: secondaryColor, set: setSecondaryColor },
      { label: 'Accent Color', value: accentColor, set: setAccentColor },
      { label: 'Highlight Color', value: highlightColor, set: setHighlightColor },
      { label: 'Card Background', value: cardColor, set: setCardColor },
      { label: 'Heading Text Color', value: headingColor, set: setHeadingColor },
      { label: 'Description Text Color', value: descriptionColor, set: setDescriptionColor },
      { label: 'Button Color', value: buttonColor, set: setButtonColor },
    ].map((c) => (
      <div key={c.label} className="space-y-1">
        
        {/* ✅ LABEL */}
        <Label className="text-xs">{c.label}</Label>

        <div className="flex items-center gap-3">
          
          {/* Color preview box */}
          <div
            className="h-8 w-8 rounded-lg border border-border shrink-0"
            style={{
              background: c.value ? hslToCss(c.value) : 'transparent',
            }}
          />

          {/* Picker + Input */}
          <div className="flex gap-2 flex-1">
            <input
              type="color"
              value={c.value ? hslToHex(c.value) : "#111827"}
              onChange={(e) => {
                c.set(hexToHsl(e.target.value));
                setActivePreset(null);
              }}
              className="h-8 w-10 p-0 border rounded"
            />

            <Input
              value={c.value}
              onChange={(e) => {
                c.set(e.target.value);
                setActivePreset(null);
              }}
              className="h-8 text-xs"
              placeholder="e.g. 142 71% 45%"
            />
          </div>
        </div>
      </div>
    ))}

    <p className="text-xs text-muted-foreground">
      Use color picker or adjust HSL manually. Leave optional fields empty to auto-derive from Primary/Accent.
    </p>
  </CardContent>
</Card>

          <Button onClick={handleSave} disabled={upsertSettings.isPending} className="w-full">
            <Save className="h-4 w-4 mr-2" />{upsertSettings.isPending ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>

        {/* Live Preview — full landing page in iframe with real-time theme sync */}
        <LivePreview
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          highlightColor={highlightColor}
          cardColor={cardColor}
          headingColor={headingColor}
          descriptionColor={descriptionColor}
          buttonColor={buttonColor}
        />
      </div>
    </div>
  );
}

/* ── Live Preview component ──
   Renders the public landing page inside an iframe so the owner sees the
   full website (navbar, hero, all sections, footer) updating in real time
   as they change colors. Theme is pushed via postMessage so changes apply
   without saving or reloading. */
interface LivePreviewProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  highlightColor: string;
  cardColor: string;
  headingColor: string;
  descriptionColor: string;
  buttonColor: string;
}

function LivePreview(props: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Build the CSS variables payload from current form state.
  const vars = useMemo(() => {
    const p = props.primaryColor;
    const s = props.secondaryColor;
    const a = props.accentColor;
    const h = props.highlightColor;
    const c = props.cardColor;
    const head = props.headingColor;
    const desc = props.descriptionColor;
    const btn = props.buttonColor || a;
    const hue = (p || '0').split(' ')[0];
    return {
      '--primary': btn,
      '--ring': btn,
      '--accent': btn,
      '--sidebar-primary': a,
      '--sidebar-ring': a,
      '--chart-1': a,
      '--highlight': h,
      '--website-bg': p,
      '--website-bg-secondary': s,
      '--ws-card': c || `${hue} 25% 7%`,
      '--card': c || `${hue} 25% 7%`,
      '--foreground': head,
      '--ws-text': head,
      '--card-foreground': head,
      '--muted-foreground': desc,
      '--ws-text-muted': desc,
      '--ws-text-label': desc,
      '--bg-gradient': `linear-gradient(to bottom, hsl(${p}), hsl(${s}))`,
      '--bg-primary': `hsl(${p})`,
      '--bg-secondary': `hsl(${s})`,
      '--card-bg': `hsl(${c || `${hue} 25% 7%`})`,
      '--card-border': `hsl(${hue} 20% 18%)`,
      '--color-accent': `hsl(${a})`,
      '--button-bg': `hsl(${btn})`,
      '--button-hover': `hsl(${h})`,
      '--button-text': '#FFFFFF',
      '--text-heading': `hsl(${head})`,
      '--text-description': `hsl(${desc})`,
      '--navbar-bg': `hsl(${p})`,
      '--footer-bg': `hsl(${s})`,
    } as Record<string, string>;
  }, [props]);

  // Listen for the iframe ready handshake.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'gymos-preview-ready') setReady(true);
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [reloadKey]);

  // Push vars whenever they change (and once iframe is ready).
  useEffect(() => {
    if (!ready) return;
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage({ type: 'gymos-theme-preview', vars }, '*');
  }, [ready, vars]);

  return (
    <Card className="sticky top-6 self-start">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> Live Preview
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setReady(false); setReloadKey(k => k + 1); }}
          title="Reload preview"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl overflow-hidden border border-border bg-muted">
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src="/"
            title="Landing page preview"
            className="w-full"
            style={{ height: '700px', border: 0, display: 'block' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Showing the full landing page. Color changes apply instantly — click Save to persist.
        </p>
      </CardContent>
    </Card>
  );
}
