import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, UserCheck, CreditCard, AlertTriangle,
  Target, BarChart3, DollarSign, Sparkles, Calendar, Filter, Activity,
  ArrowUpRight, ArrowDownRight, Lightbulb, AlertCircle, CheckCircle2, Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { seedDemoData, resetDemoData } from '@/data/mockDb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { usePayments } from '@/hooks/usePayments';
import { useExpenses } from '@/hooks/useExpenses';
import { useLeads } from '@/hooks/useLeads';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

type RangeMode = 'day' | 'week' | 'month' | 'year';

function getRange(mode: RangeMode, anchor: Date): { from: Date; to: Date; label: string } {
  const d = new Date(anchor);
  if (mode === 'day') {
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    return { from, to, label: from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) };
  }
  if (mode === 'week') {
    // Week = 7 days ending on anchor (inclusive)
    const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6, 0, 0, 0);
    return { from, to, label: `${from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${to.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` };
  }
  if (mode === 'month') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to, label: from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
  }
  // year
  const from = new Date(d.getFullYear(), 0, 1);
  const to = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { from, to, label: String(d.getFullYear()) };
}

function getPrevRange(mode: RangeMode, anchor: Date): { from: Date; to: Date } {
  const d = new Date(anchor);
  if (mode === 'day') {
    const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return getRange('day', prev);
  }
  if (mode === 'week') {
    const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
    return getRange('week', prev);
  }
  if (mode === 'month') {
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    return getRange('month', prev);
  }
  const prev = new Date(d.getFullYear() - 1, 0, 1);
  return getRange('year', prev);
}

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

const DONUT_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2, 142 70% 45%))', 'hsl(var(--destructive))', 'hsl(var(--chart-4, 38 92% 50%))', 'hsl(var(--chart-5, 280 70% 60%))'];

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  gradient: string;
  onClick?: () => void;
}

