import { useState, useEffect } from 'react';
import { useGymSettings } from '@/hooks/useGymSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Dumbbell, Eye } from 'lucide-react';

function hslToString(h: number, s: number, l: number) {
  return `${h} ${s}% ${l}%`;
}

function parseHSL(val: string): [number, number, number] {
  const parts = val.replace(/%/g, '').trim().split(/\s+/).map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function hslToCssColor(hsl: string) {
  return `hsl(${hsl})`;
}

export default function BrandingSettingsPage() {
  const { resolved, isLoading, upsertSettings } = useGymSettings();

  const [gymName, setGymName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryH, setPrimaryH] = useState(142);
  const [primaryS, setPrimaryS] = useState(71);
  const [primaryL, setPrimaryL] = useState(45);
  const [secondaryH, setSecondaryH] = useState(220);
  const [secondaryS, setSecondaryS] = useState(25);
  const [secondaryL, setSecondaryL] = useState(8);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && !initialized) {
      setGymName(resolved.gym_name);
      setLogoUrl(resolved.logo_url ?? '');
      const [ph, ps, pl] = parseHSL(resolved.primary_color);
      setPrimaryH(ph); setPrimaryS(ps); setPrimaryL(pl);
      const [sh, ss, sl] = parseHSL(resolved.secondary_color);
      setSecondaryH(sh); setSecondaryS(ss); setSecondaryL(sl);
      setInitialized(true);
    }
  }, [isLoading, initialized]);

  const primaryColor = hslToString(primaryH, primaryS, primaryL);
  const secondaryColor = hslToString(secondaryH, secondaryS, secondaryL);

  const handleSave = () => {
    upsertSettings.mutate({
      gym_name: gymName.trim() || 'My Gym',
      logo_url: logoUrl.trim() || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Branding Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your gym's brand identity</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Form */}
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

            <div className="space-y-3">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border border-border shrink-0" style={{ background: hslToCssColor(primaryColor) }} />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <span>H</span>
                    <input type="range" min={0} max={360} value={primaryH} onChange={e => setPrimaryH(+e.target.value)} className="flex-1" />
                    <span className="w-8 text-right">{primaryH}</span>
                  </div>
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <span>S</span>
                    <input type="range" min={0} max={100} value={primaryS} onChange={e => setPrimaryS(+e.target.value)} className="flex-1" />
                    <span className="w-8 text-right">{primaryS}%</span>
                  </div>
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <span>L</span>
                    <input type="range" min={0} max={100} value={primaryL} onChange={e => setPrimaryL(+e.target.value)} className="flex-1" />
                    <span className="w-8 text-right">{primaryL}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border border-border shrink-0" style={{ background: hslToCssColor(secondaryColor) }} />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <span>H</span>
                    <input type="range" min={0} max={360} value={secondaryH} onChange={e => setSecondaryH(+e.target.value)} className="flex-1" />
                    <span className="w-8 text-right">{secondaryH}</span>
                  </div>
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <span>S</span>
                    <input type="range" min={0} max={100} value={secondaryS} onChange={e => setSecondaryS(+e.target.value)} className="flex-1" />
                    <span className="w-8 text-right">{secondaryS}%</span>
                  </div>
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <span>L</span>
                    <input type="range" min={0} max={100} value={secondaryL} onChange={e => setSecondaryL(+e.target.value)} className="flex-1" />
                    <span className="w-8 text-right">{secondaryL}%</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={upsertSettings.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" />{upsertSettings.isPending ? 'Saving...' : 'Save Branding'}
            </Button>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Live Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden border border-border" style={{ background: hslToCssColor(secondaryColor) }}>
              {/* Preview Navbar */}
              <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `hsl(${secondaryH} ${secondaryS}% ${secondaryL + 10}%)` }}>
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-7 w-7 rounded object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: hslToCssColor(primaryColor) }}>
                      <Dumbbell className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-white">{gymName || 'My Gym'}</span>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 px-3 rounded text-[10px] font-medium flex items-center text-white" style={{ background: hslToCssColor(primaryColor) }}>
                    Join Now
                  </div>
                </div>
              </div>
              {/* Preview Hero */}
              <div className="px-6 py-10 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Transform Your Body</h3>
                <p className="text-xs mb-4" style={{ color: `hsl(${secondaryH} 10% 60%)` }}>Build discipline. Get results.</p>
                <div className="flex justify-center gap-2">
                  <div className="h-7 px-4 rounded text-[10px] font-medium flex items-center text-white" style={{ background: hslToCssColor(primaryColor) }}>
                    Start Trial
                  </div>
                  <div className="h-7 px-4 rounded text-[10px] font-medium flex items-center border text-white" style={{ borderColor: `hsl(${secondaryH} ${secondaryS}% ${secondaryL + 15}%)` }}>
                    View Plans
                  </div>
                </div>
              </div>
              {/* Preview Cards */}
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                {['Basic', 'Standard', 'Premium'].map((plan, i) => (
                  <div key={plan} className="rounded-lg p-3 text-center" style={{ background: `hsl(${secondaryH} ${secondaryS}% ${secondaryL + 5}%)` }}>
                    <p className="text-[10px] text-white/60">{plan}</p>
                    <p className="text-sm font-bold text-white">₹{[999, 1999, 4999][i]}</p>
                    <div className="mt-2 h-5 rounded text-[8px] font-medium flex items-center justify-center text-white" style={{ background: i === 1 ? hslToCssColor(primaryColor) : `hsl(${secondaryH} ${secondaryS}% ${secondaryL + 12}%)` }}>
                      {i === 1 ? 'Popular' : 'Select'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
