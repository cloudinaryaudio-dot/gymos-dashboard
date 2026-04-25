import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, FileText, Download } from 'lucide-react';
import { useInvoiceSettings, DEFAULT_INVOICE_SETTINGS, type InvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';

const Dyn = ({ children }: { children: React.ReactNode }) => (
  <span className="text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">{children}</span>
);

export default function InvoiceSettingsPage() {
  const navigate = useNavigate();
  const { settings, save } = useInvoiceSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<InvoiceSettings>(settings);

  const update = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    save(form);
    toast({ title: '✅ Invoice template saved' });
  };

  const handleReset = () => {
    setForm(DEFAULT_INVOICE_SETTINGS);
    toast({ title: 'Reset to defaults (not yet saved)' });
  };

  const handlePreviewPdf = () => {
    generateInvoicePdf({
      member: {
        id: 'sample-member-id',
        name: 'John Doe',
        phone: '+91 99999 99999',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        plans: { name: 'Premium Monthly', duration_days: 30 },
      },
      payment: {
        id: 'sample-pay-id',
        amount: 2999,
        payment_date: new Date().toISOString().split('T')[0],
        method: 'upi',
        status: 'paid',
        note: 'Sample invoice preview',
      },
      totalPaid: 2999,
      planAmount: 2999,
      settings: form,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Invoice Template
            </h1>
            <p className="text-sm text-muted-foreground">Configure how your member invoices look</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          <Button variant="outline" onClick={handlePreviewPdf}>
            <Download className="h-4 w-4 mr-2" /> Sample PDF
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Settings Form ── */}
        <Card>
          <CardHeader><CardTitle>Gym & Template Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Gym Name</Label>
              <Input value={form.gym_name} onChange={(e) => update('gym_name', e.target.value)} />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Show address on invoice</span>
                <Switch checked={form.show_address} onCheckedChange={(v) => update('show_address', v)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Contact Number</Label>
                <Input value={form.contact_number} onChange={(e) => update('contact_number', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => update('email', e.target.value)} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Show email</span>
                  <Switch checked={form.show_email} onCheckedChange={(v) => update('show_email', v)} />
                </div>
              </div>
            </div>
            <div>
              <Label>Logo URL (optional)</Label>
              <Input value={form.logo_url} onChange={(e) => update('logo_url', e.target.value)} placeholder="https://..." />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Show logo</span>
                <Switch checked={form.show_logo} onCheckedChange={(v) => update('show_logo', v)} />
              </div>
            </div>
            <div>
              <Label>Thank You Message</Label>
              <Input value={form.thank_you_message} onChange={(e) => update('thank_you_message', e.target.value)} />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea rows={4} value={form.terms} onChange={(e) => update('terms', e.target.value)} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Show terms</span>
                <Switch checked={form.show_terms} onCheckedChange={(v) => update('show_terms', v)} />
              </div>
            </div>
            <div>
              <Label>Footer Text</Label>
              <Input value={form.footer_text} onChange={(e) => update('footer_text', e.target.value)} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Show footer</span>
                <Switch checked={form.show_footer} onCheckedChange={(v) => update('show_footer', v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Live Preview ── */}
        <Card className="lg:sticky lg:top-4 self-start">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <p className="text-xs text-muted-foreground">
              <Dyn>Highlighted</Dyn> values are dynamic — they get replaced with actual member & payment data.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white text-slate-900 p-6 text-sm shadow-sm">
              {/* Header */}
              <div className="bg-slate-900 text-white -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-lg flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold">{form.gym_name || 'Gym Name'}</div>
                  {form.show_address && form.address && <div className="text-xs opacity-80 mt-1">{form.address}</div>}
                  <div className="text-xs opacity-80 mt-0.5">
                    {form.contact_number}
                    {form.show_email && form.email && <> • {form.email}</>}
                  </div>
                </div>
                <div className="text-xl font-bold">INVOICE</div>
              </div>

              {/* Meta */}
              <div className="flex justify-between text-xs mb-3">
                <div><span className="font-semibold">Invoice ID:</span> <Dyn>{'${invoice_id}'}</Dyn></div>
                <div><span className="font-semibold">Date:</span> <Dyn>{'${date}'}</Dyn></div>
              </div>

              {/* Bill to */}
              <div className="bg-slate-100 p-3 rounded mb-4 text-xs space-y-1">
                <div className="font-bold mb-1">BILL TO</div>
                <div>Name: <Dyn>{'${member_name}'}</Dyn></div>
                <div>Phone: <Dyn>{'${member_phone}'}</Dyn></div>
                <div>Member ID: <Dyn>{'${member_id}'}</Dyn></div>
              </div>

              {/* Table */}
              <div className="border rounded overflow-hidden mb-4 text-xs">
                <div className="bg-slate-900 text-white grid grid-cols-5 px-2 py-2 font-semibold">
                  <div className="col-span-2">Description</div>
                  <div>Method</div>
                  <div>Status</div>
                  <div className="text-right">Amount</div>
                </div>
                <div className="grid grid-cols-5 px-2 py-2">
                  <div className="col-span-2"><Dyn>{'${plan_name}'}</Dyn></div>
                  <div><Dyn>{'${method}'}</Dyn></div>
                  <div><Dyn>{'${status}'}</Dyn></div>
                  <div className="text-right"><Dyn>{'${amount}'}</Dyn></div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end mb-4">
                <div className="w-2/3 text-xs space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span> <Dyn>{'${amount}'}</Dyn></div>
                  <div className="flex justify-between"><span>Paid:</span> <Dyn>{'${paid}'}</Dyn></div>
                  <div className="flex justify-between text-red-600"><span>Balance:</span> <Dyn>{'${balance}'}</Dyn></div>
                  <div className="flex justify-between border-t border-slate-900 pt-1 font-bold text-sm">
                    <span>TOTAL</span> <Dyn>{'${total}'}</Dyn>
                  </div>
                </div>
              </div>

              {/* Terms */}
              {form.show_terms && form.terms && (
                <div className="text-xs mb-3">
                  <div className="font-bold mb-1">Terms & Conditions:</div>
                  <div className="whitespace-pre-line text-slate-600">{form.terms}</div>
                </div>
              )}

              {/* Thank you */}
              {form.thank_you_message && (
                <div className="text-center italic text-sm my-4">{form.thank_you_message}</div>
              )}

              {/* Footer */}
              {form.show_footer && form.footer_text && (
                <div className="text-center text-[10px] text-slate-400 border-t pt-2 mt-3">
                  {form.footer_text}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
