import { useMemo, useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import { usePayments } from '@/hooks/usePayments';
import { useMembers } from '@/hooks/useMembers';
import { usePlans } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import {
  ArrowLeft, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown,
  Wallet, Clock, AlertTriangle, RotateCcw, DollarSign, Search, Lightbulb, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ChartsBlock = lazy(() => import('@/components/dashboard/PaymentsDashboardCharts'));

type RangeKey = 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom';

function getRange(key: RangeKey, customFrom?: string, customTo?: string) {
  const now = new Date();
  switch (key) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'weekly':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'yearly':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom':
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : startOfMonth(now),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
      };
  }
}

function getPreviousRange(from: Date, to: Date) {
  const days = differenceInCalendarDays(to, from) + 1;
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);
  return { from: startOfDay(prevFrom), to: endOfDay(prevTo) };
}

function pctChange(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

const PAGE_SIZE = 10;

export default function PaymentsDashboardPage() {
  const navigate = useNavigate();
  const { data: payments } = usePayments();
  const { data: members } = useMembers();
  const { data: plans } = usePlans();

  const [rangeKey, setRangeKey] = useState<RangeKey>('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { from, to } = getRange(rangeKey, customFrom, customTo);
  const prev = getPreviousRange(from, to);

  const inRange = (dateStr: string, f: Date, t: Date) => {
    const d = new Date(dateStr);
    return d >= f && d <= t;
  };

  const all = payments ?? [];

  const current = useMemo(() => all.filter(p => inRange(p.payment_date, from, to)), [all, from, to]);
  const previous = useMemo(() => all.filter(p => inRange(p.payment_date, prev.from, prev.to)), [all, prev.from, prev.to]);

  // Core metrics
  const sumBy = (arr: typeof all, status?: string) =>
    arr.filter(p => !status || p.status === status).reduce((s, p) => s + Number(p.amount), 0);

  const totalRevenue = sumBy(current);
  const collected = sumBy(current, 'paid');
  const pending = sumBy(current, 'pending');
  const overdue = sumBy(current, 'overdue');
  const refunds = sumBy(current, 'refunded');
  const netRevenue = collected - refunds;

  const prevCollected = sumBy(previous, 'paid');
  const prevTotal = sumBy(previous);
  const prevPending = sumBy(previous, 'pending');
  const prevOverdue = sumBy(previous, 'overdue');

  const totalBilled = collected + pending + overdue;
  const collectionRate = totalBilled > 0 ? (collected / totalBilled) * 100 : 0;

  // Cash flow over time (daily within range, capped to 60 buckets)
  const series = useMemo(() => {
    const days = eachDayOfInterval({ start: from, end: to });
    const step = Math.max(1, Math.ceil(days.length / 60));
    const out: { label: string; in: number; expected: number; lost: number }[] = [];
    for (let i = 0; i < days.length; i += step) {
      const bucketStart = days[i];
      const bucketEnd = days[Math.min(i + step - 1, days.length - 1)];
      const bucket = current.filter(p => {
        const d = new Date(p.payment_date);
        return d >= startOfDay(bucketStart) && d <= endOfDay(bucketEnd);
      });
      out.push({
        label: format(bucketStart, days.length > 31 ? 'dd MMM' : 'dd'),
        in: sumBy(bucket, 'paid'),
        expected: sumBy(bucket, 'pending'),
        lost: sumBy(bucket, 'overdue'),
      });
    }
    return out;
  }, [current, from, to]);

  // Method distribution
  const methodData = useMemo(() => {
    const map = new Map<string, number>();
    current.filter(p => p.status === 'paid').forEach(p => {
      const k = (p.method || 'other').toLowerCase();
      map.set(k, (map.get(k) ?? 0) + Number(p.amount));
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [current]);

  // Plan-wise revenue
  const planRevenue = useMemo(() => {
    const map = new Map<string, number>();
    current.filter(p => p.status === 'paid').forEach(p => {
      const m = members?.find(x => x.id === p.member_id);
      const plan = plans?.find(pl => pl.id === m?.plan_id);
      const name = plan?.name ?? 'Unassigned';
      map.set(name, (map.get(name) ?? 0) + Number(p.amount));
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [current, members, plans]);

  // Pending/overdue lists
  const today = new Date();
  const overdueList = useMemo(() => {
    return all
      .filter(p => p.status === 'overdue' || (p.status === 'pending' && new Date(p.payment_date) < today))
      .map(p => ({
        ...p,
        daysLate: Math.max(0, differenceInCalendarDays(today, new Date(p.payment_date))),
      }))
      .sort((a, b) => b.daysLate - a.daysLate);
  }, [all]);

  const pendingList = useMemo(
    () => all.filter(p => p.status === 'pending').sort((a, b) => a.payment_date.localeCompare(b.payment_date)),
    [all]
  );

  // Smart insights
  const bestPlan = planRevenue[0];
  const topPayer = useMemo(() => {
    const map = new Map<string, number>();
    current.filter(p => p.status === 'paid').forEach(p => {
      const name = p.members?.name ?? 'Unknown';
      map.set(name, (map.get(name) ?? 0) + Number(p.amount));
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)[0];
  }, [current]);
  const avgDelay = overdueList.length
    ? Math.round(overdueList.reduce((s, p) => s + p.daysLate, 0) / overdueList.length)
    : 0;
  const peakDay = useMemo(() => {
    return [...series].sort((a, b) => b.in - a.in)[0];
  }, [series]);

  // Filtered table
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...current].sort((a, b) => b.payment_date.localeCompare(a.payment_date));
    if (q) {
      list = list.filter(p =>
        (p.members?.name ?? '').toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        String(p.amount).includes(q)
      );
    }
    return list;
  }, [current, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TrendBadge = ({ value }: { value: number }) => {
    const up = value >= 0;
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', up ? 'text-emerald-600' : 'text-destructive')}>
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}% vs prev
      </span>
    );
  };

  const StatCard = ({
    title, value, icon: Icon, trend, onClick, tone = 'default',
  }: {
    title: string; value: string; icon: any; trend?: number; onClick?: () => void;
    tone?: 'default' | 'success' | 'warning' | 'danger';
  }) => (
    <Card
      onClick={onClick}
      className={cn('transition hover:shadow-md', onClick && 'cursor-pointer hover:-translate-y-0.5')}
    >
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold font-display">{value}</p>
          {typeof trend === 'number' && <TrendBadge value={trend} />}
        </div>
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          tone === 'success' && 'bg-emerald-500/10 text-emerald-600',
          tone === 'warning' && 'bg-orange-500/10 text-orange-500',
          tone === 'danger' && 'bg-destructive/10 text-destructive',
          tone === 'default' && 'bg-primary/10 text-primary',
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/payments')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Payments Dashboard</h1>
            <p className="text-muted-foreground text-sm">Revenue intelligence & cash flow insights</p>
          </div>
        </div>
        <Link to="/app/payments">
          <Button variant="outline">View All Payments</Button>
        </Link>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <Tabs value={rangeKey} onValueChange={(v) => { setRangeKey(v as RangeKey); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          {rangeKey === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-auto" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-auto" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {format(from, 'dd MMM yyyy')} → {format(to, 'dd MMM yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Revenue" value={formatINR(totalRevenue)} icon={DollarSign} trend={pctChange(totalRevenue, prevTotal)} />
        <StatCard title="Collected" value={formatINR(collected)} icon={Wallet} tone="success" trend={pctChange(collected, prevCollected)} onClick={() => navigate('/app/payments?status=paid')} />
        <StatCard title="Pending" value={formatINR(pending)} icon={Clock} tone="warning" trend={pctChange(pending, prevPending)} onClick={() => navigate('/app/payments?status=pending')} />
        <StatCard title="Overdue" value={formatINR(overdue)} icon={AlertTriangle} tone="danger" trend={pctChange(overdue, prevOverdue)} onClick={() => navigate('/app/payments?status=overdue')} />
        <StatCard title="Refunds" value={formatINR(refunds)} icon={RotateCcw} />
        <StatCard title="Net Revenue" value={formatINR(netRevenue)} icon={TrendingUp} tone="success" />
      </div>

      {/* Cash Flow + Method */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Cash Flow Over Time</CardTitle>
            <p className="text-xs text-muted-foreground">Money in, expected, and lost</p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <ChartsBlock variant="cashflow" data={{ series, methodData, planRevenue }} />
            </Suspense>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Money In</p>
                <p className="text-sm font-semibold text-emerald-600">{formatINR(collected)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="text-sm font-semibold text-orange-500">{formatINR(pending)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lost</p>
                <p className="text-sm font-semibold text-destructive">{formatINR(overdue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution by collected revenue</p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <ChartsBlock variant="method" data={{ series, methodData, planRevenue }} />
            </Suspense>
            <div className="space-y-1 mt-3">
              {methodData.length === 0 && <p className="text-sm text-muted-foreground text-center">No data</p>}
              {methodData.map(m => (
                <button
                  key={m.name}
                  onClick={() => navigate(`/app/payments?method=${m.name}`)}
                  className="flex items-center justify-between w-full text-sm hover:bg-muted/50 rounded px-2 py-1 transition"
                >
                  <span className="capitalize">{m.name.replace('_', ' ')}</span>
                  <span className="font-medium">{formatINR(m.value)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Revenue + Collection Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Revenue by Plan</CardTitle>
            <p className="text-xs text-muted-foreground">Top-performing plans in this period</p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <ChartsBlock variant="plan" data={{ series, methodData, planRevenue }} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Collection Efficiency</CardTitle>
            <p className="text-xs text-muted-foreground">Billed vs Collected</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold font-display">{collectionRate.toFixed(1)}%</span>
              <Badge variant={collectionRate >= 80 ? 'default' : collectionRate >= 50 ? 'secondary' : 'destructive'}>
                {collectionRate >= 80 ? 'Healthy' : collectionRate >= 50 ? 'Watch' : 'Critical'}
              </Badge>
            </div>
            <Progress value={collectionRate} className="h-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total Billed</p>
                <p className="font-semibold">{formatINR(totalBilled)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="font-semibold text-emerald-600">{formatINR(collected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending/Overdue + Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-display">Pending & Overdue</CardTitle>
              <p className="text-xs text-muted-foreground">Members with outstanding balance</p>
            </div>
            <Link to="/app/payments?status=overdue" className="text-xs text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {overdueList.length === 0 && pendingList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending or overdue payments 🎉</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...overdueList, ...pendingList.filter(p => !overdueList.find(o => o.id === p.id))].slice(0, 8).map(p => {
                    const isCritical = 'daysLate' in p && (p as any).daysLate > 7;
                    return (
                      <TableRow key={p.id} className={cn(isCritical && 'bg-destructive/5')}>
                        <TableCell className="font-medium">{p.members?.name ?? '—'}</TableCell>
                        <TableCell>{formatINR(Number(p.amount))}</TableCell>
                        <TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.status === 'overdue' ? 'destructive' : 'secondary'}
                            className={cn(p.status === 'pending' && 'border-orange-400 text-orange-500 bg-orange-500/10')}
                          >
                            {isCritical && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {p.status}{'daysLate' in p && (p as any).daysLate > 0 ? ` · ${(p as any).daysLate}d late` : ''}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">Best Performing Plan</p>
              <p className="font-semibold">{bestPlan?.name ?? '—'}</p>
              <p className="text-xs text-emerald-600">{bestPlan ? formatINR(bestPlan.value) : 'No data'}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">Top Paying Customer</p>
              <p className="font-semibold">{topPayer?.name ?? '—'}</p>
              <p className="text-xs text-primary">{topPayer ? formatINR(topPayer.value) : 'No data'}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <p className="text-xs text-muted-foreground">Avg Payment Delay</p>
              <p className="font-semibold">{avgDelay} days</p>
              <p className="text-xs text-orange-500">{overdueList.length} overdue invoices</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border">
              <p className="text-xs text-muted-foreground">Peak Revenue Day</p>
              <p className="font-semibold">{peakDay?.label ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{peakDay ? formatINR(peakDay.in) : 'No data'}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground">Revenue Leak</p>
              <p className="font-semibold">{formatINR(overdue + pending)}</p>
              <p className="text-xs text-destructive">Unrecovered in this period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend (already in Cash Flow), include peak callout via table view */}

      {/* Payment History Table */}
      <Card>
        <CardHeader className="pb-2 flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-display">Payment History</CardTitle>
            <p className="text-xs text-muted-foreground">{filtered.length} records in selected period</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by member, method, status…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No payments in this range</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.members?.name ?? '—'}</TableCell>
                      <TableCell>{formatINR(Number(p.amount))}</TableCell>
                      <TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="capitalize">{p.method.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'}
                          className={cn(
                            p.status === 'paid' && 'bg-emerald-500/10 text-emerald-600 border border-emerald-300',
                            p.status === 'pending' && 'border-orange-400 text-orange-500 bg-orange-500/10'
                          )}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={cn(page === 1 && 'pointer-events-none opacity-50', 'cursor-pointer')}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        if (p > totalPages) return null;
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className={cn(page === totalPages && 'pointer-events-none opacity-50', 'cursor-pointer')}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
