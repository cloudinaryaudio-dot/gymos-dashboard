import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useMembers, useCreateMember, useUpdateMember, useDeleteMember, Member } from '@/hooks/useMembers';
import { usePlans } from '@/hooks/usePlans';
import { usePayments } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Users, Zap, MessageCircle, RefreshCw, Bell, CreditCard, Search, BarChart3, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { addDays, format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { RenewDialog } from '@/components/RenewDialog';
import { AddPaymentDialog } from '@/components/AddPaymentDialog';
import { ReminderDialog, whatsappDirect } from '@/components/ReminderDialog';

type SortKey = 'name' | 'start_date' | 'expiry_date' | 'plan' | 'status';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 15;

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
}

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

function getWhatsAppDirect(phone: string) {
  return whatsappDirect(phone);
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

function getPaymentStatus(member: Member, payments: any[]) {
  const memberPayments = payments.filter(p => p.member_id === member.id);
  const hasPaidThisCycle = memberPayments.some(p => p.status === 'paid' && p.payment_date >= member.start_date);
  const today = new Date().toISOString().split('T')[0];
  const isExpired = member.expiry_date < today;

  if (hasPaidThisCycle) return 'paid' as const;
  if (isExpired) return 'overdue' as const;
  return 'pending' as const;
}

export default function MembersPage() {
  const navigate = useNavigate();
  const { data: members, isLoading } = useMembers();
  const { data: plans } = usePlans();
  const { data: payments } = usePayments();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [renewMember, setRenewMember] = useState<Member | undefined>();
  const [paymentMember, setPaymentMember] = useState<Member | undefined>();
  const [reminderMember, setReminderMember] = useState<Member | undefined>();

  // ─── URL-driven state ───
  const statusFilter = (searchParams.get('status') ?? 'all') as 'all' | 'active' | 'expired' | 'overdue';
  const planFilter = searchParams.get('plan') ?? 'all';
  const expiryFilter = (searchParams.get('expiry') ?? 'all') as 'all' | '7days' | '30days';
  const sortKey = (searchParams.get('sort') ?? 'expiry_date') as SortKey;
  const sortDir = (searchParams.get('dir') ?? 'asc') as SortDir;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const urlSearch = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounced(searchInput, 250);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('q', debouncedSearch); else next.delete('q');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === '' || value === 'all') next.delete(key); else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const planCategories = useMemo(() => {
    const set = new Set<string>();
    plans?.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [plans]);

  const processed = useMemo(() => {
    if (!members) return [] as Member[];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in7Str = in7.toISOString().slice(0, 10);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().slice(0, 10);
    const q = debouncedSearch.trim().toLowerCase();

    let list = members.filter(m => {
      if (statusFilter === 'active' && m.expiry_date < todayStr) return false;
      if (statusFilter === 'expired' && m.expiry_date >= todayStr) return false;
      if (statusFilter === 'overdue') {
        if (getPaymentStatus(m, payments ?? []) !== 'overdue') return false;
      }
      if (planFilter !== 'all') {
        const planCat = plans?.find(p => p.id === m.plan_id)?.category ?? '';
        if (planCat.toLowerCase() !== planFilter.toLowerCase()) return false;
      }
      if (expiryFilter === '7days' && !(m.expiry_date >= todayStr && m.expiry_date <= in7Str)) return false;
      if (expiryFilter === '30days' && !(m.expiry_date >= todayStr && m.expiry_date <= in30Str)) return false;
      if (q) {
        const planName = m.plans?.name?.toLowerCase() ?? '';
        if (!m.name.toLowerCase().includes(q) && !m.phone.toLowerCase().includes(q) && !planName.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case 'start_date': av = a.start_date; bv = b.start_date; break;
        case 'expiry_date': av = a.expiry_date; bv = b.expiry_date; break;
        case 'plan': av = a.plans?.name?.toLowerCase() ?? ''; bv = b.plans?.name?.toLowerCase() ?? ''; break;
        case 'status':
          av = a.expiry_date < todayStr ? 1 : 0;
          bv = b.expiry_date < todayStr ? 1 : 0;
          break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [members, payments, plans, statusFilter, planFilter, expiryFilter, sortKey, sortDir, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedMembers = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', key);
    next.set('dir', sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc');
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = statusFilter !== 'all' || planFilter !== 'all' || expiryFilter !== 'all' || debouncedSearch.length > 0;
  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };


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
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your gym members
            {(expiringCount > 0 || expiredCount > 0) && (
              <span className="ml-2 inline-flex flex-wrap gap-1">
                {expiringCount > 0 && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10">
                    {expiringCount} expiring
                  </Badge>
                )}
                {expiredCount > 0 && (
                  <Badge variant="destructive">
                    {expiredCount} expired
                  </Badge>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/app/members/dashboard')}>
            <BarChart3 className="h-4 w-4 mr-2" /> Members Dashboard
          </Button>
          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto" disabled={!plans || plans.length === 0}>
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
                <QuickAddForm plans={plans} onSubmit={handleSubmit} onCancel={() => setQuickAddOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMember(undefined); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" disabled={!plans || plans.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
              </DialogHeader>
              {plans && plans.length > 0 && (
                <MemberForm member={editingMember} plans={plans} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controls: search + filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, phone, or plan…"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => updateParam('status', v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={(v) => updateParam('plan', v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plan category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {planCategories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={expiryFilter} onValueChange={(v) => updateParam('expiry', v)}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Expiry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any expiry</SelectItem>
              <SelectItem value="7days">Expiring in 7 days</SelectItem>
              <SelectItem value="30days">Expiring in 30 days</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}

          <div className="ml-auto text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{processed.length}</span> of {members?.length ?? 0}
          </div>
        </CardContent>
      </Card>

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
                  <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('name')}>Name <ArrowUpDown className="h-3 w-3 opacity-50" /></button></TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('plan')}>Plan <ArrowUpDown className="h-3 w-3 opacity-50" /></button></TableHead>
                  <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('status')}>Status <ArrowUpDown className="h-3 w-3 opacity-50" /></button></TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('expiry_date')}>Expiry Date <ArrowUpDown className="h-3 w-3 opacity-50" /></button></TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                      No members match your filters.
                      {hasActiveFilters && (
                        <Button variant="link" size="sm" onClick={clearAllFilters} className="ml-1">Clear filters</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : pagedMembers.map(member => {
                  const expiry = getExpiryInfo(member.expiry_date);
                  const payStatus = getPaymentStatus(member, payments ?? []);
                  return (
                    <TableRow
                      key={member.id}
                      className={cn(
                        'cursor-pointer',
                        payStatus === 'overdue' && 'bg-destructive/5',
                        payStatus === 'pending' && 'bg-yellow-500/5',
                        expiry.variant === 'expired' && payStatus === 'paid' && 'bg-destructive/5',
                        expiry.variant === 'expiring' && payStatus === 'paid' && 'bg-yellow-500/5'
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
                        {payStatus === 'paid' ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 border">Paid</Badge>
                        ) : payStatus === 'overdue' ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-400 text-orange-500 bg-orange-500/10">Pending</Badge>
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
                            title="Add Payment"
                            onClick={() => setPaymentMember(member)}
                          >
                            <CreditCard className={cn('h-4 w-4', (payStatus === 'pending' || payStatus === 'overdue') ? 'text-orange-500' : 'text-primary')} />
                          </Button>
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
                              href={getWhatsAppDirect(member.phone)}
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
                            title="Send Reminder"
                            onClick={() => setReminderMember(member)}
                          >
                            <Bell className="h-4 w-4 text-yellow-600" />
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
          ) : null}
          {members && members.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages} · {processed.length} result{processed.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => updateParam('page', String(Math.max(1, safePage - 1)))} disabled={safePage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => Math.abs(n - safePage) <= 2 || n === 1 || n === totalPages)
                  .reduce<(number | 'gap')[]>((acc, n, idx, arr) => {
                    if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('gap');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, idx) => n === 'gap'
                    ? <span key={`gap-${idx}`} className="px-2 text-muted-foreground">…</span>
                    : (
                      <Button
                        key={n}
                        variant={n === safePage ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateParam('page', String(n))}
                      >
                        {n}
                      </Button>
                    ))}
                <Button variant="outline" size="sm" onClick={() => updateParam('page', String(Math.min(totalPages, safePage + 1)))} disabled={safePage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {(!members || members.length === 0) && !isLoading && (
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

      {/* Add Payment Dialog */}
      <AddPaymentDialog
        open={!!paymentMember}
        onOpenChange={(open) => { if (!open) setPaymentMember(undefined); }}
        member={paymentMember ?? null}
      />

      {/* Reminder Dialog */}
      <ReminderDialog
        open={!!reminderMember}
        onOpenChange={(open) => { if (!open) setReminderMember(undefined); }}
        target={reminderMember ? {
          id: reminderMember.id,
          name: reminderMember.name,
          phone: reminderMember.phone,
          due_date: reminderMember.expiry_date,
        } : null}
      />
    </div>
  );
}
