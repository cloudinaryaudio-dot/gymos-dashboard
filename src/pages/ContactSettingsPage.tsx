import { useState, useEffect } from 'react';
import { useContactSettings } from '@/hooks/useContactSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MessageCircle, Instagram, Save } from 'lucide-react';
import { useDemoMode } from '@/demo/DemoModeContext';
import { NoAccessCard } from '@/demo/NoAccessCard';

export default function ContactSettingsPage() {
  const { isDemo, can } = useDemoMode();
  const { settings, isLoading, upsertSettings } = useContactSettings();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('Hi! I am interested in joining your gym.');
  const [instagramUrl, setInstagramUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setWhatsappNumber(settings.whatsapp_number ?? '');
      setWhatsappMessage(settings.whatsapp_message ?? 'Hi! I am interested in joining your gym.');
      setInstagramUrl(settings.instagram_url ?? '');
    }
  }, [settings]);

  const handleSave = () => {
    upsertSettings.mutate({
      whatsapp_number: whatsappNumber.trim() || null,
      whatsapp_message: whatsappMessage.trim() || null,
      instagram_url: instagramUrl.trim() || null,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (isDemo && !can('settings', 'view')) return <NoAccessCard />;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Contact Settings</h1>
        <p className="text-muted-foreground mt-1">Configure floating WhatsApp & Instagram buttons on your public website.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp
          </CardTitle>
          <CardDescription>Visitors will be able to message you directly on WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number (with country code)</Label>
            <Input
              placeholder="919876543210"
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Enter without + or spaces. E.g. 919876543210</p>
          </div>
          <div className="space-y-2">
            <Label>Default Message</Label>
            <Textarea
              placeholder="Hi! I am interested in joining your gym."
              value={whatsappMessage}
              onChange={e => setWhatsappMessage(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram
          </CardTitle>
          <CardDescription>Link to your gym's Instagram profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Instagram Profile URL</Label>
            <Input
              placeholder="https://instagram.com/yourgym"
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsertSettings.isPending} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" />
        {upsertSettings.isPending ? 'Saving...' : 'Save Contact Settings'}
      </Button>
    </div>
  );
}
