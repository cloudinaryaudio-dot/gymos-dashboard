import { useState } from 'react';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, Plan } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Package, Crown, X, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/demo/DemoModeContext';
import { ViewOnlyPill } from '@/demo/ViewOnlyPill';

const CATEGORIES = ['general', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Male', 'Female', 'Couple'];

function PlanForm({ plan, onSubmit, onCancel }: {
  plan?: Plan;
  onSubmit: (data: { name: string; price: number; duration_days: number; category: string; benefits: string[]; is_highlighted: boolean; show_on_homepage: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(plan?.price?.toString() ?? '');
  const [duration, setDuration] = useState(plan?.duration_days?.toString() ?? '');
  const [category, setCategory] = useState((plan as any)?.category ?? 'general');
  const [benefits, setBenefits] = useState<string[]>((plan as any)?.benefits ?? []);
  const [isHighlighted, setIsHighlighted] = useState((plan as any)?.is_highlighted ?? false);
  const [showOnHomepage, setShowOnHomepage] = useState((plan as any)?.show_on_homepage ?? false);
  const [newBenefit, setNewBenefit] = useState('');

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, price: parseFloat(price), duration_days: parseInt(duration), category, benefits, is_highlighted: isHighlighted, show_on_homepage: showOnHomepage });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Plan Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Premium" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price (₹)</Label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" required min="0" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label>Duration (days)</Label>
          <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" required min="1" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c === 'general' ? 'General' : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Benefits</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {benefits.map((b, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {b}
              <button type="button" onClick={() => removeBenefit(i)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newBenefit}
            onChange={e => setNewBenefit(e.target.value)}
            placeholder="e.g. Full gym access"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addBenefit}>Add</Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={isHighlighted} onCheckedChange={setIsHighlighted} />
        <Label className="flex items-center gap-1.5">
          <Crown className="h-4 w-4 text-primary" /> Mark as "Most Popular"
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={showOnHomepage} onCheckedChange={setShowOnHomepage} />
        <Label className="flex items-center gap-1.5">
          🏠 Show on Homepage
        </Label>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{plan ? 'Update' : 'Create'} Plan</Button>
      </div>
    </form>
  );
}

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isDemo, can } = useDemoMode();
  const canEdit = !isDemo || can('settings', 'edit');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();

  const handleSubmit = async (data: { name: string; price: number; duration_days: number; category: string; benefits: string[]; is_highlighted: boolean; show_on_homepage: boolean }) => {
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
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your membership plans</p>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/app/plans/dashboard')}>
            <BarChart3 className="h-4 w-4 mr-2" /> Plans Dashboard
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPlan(undefined); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Plan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              </DialogHeader>
              <PlanForm plan={editingPlan} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="responsive-card-table"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Homepage</TableHead>
                  <TableHead>Highlight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell data-label="Name" className="font-medium">{plan.name}</TableCell>
                    <TableCell data-label="Price">₹{plan.price.toLocaleString()}</TableCell>
                    <TableCell data-label="Duration">{plan.duration_days} days</TableCell>
                    <TableCell data-label="Category">
                      <Badge variant="outline" className="capitalize">{plan.category || 'general'}</Badge>
                    </TableCell>
                    <TableCell data-label="Homepage">
                      {plan.show_on_homepage ? <span className="text-primary font-medium text-sm">🏠 Yes</span> : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell data-label="Highlight">
                      {plan.is_highlighted ? <Crown className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell data-label="Actions" className="text-right actions-cell">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">No plans yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Create your first membership plan to start adding members to your gym.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
