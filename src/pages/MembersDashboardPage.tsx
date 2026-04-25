import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { useMembers } from '@/hooks/useMembers';
import { usePlans } from '@/hooks/usePlans';
import { usePayments } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Users, UserCheck, UserX, AlertTriangle, Clock, CalendarDays,
  UserPlus, RefreshCw, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfYear, endOfYear,
  eachDayOfInterval, eachMonthOfInterval,
} from 'date-fns';

type Mode = 'month' | 'year';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
  },
} as const;

function ChartCard({ title, children, height = 280, onClick, hint }: { title: string; children: React.ReactNode; height?: number; onClick?: () => void; hint?: string }) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function MembersDashboardPage() {
  const navigate = useNavigate();
  const { data: members = [], isLoading } = useMembers();
  const { data: plans = [] } = usePlans();
  const { data: payments = [] } = usePayments();
  const today = new Date();

  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const { from, to, granularity } = useMemo(() => {
    if (mode === 'month') {
      const d = new Date(year, month, 1);
      return { from: startOfMonth(d), to: endOfMonth(d), granularity: 'day' as const };
    }
    const d = new Date(year, 0, 1);
    return { from: startOfYear(d), to: endOfYear(d), granularity: 'month' as const };
  }, [mode, month, year]);

  const todayStr = today.toISOString().slice(0, 10);
  const in7Str = (() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
  const in30Str = (() => { const d = new Date(today); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();

  // ─── Summary KPIs ───
  const kpis = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.expiry_date >= todayStr).length;
    const expired = members.filter(m => m.expiry_date < todayStr).length;
    const expiring7 = members.filter(m => m.expiry_date >= todayStr && m.expiry_date <= in7Str).length;
    const expiring30 = members.filter(m => m.expiry_date >= todayStr && m.expiry_date <= in30Str).length;

    // Overdue: payments overdue or expired without paid renewal
    const overdue = members.filter(m => {
      const memberPayments = payments.filter(p => p.member_id === m.id);
      const hasPaid = memberPayments.some(p => p.status === 'paid' && p.payment_date >= m.start_date);
      return !hasPaid && m.expiry_date < todayStr;
    }).length;

    // New members in period
    const newMembers = members.filter(m => {
      const created = new Date(m.created_at);
      return created >= from && created <= to;
    }).length;

    // Renewals in period (payments with note 'Membership renewal')
    const renewals = payments.filter(p => {
      if (p.status !== 'paid') return false;
      const d = new Date(p.payment_date);
      return d >= from && d <= to && (p.note?.toLowerCase().includes('renew') ?? false);
    }).length;

    return { total, active, expired, expiring7, expiring30, overdue, newMembers, renewals };
  }, [members, payments, from, to, todayStr, in7Str, in30Str]);

  // ─── Plan distribution ───
  const planDistribution = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach(m => {
      const plan = plans.find(p => p.id === m.plan_id);
      const cat = plan?.category || plan?.name || 'Unassigned';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [members, plans]);

  // ─── Member growth over time ───
  const growthSeries = useMemo(() => {
    const buckets = granularity === 'day'
      ? eachDayOfInterval({ start: from, end: to }).map(d => ({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'd MMM') }))
      : eachMonthOfInterval({ start: from, end: to }).map(d => ({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM') }));

    return buckets.map(b => {
      const joined = members.filter(m => {
        const k = granularity === 'day' ? m.created_at.slice(0, 10) : m.created_at.slice(0, 7);
        return k === b.key;
      }).length;
      return { label: b.label, joined };
    });
  }, [members, from, to, granularity]);

  // ─── Expiry analysis ───
  const expiryAnalysis = useMemo(() => {
    const longTerm = members.filter(m => m.expiry_date > in30Str).length;
    return [
      { name: 'Expired', value: kpis.expired },
      { name: 'Expiring 7d', value: kpis.expiring7 },
      { name: 'Expiring 30d', value: kpis.expiring30 - kpis.expiring7 },
      { name: 'Long-term', value: longTerm },
    ];
  }, [members, kpis, in30Str]);

  // ─── Retention insights ───
  const retention = useMemo(() => {
    // Members who had payments in period
    const renewalMembers = new Set(
      payments
        .filter(p => p.status === 'paid' && (p.note?.toLowerCase().includes('renew') ?? false))
        .map(p => p.member_id)
    );
    const expiredInPast = members.filter(m => m.expiry_date < todayStr);
    const renewedCount = expiredInPast.filter(m => renewalMembers.has(m.id)).length;
    const droppedCount = expiredInPast.length - renewedCount;
    const renewalRate = expiredInPast.length > 0 ? Math.round((renewedCount / expiredInPast.length) * 100) : 0;
    const dropOffRate = 100 - renewalRate;
    return { renewalRate, dropOffRate, renewedCount, droppedCount };
  }, [members, payments, todayStr]);

  const goToMembers = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    navigate(`/app/members?${sp.toString()}`);
  };

  const cards = [
    { label: 'Total Members', value: kpis.total, icon: Users, tone: 'text-blue-400 bg-blue-500/10', filter: {} },
    { label: 'Active', value: kpis.active, icon: UserCheck, tone: 'text-emerald-500 bg-emerald-500/10', filter: { status: 'active' } },
    { label: 'Expired', value: kpis.expired, icon: UserX, tone: 'text-destructive bg-destructive/10', filter: { status: 'expired' } },
    { label: 'Overdue', value: kpis.overdue, icon: AlertTriangle, tone: 'text-orange-500 bg-orange-500/10', filter: { status: 'overdue' } },
    { label: 'Expiring 7d', value: kpis.expiring7, icon: Clock, tone: 'text-yellow-500 bg-yellow-500/10', filter: { expiry: '7days' } },
    { label: 'Expiring 30d', value: kpis.expiring30, icon: CalendarDays, tone: 'text-amber-500 bg-amber-500/10', filter: { expiry: '30days' } },
    { label: 'New (period)', value: kpis.newMembers, icon: UserPlus, tone: 'text-primary bg-primary/10', filter: {} },
    { label: 'Renewals (period)', value: kpis.renewals, icon: RefreshCw, tone: 'text-purple-400 bg-purple-500/10', filter: {} },
  ];

  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/members')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Members Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Member health, growth & retention</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card">
        <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as Mode)}>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
          <ToggleGroupItem value="year">Year</ToggleGroupItem>
        </ToggleGroup>

        {mode === 'month' && (
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto text-xs text-muted-foreground">
          {format(from, 'd MMM yyyy')} — {format(to, 'd MMM yyyy')}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => goToMembers(c.filter)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold font-display truncate">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Retention insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Renewal Rate</h3>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold font-display">{retention.renewalRate}%</p>
                <p className="text-sm text-muted-foreground mb-1">{retention.renewedCount} renewed</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${retention.renewalRate}%` }} />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Drop-off Rate</h3>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold font-display">{retention.dropOffRate}%</p>
                <p className="text-sm text-muted-foreground mb-1">{retention.droppedCount} dropped</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-destructive transition-all" style={{ width: `${retention.dropOffRate}%` }} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <ChartCard
                title={`Member Growth (${granularity === 'day' ? 'Daily' : 'Monthly'})`}
                hint="Click a point to filter members list"
              >
                <LineChart data={growthSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="joined" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="New Members" />
                </LineChart>
              </ChartCard>
            </div>

            <ChartCard title="Plan Distribution" hint="Click slice to filter">
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  label={(e: any) => `${e.name}: ${e.value}`}
                  onClick={(e: any) => {
                    if (e?.name) goToMembers({ plan: e.name });
                  }}
                  cursor="pointer"
                >
                  {planDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ChartCard>

            <ChartCard title="Expiry Analysis">
              <BarChart data={expiryAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(e: any) => {
                    const name = e?.name as string | undefined;
                    if (name === 'Expired') goToMembers({ status: 'expired' });
                    else if (name === 'Expiring 7d') goToMembers({ expiry: '7days' });
                    else if (name === 'Expiring 30d') goToMembers({ expiry: '30days' });
                    else if (name === 'Long-term') goToMembers({ status: 'active' });
                  }}
                >
                  {expiryAnalysis.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
