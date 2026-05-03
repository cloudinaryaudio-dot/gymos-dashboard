import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMembers } from '@/hooks/useMembers';
import { useTrainers, useCreateAssignment } from '@/hooks/useTrainers';
import { format, addDays } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pre-select a trainer (e.g. opened from trainer detail page). */
  trainerId?: string;
}

export function AssignPTDialog({ open, onOpenChange, trainerId: presetTrainer }: Props) {
  const { data: trainers = [] } = useTrainers();
  const { data: members = [] } = useMembers();
  const create = useCreateAssignment();
  const { toast } = useToast();

  const [trainerId, setTrainerId] = useState(presetTrainer ?? '');
  const [memberId, setMemberId] = useState('');
  const [totalSessions, setTotalSessions] = useState(12);
  const [price, setPrice] = useState(7999);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 90), 'yyyy-MM-dd'));

  const activeTrainers = trainers.filter(t => t.is_active);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        trainer_id: trainerId, member_id: memberId,
        total_sessions: Number(totalSessions), price: Number(price),
        start_date: startDate, end_date: endDate,
      });
      toast({ title: 'PT plan assigned' });
      onOpenChange(false);
      setMemberId('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader><DialogTitle>Assign PT Plan</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Trainer</Label>
            <Select value={trainerId} onValueChange={setTrainerId} required>
              <SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger>
              <SelectContent>
                {activeTrainers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name} · {t.specialization}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId} required>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total Sessions</Label>
              <Input type="number" min={1} value={totalSessions} onChange={e => setTotalSessions(Number(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" min={0} value={price} onChange={e => setPrice(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !trainerId || !memberId}>Assign</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
