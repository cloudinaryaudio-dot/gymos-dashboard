import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReminderTarget {
  id: string;
  name: string;
  phone: string;
  amount?: number;
  due_date?: string;
}

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ReminderTarget | null;
}

// Mock template store (could later move to dataService)
export const REMINDER_TEMPLATES: { id: string; label: string; body: string }[] = [
  {
    id: 'gentle',
    label: 'Gentle Reminder',
    body: 'Hi ${member_name}, just a friendly reminder that your gym payment of ₹${amount} is due on ${due_date}. Please complete it at your convenience. Thank you!',
  },
  {
    id: 'pending',
    label: 'Pending Payment',
    body: 'Hi ${member_name}, your payment of ₹${amount} is still pending (due ${due_date}). Kindly clear it to continue your membership. Thanks!',
  },
  {
    id: 'overdue',
    label: 'Overdue Notice',
    body: 'Hello ${member_name}, your payment of ₹${amount} was due on ${due_date} and is now overdue. Please pay at the earliest to avoid disruption.',
  },
  {
    id: 'final',
    label: 'Final Reminder',
    body: 'Hi ${member_name}, this is a final reminder for your pending payment of ₹${amount} (due ${due_date}). Please contact us if you need help.',
  },
  {
    id: 'renewal',
    label: 'Renewal',
    body: 'Hi ${member_name}, your membership expires on ${due_date}. Renew today to keep enjoying uninterrupted access to the gym!',
  },
];

function fillTemplate(body: string, t: ReminderTarget) {
  return body
    .replaceAll('${member_name}', t.name || 'Member')
    .replaceAll('${amount}', t.amount != null ? String(t.amount) : '—')
    .replaceAll('${due_date}', t.due_date ? format(new Date(t.due_date), 'dd MMM yyyy') : 'soon');
}

function whatsappUrl(phone: string, message?: string) {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  const full = clean.startsWith('91') ? clean : `91${clean}`;
  const base = `https://wa.me/${full}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function ReminderDialog({ open, onOpenChange, target }: ReminderDialogProps) {
  const [selected, setSelected] = useState<string>(REMINDER_TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState('');

  const previews = useMemo(() => {
    if (!target) return {};
    const map: Record<string, string> = {};
    REMINDER_TEMPLATES.forEach(t => { map[t.id] = fillTemplate(t.body, target); });
    return map;
  }, [target]);

  const finalMessage = customMessage.trim() || (target && previews[selected]) || '';

  const handleSend = () => {
    if (!target) return;
    window.open(whatsappUrl(target.phone, finalMessage), '_blank', 'noopener,noreferrer');
    onOpenChange(false);
    setCustomMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCustomMessage(''); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send Reminder {target ? `— ${target.name}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Choose a message template</p>
            <div className="space-y-2">
              {REMINDER_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelected(t.id); setCustomMessage(''); }}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition hover:border-primary/50',
                    selected === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium">{t.label}</span>
                    {selected === t.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {target ? previews[t.id] : t.body}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Edit message (optional)</p>
            <Textarea
              value={customMessage || (target ? previews[selected] : '')}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={!target?.phone} className="bg-green-600 hover:bg-green-700 text-white">
              <MessageCircle className="h-4 w-4 mr-2" /> Send via WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function whatsappDirect(phone: string) {
  return whatsappUrl(phone);
}
