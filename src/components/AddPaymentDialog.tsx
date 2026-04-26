import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePayment } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: { id: string; name: string; phone?: string; plans?: { name: string } | null } | null;
  defaultAmount?: number;
}

const methods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export function AddPaymentDialog({ open, onOpenChange, member, defaultAmount }: AddPaymentDialogProps) {
  const createPayment = useCreatePayment();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('cash');
  const [status, setStatus] = useState('paid');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount ? String(defaultAmount) : '');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setMethod('cash');
      setStatus('paid');
      setNote('');
    }
  }, [open, defaultAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !amount) return;
    try {
      await createPayment.mutateAsync({
        member_id: member.id,
        amount: parseFloat(amount),
        payment_date: date,
        method,
        status,
        note: note || undefined,
      });
      toast({ title: '✅ Payment recorded!', description: `₹${amount} from ${member.name}` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add Payment {member ? `— ${member.name}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {member?.plans?.name && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p><span className="text-muted-foreground">Plan:</span> {member.plans.name}</p>
              {member.phone && <p><span className="text-muted-foreground">Phone:</span> {member.phone}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              placeholder="Enter custom or partial amount"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Partial / custom payments allowed</p>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {methods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Any note..." />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createPayment.isPending || !amount}>Save Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
