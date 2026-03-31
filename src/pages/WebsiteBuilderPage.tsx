import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useWebsiteContent, ALL_SECTION_KEYS, SECTION_DEFAULTS, SectionKey,
  HeroContent, PricingContent, TrainersContent, TestimonialsContent, GalleryContent,
  ServicesContent, EquipmentContent, ReviewsContent, BranchesContent,
  TrainerItem, TestimonialItem, GalleryMediaItem, ServiceItem, EquipmentItem, ReviewItem, BranchItem,
} from '@/hooks/useWebsiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ExternalLink, Plus, Trash2, Film, Image, Dumbbell, Sparkles, Star, MapPin, Phone } from 'lucide-react';

export default function WebsiteBuilderPage() {
  const { user, loading } = useAuth();
  const { sections, isLoading, getSectionContent, isSectionEnabled, upsertSection } = useWebsiteContent();

  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

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
          <TabsList className="flex flex-wrap w-full h-auto gap-1">
            {ALL_SECTION_KEYS.map(key => (
              <TabsTrigger key={key} value={key} className="capitalize text-xs sm:text-sm">{SECTION_DEFAULTS[key].label}</TabsTrigger>
            ))}
          </TabsList>

          {/* ─── HERO ─── */}
          <TabsContent value="hero">
            <SectionCard sectionKey="hero" toggles={toggles} setToggles={setToggles} onSave={() => save('hero')} saving={upsertSection.isPending}>
              <Field label="Title" value={drafts.hero?.title} onChange={v => updateDraft('hero', 'title', v)} />
              <Field label="Subtitle" value={drafts.hero?.subtitle} onChange={v => updateDraft('hero', 'subtitle', v)} textarea />
              <Field label="CTA Button Text" value={drafts.hero?.cta_text} onChange={v => updateDraft('hero', 'cta_text', v)} placeholder="Start Free Trial" />
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <p className="text-sm font-medium">Desktop Background</p>
                <Field label="Image URL" value={drafts.hero?.image_url} onChange={v => updateDraft('hero', 'image_url', v)} placeholder="https://..." />
                <Field label="Video URL (overrides image)" value={drafts.hero?.video_url} onChange={v => updateDraft('hero', 'video_url', v)} placeholder="https://...mp4" />
              </div>
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <p className="text-sm font-medium">Mobile Background (optional)</p>
                <Field label="Mobile Image URL" value={drafts.hero?.mobile_image_url} onChange={v => updateDraft('hero', 'mobile_image_url', v)} placeholder="https://..." />
                <Field label="Mobile Video URL" value={drafts.hero?.mobile_video_url} onChange={v => updateDraft('hero', 'mobile_video_url', v)} placeholder="https://...mp4 or YouTube URL" />
              </div>
              {/* Live Preview */}
              {(drafts.hero?.image_url || drafts.hero?.video_url) && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <p className="text-sm font-medium">Preview</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    {drafts.hero?.video_url ? (
                      (() => {
                        const ytMatch = drafts.hero.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
                        if (ytMatch) {
                          return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}?mute=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Hero preview" style={{ border: 0 }} />;
                        }
                        return <video src={drafts.hero.video_url} className="w-full h-full object-cover" muted loop playsInline autoPlay />;
                      })()
                    ) : drafts.hero?.image_url ? (
                      <img src={drafts.hero.image_url} alt="Hero preview" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80 flex items-center justify-center">
                      <div className="text-center text-white px-4">
                        <p className="text-lg font-bold font-display">{drafts.hero?.title || 'Your Title'}</p>
                        <p className="text-xs text-white/70 mt-1">{drafts.hero?.subtitle || 'Your Subtitle'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

          {/* ─── SERVICES ─── */}
          <TabsContent value="services">
            <SectionCard sectionKey="services" toggles={toggles} setToggles={setToggles} onSave={() => save('services')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.services?.title} onChange={v => updateDraft('services', 'title', v)} />
              <Field label="Subtitle" value={drafts.services?.subtitle} onChange={v => updateDraft('services', 'subtitle', v)} />
              <ItemList
                items={drafts.services?.items ?? []}
                onRemove={i => removeItem('services', i)}
                renderItem={(item: ServiceItem) => `${item.title}${item.description ? ` — ${item.description.slice(0, 40)}...` : ''}`}
              />
              <AddServiceForm onAdd={item => addItem('services', item)} />
            </SectionCard>
          </TabsContent>

          {/* ─── EQUIPMENT ─── */}
          <TabsContent value="equipment">
            <SectionCard sectionKey="equipment" toggles={toggles} setToggles={setToggles} onSave={() => save('equipment')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.equipment?.title} onChange={v => updateDraft('equipment', 'title', v)} />
              <Field label="Subtitle" value={drafts.equipment?.subtitle} onChange={v => updateDraft('equipment', 'subtitle', v)} />
              <ItemList
                items={drafts.equipment?.items ?? []}
                onRemove={i => removeItem('equipment', i)}
                renderItem={(item: EquipmentItem) => `${item.name}${item.description ? ` — ${item.description.slice(0, 40)}...` : ''}`}
              />
              <AddEquipmentForm onAdd={item => addItem('equipment', item)} />
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
                renderItem={(item: TestimonialItem) => {
                  const badge = item.video_url ? '🎥 ' : '';
                  return `${badge}${item.name}: "${(item.content ?? '').slice(0, 50)}..."`;
                }}
              />
              <AddTestimonialForm onAdd={item => addItem('testimonials', item)} />
            </SectionCard>
          </TabsContent>

          {/* ─── REVIEWS ─── */}
          <TabsContent value="reviews">
            <SectionCard sectionKey="reviews" toggles={toggles} setToggles={setToggles} onSave={() => save('reviews')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.reviews?.title} onChange={v => updateDraft('reviews', 'title', v)} />
              <Field label="Subtitle" value={drafts.reviews?.subtitle} onChange={v => updateDraft('reviews', 'subtitle', v)} />
              <ItemList
                items={drafts.reviews?.items ?? []}
                onRemove={i => removeItem('reviews', i)}
                renderItem={(item: ReviewItem) => `${'⭐'.repeat(item.rating)} ${item.name}: "${(item.text ?? '').slice(0, 40)}..."`}
              />
              <AddReviewForm onAdd={item => addItem('reviews', item)} />
            </SectionCard>
          </TabsContent>

          {/* ─── GALLERY ─── */}
          <TabsContent value="gallery">
            <SectionCard sectionKey="gallery" toggles={toggles} setToggles={setToggles} onSave={() => save('gallery')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.gallery?.title} onChange={v => updateDraft('gallery', 'title', v)} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(drafts.gallery?.items ?? []).map((g: GalleryMediaItem, i: number) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border bg-muted/20">
                    {g.type === 'video' ? (
                      <div className="w-full aspect-square flex items-center justify-center bg-muted/30">
                        <Film className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={g.url} alt={g.caption || 'Gallery'} className="w-full aspect-square object-cover" />
                    )}
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate">{g.type === 'video' ? '🎥 Video' : '🖼️ Image'}{g.caption ? ` — ${g.caption}` : ''}</p>
                    </div>
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={() => removeItem('gallery', i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <AddGalleryForm onAdd={item => addItem('gallery', item)} />
            </SectionCard>
          </TabsContent>

          {/* ─── BRANCHES ─── */}
          <TabsContent value="branches">
            <SectionCard sectionKey="branches" toggles={toggles} setToggles={setToggles} onSave={() => save('branches')} saving={upsertSection.isPending}>
              <Field label="Section Title" value={drafts.branches?.title} onChange={v => updateDraft('branches', 'title', v)} />
              <Field label="Subtitle" value={drafts.branches?.subtitle} onChange={v => updateDraft('branches', 'subtitle', v)} />
              <ItemList
                items={drafts.branches?.items ?? []}
                onRemove={i => removeItem('branches', i)}
                renderItem={(item: BranchItem) => `${item.name}${item.location ? ` — ${item.location}` : ''}`}
              />
              <AddBranchForm onAdd={item => addItem('branches', item)} />
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
  const [videoUrl, setVideoUrl] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), content: content || undefined, video_url: videoUrl || undefined });
    setName(''); setContent(''); setVideoUrl('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium">Add Testimonial</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <Input value={content} onChange={e => setContent(e.target.value)} placeholder="Testimonial text" />
      </div>
      <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video URL (YouTube / Instagram — optional)" />
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
    </div>
  );
}

function AddGalleryForm({ onAdd }: { onAdd: (item: GalleryMediaItem) => void }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const add = () => {
    if (!url.trim()) return;
    onAdd({ url: url.trim(), type, caption: caption || undefined });
    setUrl(''); setCaption(''); setType('image');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium">Add Media</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={type} onValueChange={v => setType(v as 'image' | 'video')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="image"><span className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Image</span></SelectItem>
            <SelectItem value="video"><span className="flex items-center gap-1.5"><Film className="h-3.5 w-3.5" /> Video</span></SelectItem>
          </SelectContent>
        </Select>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder={type === 'video' ? 'YouTube / Instagram URL' : 'Image URL'} />
        <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" />
      </div>
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
    </div>
  );
}

function AddServiceForm({ onAdd }: { onAdd: (item: ServiceItem) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const add = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: description || undefined, icon: icon || undefined, image_url: imageUrl || undefined });
    setTitle(''); setDescription(''); setIcon(''); setImageUrl('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Add Service</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Service title (e.g. Yoga)" />
        <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="Icon emoji (e.g. 🧘)" />
      </div>
      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" rows={2} />
      <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (optional, overrides icon)" />
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add Service</Button>
    </div>
  );
}

function AddEquipmentForm({ onAdd }: { onAdd: (item: EquipmentItem) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), description: description || undefined, image_url: imageUrl || undefined });
    setName(''); setDescription(''); setImageUrl('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" /> Add Equipment</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Equipment name" />
        <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" />
      </div>
      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)" rows={2} />
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add Equipment</Button>
    </div>
  );
}

function AddReviewForm({ onAdd }: { onAdd: (item: ReviewItem) => void }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), rating, text: text || undefined });
    setName(''); setRating(5); setText('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Add Review</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Reviewer name" />
        <Select value={String(rating)} onValueChange={v => setRating(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[5, 4, 3, 2, 1].map(r => (
              <SelectItem key={r} value={String(r)}>{'⭐'.repeat(r)} ({r})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Review text" />
      </div>
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add Review</Button>
    </div>
  );
}

function AddBranchForm({ onAdd }: { onAdd: (item: BranchItem) => void }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), location: location || undefined, contact: contact || undefined });
    setName(''); setLocation(''); setContact('');
  };
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Add Branch</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Branch name" />
        <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location / Address" />
        <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="Contact number" />
      </div>
      <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add Branch</Button>
    </div>
  );
}
