import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useWebsiteContent, ALL_SECTION_KEYS, SECTION_DEFAULTS, SectionKey,
  HeroContent, PricingContent, TrainersContent, TestimonialsContent, GalleryContent,
  TrainerItem, TestimonialItem, GalleryImageItem,
} from '@/hooks/useWebsiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ExternalLink, Plus, Trash2 } from 'lucide-react';

export default function WebsiteBuilderPage() {
  const { user, loading } = useAuth();
  const { sections, isLoading, getSectionContent, isSectionEnabled, upsertSection } = useWebsiteContent();

  // Local draft state per section
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  // Sync from server
  useEffect(() => {
    if (!sections.length) return;
    const d: Record<string, any> = {};
    const t: Record<string, boolean> = {};
    for (const key of ALL_SECTION_KEYS) {
      d[key] = getSectionContent(key);
      t[key] = isSectionEnabled(key);
    }
    setDrafts(d);
    setToggles(t);
  }, [sections]);

  if (loading) return null;

  const updateDraft = (key: SectionKey, field: string, value: any) => {
    setDrafts(prev => ({ ...prev, [key]: { ...(prev[key] ?? SECTION_DEFAULTS[key].defaultContent), [field]: value } }));
  };

  const save = (key: SectionKey) => {
    upsertSection.mutate({
      section_key: key,
      is_enabled: toggles[key] ?? false,
      content: drafts[key] ?? SECTION_DEFAULTS[key].defaultContent,
    });
  };

  const addItem = (key: SectionKey, item: any) => {
    const current = drafts[key] ?? SECTION_DEFAULTS[key].defaultContent;
    const items = [...(current.items ?? []), item];
    setDrafts(prev => ({ ...prev, [key]: { ...current, items } }));
  };

  const removeItem = (key: SectionKey, index: number) => {
    const current = drafts[key] ?? SECTION_DEFAULTS[key].defaultContent;
    const items = [...(current.items ?? [])];
    items.splice(index, 1);
    setDrafts(prev => ({ ...prev, [key]: { ...current, items } }));
  };

  const publicUrl = `${window.location.origin}/`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Website Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your public gym page sections</p>
        </div>
        <Button variant="outline" onClick={() => window.open(publicUrl, '_blank')}>
          <ExternalLink className="h-4 w-4 mr-2" />View Public Page
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <Tabs defaultValue="hero">
          <TabsList className="grid grid-cols-5 w-full">
            {ALL_SECTION_KEYS.map(key => (
              <TabsTrigger key={key} value={key} className="capitalize">{SECTION_DEFAULTS[key].label}</TabsTrigger>
            ))}
          </TabsList>

          {/* ─── HERO ─── */}
          <TabsContent value="hero">
            <SectionCard sectionKey="hero" toggles={toggles} setToggles={setToggles} onSave={() => save('hero')} saving={upsertSection.isPending}>
              <Field label="Title" value={drafts.hero?.title} onChange={v => updateDraft('hero', 'title', v)} />
              <Field label="Subtitle" value={drafts.hero?.subtitle} onChange={v => updateDraft('hero', 'subtitle', v)} textarea />
              <Field label="Background Image URL" value={drafts.hero?.image_url} onChange={v => updateDraft('hero', 'image_url', v)} placeholder="https://..." />
              <Field label="CTA Button Text" value={drafts.hero?.cta_text} onChange={v => updateDraft('hero', 'cta_text', v)} placeholder="Start Free Trial" />
            </SectionCard>
          </TabsContent>

          {/* ─── PRICING ─── */}
          <TabsContent value="pricing">
            <SectionCard sectionKey="pricing" toggles={toggles} setToggles={setToggles} onSave={() => save('pricing')} saving={upsertSection.isPending}>
              <Field label="Title" value={drafts.pricing?.title} onChange={v => updateDraft('pricing', 'title', v)} />
              <Field label="Subtitle" value={drafts.pricing?.subtitle} onChange={v => updateDraft('pricing', 'subtitle', v)} textarea />
              <Field label="CTA Note" value={drafts.pricing?.cta_note} onChange={v => updateDraft('pricing', 'cta_note', v)} placeholder="⚡ Limited slots" />
              <p className="text-xs text-muted-foreground">Plans are pulled automatically from your Plans page.</p>
            </SectionCard>
          </TabsContent>

          {/* ─── TRAINERS ─── */}
          <TabsContent value="trainers">
            <SectionCard sectionKey="trainers" toggles={toggles} setToggles={setToggles} onSave={() => save('trainers')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.trainers?.title} onChange={v => updateDraft('trainers', 'title', v)} />
              <Field label="Subtitle" value={drafts.trainers?.subtitle} onChange={v => updateDraft('trainers', 'subtitle', v)} />
              <ItemList
                items={drafts.trainers?.items ?? []}
                onRemove={i => removeItem('trainers', i)}
                renderItem={(item: TrainerItem) => `${item.name}${item.specialization ? ` — ${item.specialization}` : ''}`}
              />
              <AddTrainerForm onAdd={item => addItem('trainers', item)} />
            </SectionCard>
          </TabsContent>

          {/* ─── TESTIMONIALS ─── */}
          <TabsContent value="testimonials">
            <SectionCard sectionKey="testimonials" toggles={toggles} setToggles={setToggles} onSave={() => save('testimonials')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.testimonials?.title} onChange={v => updateDraft('testimonials', 'title', v)} />
              <Field label="Subtitle" value={drafts.testimonials?.subtitle} onChange={v => updateDraft('testimonials', 'subtitle', v)} />
              <ItemList
                items={drafts.testimonials?.items ?? []}
                onRemove={i => removeItem('testimonials', i)}
                renderItem={(item: TestimonialItem) => `${item.name}: "${(item.content ?? '').slice(0, 60)}..."`}
              />
              <AddTestimonialForm onAdd={item => addItem('testimonials', item)} />
            </SectionCard>
          </TabsContent>

          {/* ─── GALLERY ─── */}
          <TabsContent value="gallery">
            <SectionCard sectionKey="gallery" toggles={toggles} setToggles={setToggles} onSave={() => save('gallery')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.gallery?.title} onChange={v => updateDraft('gallery', 'title', v)} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(drafts.gallery?.items ?? []).map((g: GalleryImageItem, i: number) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border">
                    <img src={g.image_url} alt={g.caption || 'Gallery'} className="w-full aspect-square object-cover" />
                    {g.caption && <p className="text-xs p-2 text-muted-foreground">{g.caption}</p>}
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={() => removeItem('gallery', i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <AddGalleryForm onAdd={item => addItem('gallery', item)} />
            </SectionCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─── Shared Components ───

function SectionCard({ sectionKey, toggles, setToggles, onSave, saving, children }: {
  sectionKey: SectionKey; toggles: Record<string, boolean>; setToggles: (fn: any) => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="capitalize">{SECTION_DEFAULTS[sectionKey].label} Section</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-${sectionKey}`} className="text-sm text-muted-foreground">
            {toggles[sectionKey] ? 'Visible' : 'Hidden'}
          </Label>
          <Switch
            id={`toggle-${sectionKey}`}
            checked={toggles[sectionKey] ?? false}
            onCheckedChange={v => setToggles((prev: any) => ({ ...prev, [sectionKey]: v }))}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Section'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder, textarea }: {
  label: string; value?: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} />
      ) : (
        <Input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function ItemList({ items, onRemove, renderItem }: { items: any[]; onRemove: (i: number) => void; renderItem: (item: any) => string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground py-4 text-center">No items added yet</p>;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <span className="text-sm">{renderItem(item)}</span>
          <Button variant="ghost" size="icon" onClick={() => onRemove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
    </div>
  );
}

function AddTrainerForm({ onAdd }: { onAdd: (item: TrainerItem) => void }) {
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [img, setImg] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), specialization: spec || undefined, image_url: img || undefined });
    setName(''); setSpec(''); setImg('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium">Add Trainer</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <Input value={spec} onChange={e => setSpec(e.target.value)} placeholder="Specialization" />
        <Input value={img} onChange={e => setImg(e.target.value)} placeholder="Image URL" />
      </div>
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
    </div>
  );
}

function AddTestimonialForm({ onAdd }: { onAdd: (item: TestimonialItem) => void }) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), content: content || undefined });
    setName(''); setContent('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium">Add Testimonial</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <Input value={content} onChange={e => setContent(e.target.value)} placeholder="Testimonial text" />
      </div>
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
    </div>
  );
}

function AddGalleryForm({ onAdd }: { onAdd: (item: GalleryImageItem) => void }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const add = () => {
    if (!url.trim()) return;
    onAdd({ image_url: url.trim(), caption: caption || undefined });
    setUrl(''); setCaption('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium">Add Image</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL" />
        <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" />
      </div>
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
    </div>
  );
}
