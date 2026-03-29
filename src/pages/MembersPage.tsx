import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember, Member } from '@/hooks/useMembers';
import { usePlans } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Users, Zap, MessageCircle, RefreshCw } from 'lucide-react';
import { addDays, format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { RenewDialog } from '@/components/RenewDialog';

function getExpiryInfo(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = differenceInDays(expiry, today);

  if (daysLeft < 0) return { label: 'Expired', variant: 'expired' as const, daysLeft };
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, variant: 'expiring' as const, daysLeft };
  return { label: 'Active', variant: 'active' as const, daysLeft };
}

function getWhatsAppUrl(phone: string, name: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const message = encodeURIComponent(
    `Hi ${name}, your gym membership is expiring soon. Please renew.`
  );
  return `https://wa.me/${fullPhone}?text=${message}`;
}

function MemberForm({ member, plans, onSubmit, onCancel }: {
  member?: Member;
  plans: { id: string; name: string; duration_days: number }[];
  onSubmit: (data: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [planId, setPlanId] = useState(member?.plan_id ?? '');
  const [startDate, setStartDate] = useState(member?.start_date ?? format(new Date(), 'yyyy-MM-dd'));

  const selectedPlan = plans.find(p => p.id === planId);
  const expiryDate = selectedPlan && startDate
    ? format(addDays(new Date(startDate), selectedPlan.duration_days), 'yyyy-MM-dd')
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !expiryDate) return;
    onSubmit({ name, phone, plan_id: planId, start_date: startDate, expiry_date: expiryDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Member name" required />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
      </div>
      <div className="space-y-2">
        <Label>Plan</Label>
        <Select value={planId} onValueChange={setPlanId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} ({plan.duration_days} days)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Start Date</Label>
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      </div>
      {expiryDate && (
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            Expiry Date: <span className="font-medium text-foreground">{format(new Date(expiryDate), 'dd MMM yyyy')}</span>
          </p>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!planId}>{member ? 'Update' : 'Add'} Member</Button>
      </div>
    </form>
  );
}

function QuickAddForm({ plans, onSubmit, onCancel }: {
  plans: { id: string; name: string; duration_days: number }[];
  onSubmit: (data: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');

  const selectedPlan = plans.find(p => p.id === planId);
  const today = format(new Date(), 'yyyy-MM-dd');
  const expiryDate = selectedPlan
    ? format(addDays(new Date(), selectedPlan.duration_days), 'yyyy-MM-dd')
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !expiryDate) return;
    onSubmit({ name, phone, plan_id: planId, start_date: today, expiry_date: expiryDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Member name" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" required />
      </div>
      <div className="space-y-2">
        <Label>Plan</Label>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} ({plan.duration_days}d)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {expiryDate && (
        <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
          Starts today · Expires <span className="font-medium text-foreground">{format(new Date(expiryDate), 'dd MMM yyyy')}</span>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={!planId}>
        <Zap className="h-4 w-4 mr-2" /> Add Member
      </Button>
    </form>
  );
}

export default function MembersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: members, isLoading } = useMembers();
  const { data: plans } = usePlans();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [renewMember, setRenewMember] = useState<Member | undefined>();

  if (loading) return null;

  const handleSubmit = async (data: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) => {
    try {
      if (editingMember) {
        await updateMember.mutateAsync({ id: editingMember.id, ...data });
        toast({ title: 'Member updated!' });
      } else {
        await createMember.mutateAsync(data);
        toast({ title: 'Member added!' });
      }
      setDialogOpen(false);
      setQuickAddOpen(false);
      setEditingMember(undefined);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast({ title: 'Member deleted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Count expiry alerts
  const expiringCount = members?.filter(m => {
    const info = getExpiryInfo(m.expiry_date);
    return info.variant === 'expiring';
  }).length ?? 0;

  const expiredCount = members?.filter(m => {
    const info = getExpiryInfo(m.expiry_date);
    return info.variant === 'expired';
  }).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your gym members
            {(expiringCount > 0 || expiredCount > 0) && (
              <span className="ml-2">
                {expiringCount > 0 && (
                  <Badge variant="outline" className="ml-1 border-yellow-500 text-yellow-600 bg-yellow-500/10">
                    {expiringCount} expiring
                  </Badge>
                )}
                {expiredCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {expiredCount} expired
                  </Badge>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Quick Add */}
          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!plans || plans.length === 0}>
                <Zap className="h-4 w-4 mr-2" /> Quick Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> Quick Add Member
                </DialogTitle>
              </DialogHeader>
              {plans && plans.length > 0 && (
                <QuickAddForm
                  plans={plans}
                  onSubmit={handleSubmit}
                  onCancel={() => setQuickAddOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Full Add */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMember(undefined); }}>
            <DialogTrigger asChild>
              <Button disabled={!plans || plans.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
              </DialogHeader>
              {plans && plans.length > 0 && (
                <MemberForm
                  member={editingMember}
                  plans={plans}
                  onSubmit={handleSubmit}
                  onCancel={() => setDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(!plans || plans.length === 0) && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              You need to create at least one plan before adding members.{' '}
              <a href="/app/plans" className="text-primary hover:underline">Go to Plans →</a>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : members && members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => {
                  const expiry = getExpiryInfo(member.expiry_date);
                  return (
                    <TableRow
                      key={member.id}
                      className={cn(
                        'cursor-pointer',
                        expiry.variant === 'expired' && 'bg-destructive/5',
                        expiry.variant === 'expiring' && 'bg-yellow-500/5'
                      )}
                      onClick={() => navigate(`/app/members/${member.id}`)}
                    >
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.plans?.name ?? '—'}</TableCell>
                      <TableCell>
                        {expiry.variant === 'expired' ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : expiry.variant === 'expiring' ? (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10">
                            {expiry.label}
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          expiry.variant === 'expired' && 'text-destructive font-medium',
                          expiry.variant === 'expiring' && 'text-yellow-600 font-medium'
                        )}>
                          {format(new Date(member.expiry_date), 'dd MMM yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Renew"
                            onClick={() => setRenewMember(member)}
                          >
                            <RefreshCw className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            asChild
                          >
                            <a
                              href={getWhatsAppUrl(member.phone, member.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contact on WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingMember(member); setDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">No members yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Add your first member to start managing your gym. You can quick-add or use the full form.
              </p>
              <Button onClick={() => plans && plans.length > 0 ? setQuickAddOpen(true) : undefined} disabled={!plans || plans.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Member
              </Button>
              {(!plans || plans.length === 0) && (
                <p className="text-xs text-muted-foreground mt-3">
                  First, <a href="/app/plans" className="text-primary hover:underline">create a plan</a> to get started.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Renew Dialog */}
      {plans && renewMember && (
        <RenewDialog
          open={!!renewMember}
          onOpenChange={(open) => { if (!open) setRenewMember(undefined); }}
          member={renewMember}
          plans={plans}
        />
      )}
    </div>
  );
}