function KpiCard({ label, value, change, icon: Icon, gradient, onClick }: KpiCardProps) {
  const positive = (change ?? 0) >= 0;
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer shadow-sm hover:shadow-lg transition-shadow ${gradient}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-white/15 backdrop-blur p-2">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs text-white/90">
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span className="font-semibold">{positive ? '+' : ''}{change.toFixed(1)}%</span>
          <span className="text-white/70">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: members = [] } = useMembers();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();
  const { leads = [] } = useLeads();

  const [tab, setTab] = useState('overview');
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  const handleLoadDemo = async () => {
    resetDemoData();
    seedDemoData();
    await qc.resetQueries();
    toast({ title: '✅ Demo data loaded successfully!' });
  };

  const { from, to, label: rangeLabel } = useMemo(() => getRange(rangeMode, anchorDate), [rangeMode, anchorDate]);
  const prev = useMemo(() => getPrevRange(rangeMode, anchorDate), [rangeMode, anchorDate]);

  const inRange = (dateStr: string, f: Date, t: Date) => {
    const d = new Date(dateStr);
    return d >= f && d <= t;
  };

  // Filter datasets by selected date range
  const filtered = useMemo(() => {
    const fPayments = payments.filter(p => inRange(p.payment_date, from, to));
    const fExpenses = expenses.filter(e => inRange(e.expense_date, from, to));
    const fLeads = leads.filter(l => inRange(l.created_at, from, to));
    const fMembersNew = members.filter(m => inRange(m.created_at, from, to));
    return { fPayments, fExpenses, fLeads, fMembersNew };
  }, [payments, expenses, leads, members, from, to]);

  const stats = useMemo(() => {
    const paid = filtered.fPayments.filter(p => p.status === 'paid');
    const pending = filtered.fPayments.filter(p => p.status === 'pending');
    const overdue = filtered.fPayments.filter(p => p.status === 'overdue');

    const totalRevenue = paid.reduce((s, p) => s + Number(p.amount), 0);

    // Previous-period revenue for change %
    const revPrev = payments
      .filter(p => p.status === 'paid' && inRange(p.payment_date, prev.from, prev.to))
      .reduce((s, p) => s + Number(p.amount), 0);
    const revGrowth = revPrev > 0 ? ((totalRevenue - revPrev) / revPrev) * 100 : 0;

    const activeMembers = members.filter(m => m.status === 'active').length;
    const totalMembers = members.length;

    const newMembersThis = filtered.fMembersNew.length;
    const newMembersPrev = members.filter(m => inRange(m.created_at, prev.from, prev.to)).length;
    const memberGrowth = newMembersPrev > 0 ? ((newMembersThis - newMembersPrev) / newMembersPrev) * 100 : 0;

    const leadsThis = filtered.fLeads;
    const joined = leadsThis.filter(l => l.status === 'joined').length;
    const conversionRate = leadsThis.length > 0 ? (joined / leadsThis.length) * 100 : 0;
    const leadsPrev = leads.filter(l => inRange(l.created_at, prev.from, prev.to));
    const convPrev = leadsPrev.length > 0 ? (leadsPrev.filter(l => l.status === 'joined').length / leadsPrev.length) * 100 : 0;
    const convChange = convPrev > 0 ? conversionRate - convPrev : 0;

    const arpu = activeMembers > 0 ? totalRevenue / activeMembers : 0;

    return {
      totalRevenue, activeMembers, totalMembers,
      pendingAmount: pending.reduce((s, p) => s + Number(p.amount), 0),
      overdueAmount: overdue.reduce((s, p) => s + Number(p.amount), 0),
      pendingCount: pending.length, overdueCount: overdue.length,
      conversionRate, convChange, memberGrowth, revGrowth, arpu,
      revThisMonth: totalRevenue, revLastMonth: revPrev,
      newMembersThis,
      paymentDist: [
        { name: 'Paid', value: paid.length },
        { name: 'Pending', value: pending.length },
        { name: 'Overdue', value: overdue.length },
      ],
    };
  }, [filtered, members, payments, leads, prev]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.fExpenses.forEach(e => {
      const cat = e.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Member growth chart — buckets adapt to range mode
  const memberGrowthChart = useMemo(() => {
    const points: { month: string; members: number }[] = [];
    if (rangeMode === 'day' || rangeMode === 'week') {
      const days = rangeMode === 'day' ? 1 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(to);
        d.setDate(d.getDate() - i);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const count = members.filter(m => new Date(m.created_at) <= end).length;
        points.push({ month: d.toLocaleDateString('en', { day: '2-digit', month: 'short' }), members: count });
      }
    } else if (rangeMode === 'month') {
      const daysInMonth = to.getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const end = new Date(from.getFullYear(), from.getMonth(), day, 23, 59, 59, 999);
        const count = members.filter(m => new Date(m.created_at) <= end).length;
        points.push({ month: String(day), members: count });
      }
    } else {
      // year — 12 months
      for (let m = 0; m < 12; m++) {
        const end = new Date(from.getFullYear(), m + 1, 0, 23, 59, 59, 999);
        const count = members.filter(m2 => new Date(m2.created_at) <= end).length;
        points.push({ month: new Date(from.getFullYear(), m, 1).toLocaleString('en', { month: 'short' }), members: count });
      }
    }
    return points;
  }, [members, rangeMode, from, to]);

  // Revenue chart aligned to range
  const revenueChartFiltered = useMemo(() => {
    const paid = filtered.fPayments.filter(p => p.status === 'paid');
    if (rangeMode === 'day') {
      // Hourly buckets aren't meaningful with daily date data — show single bucket
      const total = paid.reduce((s, p) => s + Number(p.amount), 0);
      return [{ month: rangeLabel, revenue: total }];
    }
    if (rangeMode === 'week') {
      const points: { month: string; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(to);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().slice(0, 10);
        const total = paid.filter(p => new Date(p.payment_date).toISOString().slice(0, 10) === dayKey).reduce((s, p) => s + Number(p.amount), 0);
        points.push({ month: d.toLocaleDateString('en', { day: '2-digit', month: 'short' }), revenue: total });
      }
      return points;
    }
    if (rangeMode === 'month') {
      const daysInMonth = to.getDate();
      const points: { month: string; revenue: number }[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(from.getFullYear(), from.getMonth(), day);
        const dayKey = dayDate.toISOString().slice(0, 10);
        const total = paid.filter(p => new Date(p.payment_date).toISOString().slice(0, 10) === dayKey).reduce((s, p) => s + Number(p.amount), 0);
        points.push({ month: String(day), revenue: total });
      }
      return points;
    }
    // year
    const points: { month: string; revenue: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const total = paid.filter(p => {
        const d = new Date(p.payment_date);
        return d.getFullYear() === from.getFullYear() && d.getMonth() === m;
      }).reduce((s, p) => s + Number(p.amount), 0);
      points.push({ month: new Date(from.getFullYear(), m, 1).toLocaleString('en', { month: 'short' }), revenue: total });
    }
    return points;
  }, [filtered, rangeMode, from, to, rangeLabel]);

  // ────── AI INSIGHTS (rule-based) ──────
  const insights = useMemo(() => {
    const out: { text: string; severity: 'success' | 'warning' | 'danger' | 'info'; icon: React.ElementType }[] = [];

    if (stats.revGrowth > 5) {
      out.push({ text: `Revenue increased by ${stats.revGrowth.toFixed(1)}% compared to last month`, severity: 'success', icon: TrendingUp });
    } else if (stats.revGrowth < -5) {
      out.push({ text: `Revenue dropped by ${Math.abs(stats.revGrowth).toFixed(1)}% vs last month — review pricing & retention`, severity: 'danger', icon: TrendingDown });
    } else if (stats.revLastMonth > 0) {
      out.push({ text: `Revenue is stable (${stats.revGrowth >= 0 ? '+' : ''}${stats.revGrowth.toFixed(1)}%) compared to last month`, severity: 'info', icon: Activity });
    }

    if (stats.overdueAmount > 0) {
      out.push({ text: `High overdue payments detected (${inr(stats.overdueAmount)} pending across ${stats.overdueCount} members)`, severity: 'danger', icon: AlertTriangle });
    }

    if (members.length > 0) {
      const planCount = new Map<string, number>();
      members.forEach(m => {
        const name = m.plans?.name || 'Unassigned';
        planCount.set(name, (planCount.get(name) || 0) + 1);
      });
      const top = Array.from(planCount.entries()).sort((a, b) => b[1] - a[1])[0];
      if (top) out.push({ text: `Most members are on the "${top[0]}" plan (${top[1]} members)`, severity: 'info', icon: Users });
    }

    if (stats.convChange < -3) {
      out.push({ text: `Lead conversion dropped by ${Math.abs(stats.convChange).toFixed(1)}% — follow up on contacted leads`, severity: 'warning', icon: AlertCircle });
    } else if (stats.convChange > 3) {
      out.push({ text: `Lead conversion improved by ${stats.convChange.toFixed(1)}% — sales process is working`, severity: 'success', icon: CheckCircle2 });
    }

    if (expenseByCategory.length > 0) {
      const top = [...expenseByCategory].sort((a, b) => b.value - a.value)[0];
      out.push({ text: `Top expense category is "${top.name}" (${inr(top.value)})`, severity: 'warning', icon: Lightbulb });
    }

    if (stats.activeMembers > 0 && stats.arpu > 0) {
      out.push({ text: `Average revenue per active member is ${inr(Math.round(stats.arpu))}`, severity: 'info', icon: Target });
    }

    return out.slice(0, 5);
  }, [stats, members, expenseByCategory]);


  const severityClass = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400',
  };

  const ChartFallback = () => <Skeleton className="h-full w-full rounded-lg" />;

  return (
    <div className="space-y-4 md:space-y-6 pb-8 px-1 sm:px-0">
      {/* Header — mobile stacks: Title → Buttons → Filters (Tabs) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Unified analytics and business intelligence</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleLoadDemo} className="w-full lg:w-auto justify-center">
          <Database className="mr-2 h-4 w-4" /> Load Demo Data
        </Button>
        <Tabs value={tab} onValueChange={setTab} className="w-full lg:w-auto">
          <TabsList className="overflow-x-auto max-w-full w-full lg:w-auto justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members" onClick={() => navigate('/app/members/dashboard')}>Members</TabsTrigger>
            <TabsTrigger value="payments" onClick={() => navigate('/app/payments/dashboard')}>Payments</TabsTrigger>
            <TabsTrigger value="leads" onClick={() => navigate('/app/leads/dashboard')}>Leads</TabsTrigger>
            <TabsTrigger value="expenses" onClick={() => navigate('/app/expenses/dashboard')}>Expenses</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top Time Filter Bar */}
      <Card className="rounded-2xl sticky top-2 z-20 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Time Filter</span>
          </div>
          <Tabs value={rangeMode} onValueChange={(v) => setRangeMode(v as RangeMode)} className="shrink-0">
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>

          {(rangeMode === 'day' || rangeMode === 'week') && (
            <Input
              type="date"
              value={anchorDate.toISOString().slice(0, 10)}
              onChange={(e) => setAnchorDate(new Date(e.target.value))}
              className="w-full md:w-44"
            />
          )}

          {rangeMode === 'month' && (
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={String(anchorDate.getMonth())}
                onValueChange={(v) => { const d = new Date(anchorDate); d.setMonth(parseInt(v)); setAnchorDate(d); }}
              >
                <SelectTrigger className="md:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(anchorDate.getFullYear())}
                onValueChange={(v) => { const d = new Date(anchorDate); d.setFullYear(parseInt(v)); setAnchorDate(d); }}
              >
                <SelectTrigger className="md:w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {rangeMode === 'year' && (
            <Select
              value={String(anchorDate.getFullYear())}
              onValueChange={(v) => { const d = new Date(anchorDate); d.setFullYear(parseInt(v)); setAnchorDate(d); }}
            >
              <SelectTrigger className="w-full md:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}

          <div className="md:ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Showing: <span className="font-semibold text-foreground">{rangeLabel}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* MAIN COLUMN */}
        <div className="space-y-6 min-w-0">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <KpiCard label="Total Revenue" value={inr(stats.totalRevenue)} change={stats.revGrowth} icon={DollarSign}
              gradient="bg-gradient-to-br from-violet-500 to-purple-600" onClick={() => navigate('/app/payments')} />
            <KpiCard label="Total Members" value={String(stats.totalMembers)} change={stats.memberGrowth} icon={Users}
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600" onClick={() => navigate('/app/members')} />
            <KpiCard label="Active Members" value={String(stats.activeMembers)} icon={UserCheck}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600" onClick={() => navigate('/app/members?status=active')} />
            <KpiCard label="Pending Payments" value={inr(stats.pendingAmount)} icon={CreditCard}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600" onClick={() => navigate('/app/payments')} />
            <KpiCard label="Overdue Payments" value={inr(stats.overdueAmount)} icon={AlertTriangle}
              gradient="bg-gradient-to-br from-rose-500 to-red-600" onClick={() => navigate('/app/payments')} />
            <KpiCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} change={stats.convChange} icon={Target}
              gradient="bg-gradient-to-br from-pink-500 to-fuchsia-600" onClick={() => navigate('/app/leads')} />
            <KpiCard label="Monthly Growth" value={`${stats.memberGrowth >= 0 ? '+' : ''}${stats.memberGrowth.toFixed(1)}%`} icon={TrendingUp}
              gradient="bg-gradient-to-br from-cyan-500 to-blue-600" />
            <KpiCard label="Avg Revenue / Member" value={inr(Math.round(stats.arpu))} icon={BarChart3}
              gradient="bg-gradient-to-br from-slate-600 to-slate-800" />
          </div>

          {/* ROW 1: revenue trend + payment donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Revenue Trend ({rangeLabel})</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {(!revenueChartFiltered || revenueChartFiltered.length === 0 || revenueChartFiltered.every(p => p.revenue === 0)) ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue in this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartFiltered} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(v: number) => inr(v)} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Payment Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats.paymentDist.every(p => p.value === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Data not available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.paymentDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {stats.paymentDist.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ROW 2: members growth + expenses donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Member Growth</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {(!memberGrowthChart || memberGrowthChart.length === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Data not available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={memberGrowthChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="members" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Expense Categories</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {expenseByCategory.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Data not available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => inr(v)} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI INSIGHTS */}
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/15 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Smart Insights</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Auto-generated from your latest data</p>
                </div>
                <Badge variant="secondary" className="ml-auto">Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add more data to unlock insights.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((ins, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 ${severityClass[ins.severity]}`}
                    >
                      <ins.icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed text-foreground">{ins.text}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Quick Tip</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click any KPI card to drill down into the detailed list view.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
