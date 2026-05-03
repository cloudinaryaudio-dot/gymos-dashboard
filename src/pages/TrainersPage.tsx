import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Dumbbell, Users, IndianRupee, BarChart3, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDemoMode } from '@/demo/DemoModeContext';
import { ViewOnlyPill } from '@/demo/ViewOnlyPill';
import { VendorFilter, useDemoVendorFilter } from '@/demo/VendorFilter';
import { NoAccessCard } from '@/demo/NoAccessCard';
import {
  useTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer,
  useTrainerAssignments, useTrainerSessions,
  type Trainer, type TrainerAssignment, type TrainerSession,
} from '@/hooks/useTrainers';
import { AssignPTDialog } from '@/components/AssignPTDialog';

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

function TrainerForm({ trainer, onSubmit, onCancel }: {
  trainer?: Trainer;
  onSubmit: (d: { name: string; phone: string; specialization: string; experience: number; is_active: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(trainer?.name ?? '');
  const [phone, setPhone] = useState(trainer?.phone ?? '');
  const [specialization, setSpec] = useState(trainer?.specialization ?? '');
  const [experience, setExp] = useState(trainer?.experience ?? 0);
  const [isActive, setActive] = useState(trainer?.is_active ?? true);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, phone, specialization, experience: Number(experience), is_active: isActive }); }} className="space-y-3">
      <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} required /></div>
      <div className="space-y-1.5"><Label>Specialization</Label><Input value={specialization} onChange={e => setSpec(e.target.value)} required placeholder="e.g. Strength & Conditioning" /></div>
      <div className="space-y-1.5"><Label>Experience (years)</Label><Input type="number" min={0} value={experience} onChange={e => setExp(Number(e.target.value))} required /></div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5"><Label>Active</Label><p className="text-xs text-muted-foreground">Inactive trainers cannot take new PT plans</p></div>
        <Switch checked={isActive} onCheckedChange={setActive} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{trainer ? 'Update' : 'Add'} Trainer</Button>
      </div>
    </form>
  );
}

