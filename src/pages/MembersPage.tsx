import { useState } from 'react';
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
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { addDays, format } from 'date-fns';

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

export default function MembersPage() {
  const { user, loading } = useAuth();
  const { data: members, isLoading } = useMembers();
  const { data: plans } = usePlans();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Members</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your gym members</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMember(undefined); }}>
            <DialogTrigger asChild>
              <Button disabled={!plans || plans.length === 0}>
                <Plus className="h-4 w-4 mr-2" />Add Member
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

        {(!plans || plans.length === 0) && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                You need to create at least one plan before adding members.{' '}
                <a href="/settings" className="text-primary hover:underline">Go to Plans →</a>
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
                  {members.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.plans?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'destructive'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(member.expiry_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No members yet. Add your first member!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
