import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRenewMembership } from '@/hooks/useRenewMembership';
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import type { Member } from '@/hooks/useMembers';
import type { Plan } from '@/hooks/usePlans';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  plans: Plan[];
}

const methods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export function RenewDialog({ open, onOpenChange, member, plans }: Props) {
  const currentPlan = plans.find(p => p.id === member.plan_id);
  const [planId, setPlanId] = useState(member.plan_id ?? plans[0]?.id ?? '');
  const [method, setMethod] = useState('cash');
  const renew = useRenewMembership();
  const { toast } = useToast();

  const selectedPlan = plans.find(p => p.id === planId);
  const today = new Date();
  const expiryBase = new Date(member.expiry_date) > today ? new Date(member.expiry_date) : today;
  const newExpiry = selectedPlan ? format(addDays(expiryBase, selectedPlan.duration_days), 'dd MMM yyyy') : '';

  const handleRenew = async () => {
    if (!selectedPlan) return;
    try {
      await renew.mutateAsync({
        memberId: member.id,
        planId: selectedPlan.id,
        durationDays: selectedPlan.duration_days,
        amount: selectedPlan.price,
        currentExpiry: member.expiry_date,
        method,
      });
      toast({ title: 'Membership renewed!', description: `${member.name}'s membership extended to ${newExpiry}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> Renew Membership
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium text-sm">{member.name}</p>
            <p className="text-xs text-muted-foreground">Current expiry: {format(new Date(member.expiry_date), 'dd MMM yyyy')}</p>
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ₹{p.price} ({p.duration_days}d)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {methods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedPlan && (
            <div className="p-3 rounded-lg bg-primary/5 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">₹{selectedPlan.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Expiry</span>
                <span className="font-semibold text-primary">{newExpiry}</span>
              </div>
            </div>
          )}
          <Button className="w-full" onClick={handleRenew} disabled={!selectedPlan || renew.isPending}>
            {renew.isPending ? 'Renewing...' : 'Confirm Renewal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
