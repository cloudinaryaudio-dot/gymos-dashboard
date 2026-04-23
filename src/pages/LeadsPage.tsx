import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useLeads, LeadStatus, LEAD_STAGES } from '@/hooks/useLeads';
import { usePlans } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus, Trash2, UserPlus, Phone, ArrowRight, UserCheck, X, Target, TrendingUp,
  Search, ArrowUpDown, BarChart3,
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  new: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  contacted: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  visit_scheduled: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  joined: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  lost: { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAGE_SIZE = 10;
type Mode = 'month' | 'year' | 'all';
type SortKey = 'name' | 'created_at' | 'status';

// Debounce hook
function useDebounce<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { leads, isLoading, addLead, updateLeadStatus, deleteLead, convertToMember } = useLeads();
  const { data: plans } = usePlans();

  // Add lead dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('');
  const [convertLead, setConvertLead] = useState<typeof leads[0] | null>(null);

  // URL-driven filters
  const today = new Date();
  const filter = searchParams.get('status') || 'all';
  const mode = (searchParams.get('mode') as Mode) || 'all';
  const month = Number(searchParams.get('month') ?? today.getMonth());
  const year = Number(searchParams.get('year') ?? today.getFullYear());

  // Local controls
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const search = useDebounce(searchInput, 250);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const updateParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === 'all') sp.delete(key);
    else sp.set(key, value);
    setSearchParams(sp, { replace: true });
  };

  const setMode = (m: Mode) => {
    const sp = new URLSearchParams(searchParams);
    if (m === 'all') {
      sp.delete('mode'); sp.delete('month'); sp.delete('year');
    } else {
      sp.set('mode', m);
      sp.set('year', String(year));
      if (m === 'month') sp.set('month', String(month));
      else sp.delete('month');
    }
    setSearchParams(sp, { replace: true });
  };

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [search, filter, mode, month, year, sortKey, sortDir]);

  // Apply filters
  const filtered = useMemo(() => {
    let rows = [...leads];

    // time
    if (mode === 'month') {
      const f = startOfMonth(new Date(year, month, 1));
      const t = endOfMonth(f);
      rows = rows.filter(l => {
        const d = new Date(l.created_at);
        return d >= f && d <= t;
      });
    } else if (mode === 'year') {
      const f = startOfYear(new Date(year, 0, 1));
      const t = endOfYear(f);
      rows = rows.filter(l => {
        const d = new Date(l.created_at);
        return d >= f && d <= t;
      });
    }

    // status (also accept aliases coming from dashboard cards)
    if (filter !== 'all') {
      const aliasMap: Record<string, string[]> = {
        contacted: ['contacted', 'visit_scheduled'],
        converted: ['joined'],
      };
      const allowed = aliasMap[filter] ?? [filter];
      rows = rows.filter(l => allowed.includes(l.status));
    }

    // search
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.fitness_goal ?? '').toLowerCase().includes(q),
      );
    }

    // sort
    rows.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sortKey === 'status') { av = a.status; bv = b.status; }
      else { av = a.created_at; bv = b.created_at; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [leads, mode, month, year, filter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Stats over period (all leads in active time window, ignoring status filter)
  const periodLeads = useMemo(() => {
    if (mode === 'all') return leads;
    if (mode === 'month') {
      const f = startOfMonth(new Date(year, month, 1));
      const t = endOfMonth(f);
      return leads.filter(l => { const d = new Date(l.created_at); return d >= f && d <= t; });
    }
    const f = startOfYear(new Date(year, 0, 1));
    const t = endOfYear(f);
    return leads.filter(l => { const d = new Date(l.created_at); return d >= f && d <= t; });
  }, [leads, mode, month, year]);

  const totalLeads = periodLeads.length;
  const convertedLeads = periodLeads.filter(l => l.status === 'joined').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const newLeads = periodLeads.filter(l => l.status === 'new').length;

  const stageCounts = LEAD_STAGES.reduce((acc, s) => {
    acc[s.value] = periodLeads.filter(l => l.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    addLead.mutate(
      { name: name.trim(), phone: phone.trim(), fitness_goal: goal || undefined },
      { onSuccess: () => { setOpen(false); setName(''); setPhone(''); setGoal(''); } },
    );
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  const getNextAction = (status: string): { label: string; next: LeadStatus; icon: typeof ArrowRight } | null => {
    switch (status) {
      case 'new': return { label: 'Mark Contacted', next: 'contacted', icon: Phone };
      case 'contacted': return { label: 'Schedule Visit', next: 'visit_scheduled', icon: ArrowRight };
      case 'visit_scheduled': return null;
      default: return null;
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Lead Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and convert potential members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/app/leads/dashboard')}>
            <BarChart3 className="h-4 w-4 mr-2" />Leads Dashboard
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
                <div>
                  <Label>Fitness Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                      <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                      <SelectItem value="General Fitness">General Fitness</SelectItem>
                      <SelectItem value="Strength Training">Strength Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={addLead.isPending} className="w-full">
                  {addLead.isPending ? 'Adding...' : 'Add Lead'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{totalLeads}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{convertedLeads}</p>
              <p className="text-xs text-muted-foreground">Converted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{newLeads}</p>
              <p className="text-xs text-muted-foreground">New Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time toggle */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border bg-card">
        <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as Mode)}>
          <ToggleGroupItem value="all">All Time</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
          <ToggleGroupItem value="year">Year</ToggleGroupItem>
        </ToggleGroup>

        {mode === 'month' && (
          <Select value={String(month)} onValueChange={(v) => updateParam('month', v)}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {mode !== 'all' && (
          <Select value={String(year)} onValueChange={(v) => updateParam('year', v)}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <div className="relative ml-auto w-full sm:w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); updateParam('q', e.target.value); }}
            placeholder="Search name, phone, goal..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateParam('status', null)}
        >
          All ({periodLeads.length})
        </Button>
        {LEAD_STAGES.map(s => (
          <Button
            key={s.value}
            variant={filter === s.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateParam('status', s.value)}
            className="capitalize"
          >
            {s.label} ({stageCounts[s.value] || 0})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          {periodLeads.length === 0 && mode !== 'all' ? (
            <p className="text-muted-foreground">No data available for selected period</p>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No leads yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Leads from your website will appear here. You can also add them manually.
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Lead
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">No leads match the current filters</p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">
                    <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 hover:text-foreground">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Goal</th>
                  <th className="text-left p-3 font-medium">
                    <button onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 hover:text-foreground">
                      Status <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium">
                    <button onClick={() => toggleSort('created_at')} className="inline-flex items-center gap-1 hover:text-foreground">
                      Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(lead => {
                  const cfg = statusConfig[lead.status] || statusConfig.new;
                  const nextAction = getNextAction(lead.status);
                  const isActive = lead.status !== 'joined' && lead.status !== 'lost';

                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        'border-b last:border-0 hover:bg-muted/30 transition-colors',
                        lead.status === 'new' && 'bg-blue-500/5'
                      )}
                    >
                      <td className="p-3 font-medium">{lead.name}</td>
                      <td className="p-3 text-muted-foreground">{lead.phone}</td>
                      <td className="p-3 text-muted-foreground">{lead.fitness_goal ?? '—'}</td>
                      <td className="p-3">
                        {isActive ? (
                          <Select
                            value={lead.status}
                            onValueChange={(v) => updateLeadStatus.mutate({ id: lead.id, status: v as LeadStatus })}
                          >
                            <SelectTrigger className="w-[150px] h-8">
                              <Badge variant="outline" className={cn(cfg.bg, cfg.color, cfg.border)}>
                                {LEAD_STAGES.find(s => s.value === lead.status)?.label || lead.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STAGES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={cn(cfg.bg, cfg.color, cfg.border)}>
                            {LEAD_STAGES.find(s => s.value === lead.status)?.label || lead.status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {nextAction && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => updateLeadStatus.mutate({ id: lead.id, status: nextAction.next })}
                            >
                              <nextAction.icon className="h-3 w-3 mr-1" />
                              {nextAction.label}
                            </Button>
                          )}

                          {(lead.status === 'visit_scheduled' || lead.status === 'contacted' || lead.status === 'new') && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setConvertLead(lead)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Convert
                            </Button>
                          )}

                          {isActive && lead.status !== 'joined' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 text-muted-foreground"
                              onClick={() => updateLeadStatus.mutate({ id: lead.id, status: 'lost' })}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Lost
                            </Button>
                          )}

                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLead.mutate(lead.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                      className={cn('cursor-pointer', safePage === 1 && 'pointer-events-none opacity-50')}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .map((p, i, arr) => (
                      <PaginationItem key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-muted-foreground">…</span>}
                        <PaginationLink
                          isActive={p === safePage}
                          onClick={(e) => { e.preventDefault(); setPage(p); }}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                      className={cn('cursor-pointer', safePage === totalPages && 'pointer-events-none opacity-50')}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </>
      )}

      <ConvertDialog
        lead={convertLead}
        plans={plans ?? []}
        onClose={() => setConvertLead(null)}
        onConvert={convertToMember}
      />
    </div>
  );
}

function ConvertDialog({
  lead,
  plans,
  onClose,
  onConvert,
}: {
  lead: { id: string; name: string; phone: string; fitness_goal: string | null } | null;
  plans: { id: string; name: string; duration_days: number; price: number }[];
  onClose: () => void;
  onConvert: { mutate: (data: any) => void; isPending: boolean };
}) {
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (!lead) return null;

  const selectedPlan = plans.find(p => p.id === planId);
  const expiryDate = selectedPlan && startDate
    ? format(addDays(new Date(startDate), selectedPlan.duration_days), 'yyyy-MM-dd')
    : '';

  const handleConvert = () => {
    if (!planId || !expiryDate) return;
    onConvert.mutate({
      leadId: lead.id,
      planId,
      startDate,
      expiryDate,
      name: lead.name,
      phone: lead.phone,
    });
    onClose();
    setPlanId('');
  };

  return (
    <Dialog open={!!lead} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Convert to Member
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">{lead.name}</p>
            <p className="text-sm text-muted-foreground">{lead.phone}</p>
            {lead.fitness_goal && (
              <p className="text-sm text-muted-foreground mt-1">Goal: {lead.fitness_goal}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} — ₹{plan.price} ({plan.duration_days}d)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Join Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          {selectedPlan && expiryDate && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">₹{selectedPlan.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry</span>
                <span className="font-medium">{format(new Date(expiryDate), 'dd MMM yyyy')}</span>
              </div>
            </div>
          )}

          <Button onClick={handleConvert} disabled={!planId || onConvert.isPending} className="w-full">
            {onConvert.isPending ? 'Converting...' : '🎉 Convert to Member'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
