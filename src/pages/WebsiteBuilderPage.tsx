import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteContent } from '@/hooks/useWebsiteContent';
import { useWebsiteContent } from '@/hooks/useWebsiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ExternalLink, Save } from 'lucide-react';

const SECTION_TYPES = ['hero', 'pricing'] as const;

export default function WebsiteBuilderPage() {
  const { user, loading } = useAuth();
  const {
    sections, testimonials, gallery, trainers, isLoading,
    upsertSection, addTestimonial, deleteTestimonial,
    addGalleryItem, deleteGalleryItem, addTrainer, deleteTrainer,
  } = useWebsiteContent();

  // Section form state
  const [editSection, setEditSection] = useState<Record<string, any>>({});

  // Testimonial form
  const [tOpen, setTOpen] = useState(false);
  const [tName, setTName] = useState('');
  const [tContent, setTContent] = useState('');
  const [tVideo, setTVideo] = useState('');

  // Gallery form
  const [gOpen, setGOpen] = useState(false);
  const [gUrl, setGUrl] = useState('');
  const [gCaption, setGCaption] = useState('');

  // Trainer form
  const [trOpen, setTrOpen] = useState(false);
  const [trName, setTrName] = useState('');
  const [trSpec, setTrSpec] = useState('');
  const [trImg, setTrImg] = useState('');

  if (loading) return null;

  const getSectionData = (type: string) => {
    const existing = sections.find(s => s.section_type === type);
    return editSection[type] ?? existing ?? { section_type: type, title: '', subtitle: '', content: '', image_url: '', video_url: '' };
  };

  const updateField = (type: string, field: string, value: string) => {
    const current = getSectionData(type);
    setEditSection(prev => ({ ...prev, [type]: { ...current, [field]: value } }));
  };

  const saveSection = (type: string) => {
    const data = getSectionData(type);
    const existing = sections.find(s => s.section_type === type);
    upsertSection.mutate({ ...data, id: existing?.id, section_type: type });
  };

  const publicUrl = `${window.location.origin}/gym/${user.id}`;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Website Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your public gym page</p>
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
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="trainers">Trainers</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            {SECTION_TYPES.map(type => {
              const data = getSectionData(type);
              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="capitalize">{type} Section</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div><Label>Title</Label><Input value={data.title ?? ''} onChange={e => updateField(type, 'title', e.target.value)} /></div>
                      <div><Label>Subtitle</Label><Input value={data.subtitle ?? ''} onChange={e => updateField(type, 'subtitle', e.target.value)} /></div>
                      <div><Label>Content</Label><Textarea value={data.content ?? ''} onChange={e => updateField(type, 'content', e.target.value)} rows={4} /></div>
                      <div><Label>Image URL</Label><Input value={data.image_url ?? ''} onChange={e => updateField(type, 'image_url', e.target.value)} placeholder="https://..." /></div>
                      <div><Label>Video URL (YouTube or Instagram)</Label><Input value={data.video_url ?? ''} onChange={e => updateField(type, 'video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
                      <Button onClick={() => saveSection(type)} disabled={upsertSection.isPending}>
                        <Save className="h-4 w-4 mr-2" />{upsertSection.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}

            {/* Trainers */}
            <TabsContent value="trainers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold">Trainers</h3>
                <Dialog open={trOpen} onOpenChange={setTrOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Trainer</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Trainer</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name</Label><Input value={trName} onChange={e => setTrName(e.target.value)} /></div>
                      <div><Label>Specialization</Label><Input value={trSpec} onChange={e => setTrSpec(e.target.value)} placeholder="Strength Training" /></div>
                      <div><Label>Image URL</Label><Input value={trImg} onChange={e => setTrImg(e.target.value)} placeholder="https://..." /></div>
                      <Button className="w-full" onClick={() => {
                        if (!trName.trim()) return;
                        addTrainer.mutate({ name: trName.trim(), specialization: trSpec || undefined, image_url: trImg || undefined }, {
                          onSuccess: () => { setTrOpen(false); setTrName(''); setTrSpec(''); setTrImg(''); },
                        });
                      }} disabled={addTrainer.isPending}>{addTrainer.isPending ? 'Adding...' : 'Add'}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-3">
                {trainers.map(t => (
                  <Card key={t.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {t.image_url && <img src={t.image_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />}
                        <div>
                          <p className="font-medium">{t.name}</p>
                          {t.specialization && <p className="text-sm text-muted-foreground">{t.specialization}</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteTrainer.mutate(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {trainers.length === 0 && <p className="text-center text-muted-foreground py-8">No trainers added</p>}
              </div>
            </TabsContent>

            {/* Testimonials */}
            <TabsContent value="testimonials" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold">Testimonials</h3>
                <Dialog open={tOpen} onOpenChange={setTOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Testimonial</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Testimonial</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name</Label><Input value={tName} onChange={e => setTName(e.target.value)} /></div>
                      <div><Label>Text (optional if video)</Label><Textarea value={tContent} onChange={e => setTContent(e.target.value)} rows={3} /></div>
                      <div><Label>Video URL (YouTube/Instagram, optional)</Label><Input value={tVideo} onChange={e => setTVideo(e.target.value)} placeholder="https://..." /></div>
                      <Button className="w-full" onClick={() => {
                        if (!tName.trim()) return;
                        addTestimonial.mutate({ name: tName.trim(), content: tContent || undefined, video_url: tVideo || undefined }, {
                          onSuccess: () => { setTOpen(false); setTName(''); setTContent(''); setTVideo(''); },
                        });
                      }} disabled={addTestimonial.isPending}>{addTestimonial.isPending ? 'Adding...' : 'Add'}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-3">
                {testimonials.map(t => (
                  <Card key={t.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        {t.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.content}</p>}
                        {t.video_url && <p className="text-xs text-primary mt-1">🎥 Video attached</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteTestimonial.mutate(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {testimonials.length === 0 && <p className="text-center text-muted-foreground py-8">No testimonials added</p>}
              </div>
            </TabsContent>

            {/* Gallery */}
            <TabsContent value="gallery" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold">Gallery</h3>
                <Dialog open={gOpen} onOpenChange={setGOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Image</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Gallery Image</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Image URL</Label><Input value={gUrl} onChange={e => setGUrl(e.target.value)} placeholder="https://..." /></div>
                      <div><Label>Caption (optional)</Label><Input value={gCaption} onChange={e => setGCaption(e.target.value)} /></div>
                      <Button className="w-full" onClick={() => {
                        if (!gUrl.trim()) return;
                        addGalleryItem.mutate({ image_url: gUrl.trim(), caption: gCaption || undefined }, {
                          onSuccess: () => { setGOpen(false); setGUrl(''); setGCaption(''); },
                        });
                      }} disabled={addGalleryItem.isPending}>{addGalleryItem.isPending ? 'Adding...' : 'Add'}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map(g => (
                  <div key={g.id} className="relative group rounded-lg overflow-hidden border">
                    <img src={g.image_url} alt={g.caption || 'Gallery'} className="w-full aspect-square object-cover" />
                    {g.caption && <p className="text-xs p-2 text-muted-foreground">{g.caption}</p>}
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={() => deleteGalleryItem.mutate(g.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {gallery.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No images added</p>}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
  );
}
