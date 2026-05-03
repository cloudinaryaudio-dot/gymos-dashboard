import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Trash2, Plus, IndianRupee, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useTrainers, useTrainerAssignments, useTrainerSessions, useMarkSession, useDeleteAssignment } from '@/hooks/useTrainers';
import { useMembers } from '@/hooks/useMembers';
import { AssignPTDialog } from '@/components/AssignPTDialog';
import { useDemoMode } from '@/demo/DemoModeContext';
import { format } from 'date-fns';

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function TrainerDetailPage() {
  const { trainerId } = useParams<{ trainerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: trainers = [] } = useTrainers();
  const { data: assignments = [] } = useTrainerAssignments();
  const { data: sessions = [] } = useTrainerSessions();
  const { data: members = [] } = useMembers();
  const mark = useMarkSession();
  const del = useDeleteAssignment();
  const { isDemo, can } = useDemoMode();
  const canEdit = !isDemo || can('trainers' as any, 'edit');

  const [assignOpen, setAssignOpen] = useState(false);

  const trainer = trainers.find(t => t.id === trainerId);
  const tAssigns = useMemo(() => assignments.filter(a => a.trainer_id === trainerId), [assignments, trainerId]);
  const tSessions = useMemo(() => sessions.filter(s => s.trainer_id === trainerId), [sessions, trainerId]);
  const memberById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  if (!trainer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/app/trainers')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <p className="text-muted-foreground">Trainer not found.</p>
      </div>
    );
  }

  const activeAssigns = tAssigns.filter(a => a.sessions_completed < a.total_sessions);
  const completed = tSessions.filter(s => s.status === 'completed').length;
  const missed = tSessions.filter(s => s.status === 'missed').length;
  const revenue = tAssigns.reduce((s, a) => s + a.price, 0);

  const handleMark = async (assignment_id: string, status: 'completed' | 'missed') => {
    try { await mark.mutateAsync({ assignment_id, status }); toast({ title: status === 'completed' ? 'Session marked complete' : 'Session marked missed' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleEnd = async (id: string) => {
    try { await del.mutateAsync(id); toast({ title: 'Assignment removed' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6 max-w-full">
      <Button variant="ghost" onClick={() => navigate('/app/trainers')}><ArrowLeft className="h-4 w-4 mr-2" />Back to Trainers</Button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            {trainer.name}
            {trainer.is_active
              ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">Active</Badge>
              : <Badge variant="outline">Inactive</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">{trainer.specialization} · {trainer.experience}y experience · {trainer.phone}</p>
        </div>
        <Button onClick={() => setAssignOpen(true)} disabled={!canEdit || !trainer.is_active}>
          <Plus className="h-4 w-4 mr-2" /> Assign Member
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Active PT</p><p className="text-xl font-bold">{activeAssigns.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
          <div><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold">{completed}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-rose-500/10 p-2"><XCircle className="h-5 w-5 text-rose-500" /></div>
          <div><p className="text-xs text-muted-foreground">Missed</p><p className="text-xl font-bold">{missed}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2"><IndianRupee className="h-5 w-5 text-violet-500" /></div>
          <div><p className="text-xs text-muted-foreground">PT Revenue</p><p className="text-xl font-bold">{inr(revenue)}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4" />Assignments</CardTitle></CardHeader>
        <CardContent className="p-0">
          {tAssigns.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No PT assignments yet.</div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tAssigns.map(a => {
                      const m = memberById.get(a.member_id);
                      const pct = Math.min(100, (a.sessions_completed / a.total_sessions) * 100);
                      const done = a.sessions_completed >= a.total_sessions;
                      return (
                        <TableRow key={a.id}>
                          <TableCell><div className="font-medium">{m?.name ?? '—'}</div><div className="text-xs text-muted-foreground">{m?.phone}</div></TableCell>
                          <TableCell className="min-w-[180px]">
                            <div className="text-xs mb-1">{a.sessions_completed}/{a.total_sessions} sessions</div>
                            <Progress value={pct} className="h-2" />
                          </TableCell>
                          <TableCell className="text-xs">{format(new Date(a.start_date), 'dd MMM')} → {format(new Date(a.end_date), 'dd MMM')}</TableCell>
                          <TableCell>{inr(a.price)}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="outline" disabled={!canEdit || done} onClick={() => handleMark(a.id, 'completed')}><CheckCircle2 className="h-4 w-4 mr-1" />Done</Button>
                            <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => handleMark(a.id, 'missed')}><XCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => handleEnd(a.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {tAssigns.map(a => {
                  const m = memberById.get(a.member_id);
                  const pct = Math.min(100, (a.sessions_completed / a.total_sessions) * 100);
                  const done = a.sessions_completed >= a.total_sessions;
                  return (
                    <div key={a.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{m?.name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{inr(a.price)} · {format(new Date(a.start_date), 'dd MMM')}–{format(new Date(a.end_date), 'dd MMM')}</div>
                        </div>
                        {done && <Badge variant="outline">Done</Badge>}
                      </div>
                      <div>
                        <div className="text-xs mb-1">{a.sessions_completed}/{a.total_sessions} sessions</div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" disabled={!canEdit || done} onClick={() => handleMark(a.id, 'completed')}><CheckCircle2 className="h-4 w-4 mr-1" />Mark Done</Button>
                        <Button size="sm" variant="outline" disabled={!canEdit} onClick={() => handleMark(a.id, 'missed')}><XCircle className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => handleEnd(a.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Sessions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {tSessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No sessions logged yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {tSessions.slice(0, 20).map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{format(new Date(s.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{memberById.get(s.member_id)?.name ?? '—'}</TableCell>
                    <TableCell>
                      {s.status === 'completed'
                        ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">Completed</Badge>
                        : <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30" variant="outline">Missed</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AssignPTDialog open={assignOpen} onOpenChange={setAssignOpen} trainerId={trainer.id} />
    </div>
  );
}
