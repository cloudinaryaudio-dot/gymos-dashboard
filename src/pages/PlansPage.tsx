import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, Plan } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

function PlanForm({ plan, onSubmit, onCancel }: {
  plan?: Plan;
  onSubmit: (data: { name: string; price: number; duration_days: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(plan?.price?.toString() ?? '');
  const [duration, setDuration] = useState(plan?.duration_days?.toString() ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, price: parseFloat(price), duration_days: parseInt(duration) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Plan Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Premium" required />
      </div>
      <div className="space-y-2">
        <Label>Price (₹)</Label>
        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" required min="0" step="0.01" />
      </div>
      <div className="space-y-2">
        <Label>Duration (days)</Label>
        <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" required min="1" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{plan ? 'Update' : 'Create'} Plan</Button>
      </div>
    </form>
  );
}

export default function PlansPage() {
  const { user, loading } = useAuth();
  const { data: plans, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async (data: { name: string; price: number; duration_days: number }) => {
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...data });
        toast({ title: 'Plan updated!' });
      } else {
        await createPlan.mutateAsync(data);
        toast({ title: 'Plan created!' });
      }
      setDialogOpen(false);
      setEditingPlan(undefined);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlan.mutateAsync(id);
      toast({ title: 'Plan deleted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Plans</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your membership plans</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPlan(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              </DialogHeader>
              <PlanForm plan={editingPlan} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : plans && plans.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>₹{plan.price.toLocaleString()}</TableCell>
                      <TableCell>{plan.duration_days} days</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingPlan(plan); setDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No plans yet. Create your first plan!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