export default function TrainersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: trainers = [], isLoading } = useTrainers();
  const { data: assignments = [] } = useTrainerAssignments();
  const { data: sessions = [] } = useTrainerSessions();
  const createT = useCreateTrainer();
  const updateT = useUpdateTrainer();
  const deleteT = useDeleteTrainer();

  const { isDemo, can } = useDemoMode();
  const canEdit = !isDemo || can('trainers' as any, 'edit');
  const canView = !isDemo || can('trainers' as any, 'view');
  const { vendorId: vfId, setVendorId: setVfId, filter: vendorFilter } = useDemoVendorFilter();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | undefined>();
  const [assignOpen, setAssignOpen] = useState(false);

  const visibleTrainers = useMemo(() => vendorFilter(trainers as any) as Trainer[], [trainers, vendorFilter]);
  const visibleAssignments = useMemo(() => vendorFilter(assignments as any) as TrainerAssignment[], [assignments, vendorFilter]);
  const visibleSessions = useMemo(() => vendorFilter(sessions as any) as TrainerSession[], [sessions, vendorFilter]);

  // Stats
  const activeTrainers = visibleTrainers.filter(t => t.is_active).length;
  const ptClients = new Set(visibleAssignments.filter(a => a.sessions_completed < a.total_sessions).map(a => a.member_id)).size;
  const ptRevenue = visibleAssignments.reduce((s, a) => s + a.price, 0);
  const last7 = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const cutStr = cutoff.toISOString().slice(0, 10);
    return visibleSessions.filter((s: any) => s.status === 'completed' && s.date >= cutStr).length;
  })();

  // Per-trainer rollup
  const rollup = useMemo(() => {
    const byTrainer = new Map<string, { active: number; revenue: number; sessions: number }>();
    visibleAssignments.forEach((a: any) => {
      const r = byTrainer.get(a.trainer_id) ?? { active: 0, revenue: 0, sessions: 0 };
      if (a.sessions_completed < a.total_sessions) r.active += 1;
      r.revenue += a.price;
      byTrainer.set(a.trainer_id, r);
    });
    visibleSessions.forEach((s: any) => {
      if (s.status !== 'completed') return;
      const r = byTrainer.get(s.trainer_id) ?? { active: 0, revenue: 0, sessions: 0 };
      r.sessions += 1;
      byTrainer.set(s.trainer_id, r);
    });
    return byTrainer;
  }, [visibleAssignments, visibleSessions]);

  const handleSubmit = async (d: any) => {
    try {
      if (editing) {
        await updateT.mutateAsync({ id: editing.id, ...d });
        toast({ title: 'Trainer updated' });
      } else {
        await createT.mutateAsync(d);
        toast({ title: 'Trainer added' });
      }
      setOpen(false); setEditing(undefined);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteT.mutateAsync(id); toast({ title: 'Trainer removed' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (isDemo && !canView) return <NoAccessCard />;

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            Trainers <ViewOnlyPill module={'trainers' as any} />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage trainers & personal training (PT) plans</p>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          <VendorFilter value={vfId} onChange={setVfId} className="w-full sm:w-auto" />
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setAssignOpen(true)} disabled={!canEdit || activeTrainers === 0}>
            <Users className="h-4 w-4 mr-2" /> Assign PT
          </Button>
          <Dialog open={open} onOpenChange={(o) => { if (o && !canEdit) return; setOpen(o); if (!o) setEditing(undefined); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" disabled={!canEdit}>
                <Plus className="h-4 w-4 mr-2" /> Add Trainer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader><DialogTitle>{editing ? 'Edit Trainer' : 'Add Trainer'}</DialogTitle></DialogHeader>
              <TrainerForm trainer={editing} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(undefined); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Dumbbell className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Active Trainers</p><p className="text-xl font-bold">{activeTrainers}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2"><Users className="h-5 w-5 text-emerald-500" /></div>
          <div><p className="text-xs text-muted-foreground">PT Clients</p><p className="text-xl font-bold">{ptClients}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2"><BarChart3 className="h-5 w-5 text-amber-500" /></div>
          <div><p className="text-xs text-muted-foreground">Sessions (7d)</p><p className="text-xl font-bold">{last7}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2"><IndianRupee className="h-5 w-5 text-violet-500" /></div>
          <div><p className="text-xs text-muted-foreground">PT Revenue</p><p className="text-xl font-bold">{inr(ptRevenue)}</p></div>
        </CardContent></Card>
      </div>

      {/* Trainers list — table on md+, card list on mobile */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : visibleTrainers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No trainers yet. Add your first trainer.</div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trainer</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Exp</TableHead>
                      <TableHead>Active PT</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleTrainers.map(t => {
                      const r = rollup.get(t.id) ?? { active: 0, revenue: 0, sessions: 0 };
                      return (
                        <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/app/trainers/${t.id}`)}>
                          <TableCell>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">{t.phone}</div>
                          </TableCell>
                          <TableCell>{t.specialization}</TableCell>
                          <TableCell>{t.experience}y</TableCell>
                          <TableCell>{r.active}</TableCell>
                          <TableCell>{r.sessions}</TableCell>
                          <TableCell>{inr(r.revenue)}</TableCell>
                          <TableCell>
                            {t.is_active
                              ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">Active</Badge>
                              : <Badge variant="outline">Inactive</Badge>}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {visibleTrainers.map(t => {
                  const r = rollup.get(t.id) ?? { active: 0, revenue: 0, sessions: 0 };
                  return (
                    <button key={t.id} className="w-full text-left p-4 active:bg-muted/40" onClick={() => navigate(`/app/trainers/${t.id}`)}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.specialization} · {t.experience}y</div>
                        </div>
                        {t.is_active
                          ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">Active</Badge>
                          : <Badge variant="outline"><Power className="h-3 w-3 mr-1" />Off</Badge>}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div><div className="text-muted-foreground">PT</div><div className="font-semibold">{r.active}</div></div>
                        <div><div className="text-muted-foreground">Sessions</div><div className="font-semibold">{r.sessions}</div></div>
                        <div><div className="text-muted-foreground">Revenue</div><div className="font-semibold">{inr(r.revenue)}</div></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AssignPTDialog open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  );
}
