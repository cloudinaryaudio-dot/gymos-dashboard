import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as ds from '@/services/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IndianRupee, Receipt, TrendingUp, TrendingDown, Users, UserPlus, Target,
  AlertTriangle, ArrowRight, Wallet, Activity, Sparkles, CalendarClock,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

type RangeKey = 'today' | 'week' | 'month' | 'year';

function getRange(key: RangeKey, selectedYear?: number): { from: string; to: string; prevFrom: string; prevTo: string; granularity: 'day' | 'month' } {
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const cloneAdd = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };

  if (key === 'today') {
    const from = ymd(today);
    const prev = cloneAdd(today, -1);
    return { from, to: from, prevFrom: ymd(prev), prevTo: ymd(prev), granularity: 'day' };
  }
  if (key === 'week') {
    const start = cloneAdd(today, -6);
    const prevEnd = cloneAdd(start, -1);
    const prevStart = cloneAdd(prevEnd, -6);
    return { from: ymd(start), to: ymd(today), prevFrom: ymd(prevStart), prevTo: ymd(prevEnd), granularity: 'day' };
  }
  if (key === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: ymd(start), to: ymd(today), prevFrom: ymd(prevStart), prevTo: ymd(prevEnd), granularity: 'day' };
  }
  // year — supports selected year
  const y = selectedYear ?? today.getFullYear();
  const isCurrent = y === today.getFullYear();
  const start = new Date(y, 0, 1);
  const end = isCurrent ? today : new Date(y, 11, 31);
  const prevStart = new Date(y - 1, 0, 1);
  const prevEnd = new Date(y - 1, 11, 31);
  return { from: ymd(start), to: ymd(end), prevFrom: ymd(prevStart), prevTo: ymd(prevEnd), granularity: 'month' };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

function KpiCard({
  title, value, hint, icon: Icon, change, onClick, tone = 'primary',
}: {
  title: string; value: string; hint?: string; icon: any; change?: number | null;
  onClick?: () => void; tone?: 'primary' | 'success' | 'destructive' | 'muted';
}) {
  const toneClass = {
    primary: 'text-primary bg-primary/10',
    success: 'text-emerald-500 bg-emerald-500/10',
    destructive: 'text-destructive bg-destructive/10',
    muted: 'text-muted-foreground bg-muted',
  }[tone];
  return (
    <Card
      className={`transition-all ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold font-display truncate">{value}</p>
            <div className="flex items-center gap-2">
              {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
              {change !== undefined && change !== null && (
                <span className={`inline-flex items-center text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {Math.abs(change)}%
                </span>
              )}
            </div>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OwnerSummaryPage() {
  const navigate = useNavigate();
  const [rangeKey, setRangeKey] = useState<RangeKey>('month');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const range = useMemo(() => getRange(rangeKey, selectedYear), [rangeKey, selectedYear]);

  const { data: curr, isLoading } = useQuery({
    queryKey: ['owner-summary', 'curr', rangeKey, selectedYear],
    queryFn: () => ds.getAnalytics({ from: range.from, to: range.to }, range.granularity),
  });
  const { data: prev } = useQuery({
    queryKey: ['owner-summary', 'prev', rangeKey, selectedYear],
    queryFn: () => ds.getAnalytics({ from: range.prevFrom, to: range.prevTo }, range.granularity),
  });
  const { data: members = [] } = useQuery({ queryKey: ['members'], queryFn: ds.getMembers });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: ds.getPayments });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: ds.getLeads });

  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7);
  const sevenStr = sevenDays.toISOString().slice(0, 10);

  const expiringSoon = members.filter(m => m.expiry_date >= today && m.expiry_date <= sevenStr);
  const expired = members.filter(m => m.expiry_date < today);
  const active = members.filter(m => m.expiry_date >= today);

  const collectedAmt = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmt = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmt = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0);

  const leadsNew = leads.filter(l => l.status === 'new').length;
  const leadsContacted = leads.filter(l => l.status === 'contacted').length;
  const leadsConverted = leads.filter(l => l.status === 'joined').length;

  const k = curr?.kpis;
  const pk = prev?.kpis;

  // Insights
  const insights: { text: string; tone: 'success' | 'warning' | 'info' }[] = [];
  if (k && pk) {
    const revChange = pctChange(k.totalRevenue, pk.totalRevenue);
    if (revChange !== null && revChange > 5) insights.push({ text: `Revenue increased by ${revChange}% vs previous period.`, tone: 'success' });
    if (revChange !== null && revChange < -5) insights.push({ text: `Revenue dropped ${Math.abs(revChange)}% vs previous period.`, tone: 'warning' });
    const expChange = pctChange(k.totalExpenses, pk.totalExpenses);
    if (expChange !== null && expChange > 20) insights.push({ text: `Expenses spiked ${expChange}% — review categories.`, tone: 'warning' });
  }
  if (overdueAmt > 0) insights.push({ text: `₹${overdueAmt.toLocaleString()} in overdue payments — follow up needed.`, tone: 'warning' });
  if (curr?.planDistribution?.length) {
    const top = [...curr.planDistribution].sort((a, b) => b.value - a.value)[0];
    if (top) insights.push({ text: `Most members are on the ${top.name} plan.`, tone: 'info' });
  }
  if (curr?.expenseBreakdown?.length) {
    const top = [...curr.expenseBreakdown].sort((a, b) => b.value - a.value)[0];
    if (top) insights.push({ text: `Top expense category: ${top.name} (₹${top.value.toLocaleString()}).`, tone: 'info' });
  }

  // Alerts
  const alerts: { text: string; action: () => void }[] = [];
  if (expiringSoon.length > 0) alerts.push({ text: `${expiringSoon.length} member(s) expiring in next 7 days`, action: () => navigate('/app/members?expiry=7days') });
  if (overdueAmt > 0) alerts.push({ text: `High overdue payments: ₹${overdueAmt.toLocaleString()}`, action: () => navigate('/app/payments') });
  const convRate = leads.length > 0 ? Math.round((leadsConverted / leads.length) * 100) : 0;
  if (leads.length >= 5 && convRate < 20) alerts.push({ text: `Low lead conversion rate: ${convRate}%`, action: () => navigate('/app/leads/dashboard') });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in px-1 sm:px-0">
      {/* Header — mobile stacks: Title → Tabs → Year */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-2">
            <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            Owner Summary
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Your complete business command center</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:flex-wrap">
          <Tabs value={rangeKey} onValueChange={(v) => setRangeKey(v as RangeKey)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
          {rangeKey === 'year' && (
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-full sm:w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading || !k ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <KpiCard title="Total Revenue" value={`₹${k.totalRevenue.toLocaleString()}`} icon={IndianRupee} tone="success"
              change={pk ? pctChange(k.totalRevenue, pk.totalRevenue) : undefined}
              onClick={() => navigate('/app/payments')} />
            <KpiCard title="Total Expenses" value={`₹${k.totalExpenses.toLocaleString()}`} icon={Receipt} tone="destructive"
              change={pk ? pctChange(k.totalExpenses, pk.totalExpenses) : undefined}
              onClick={() => navigate('/app/expenses')} />
            <KpiCard title="Net Profit" value={`₹${k.netProfit.toLocaleString()}`} icon={TrendingUp}
              tone={k.netProfit >= 0 ? 'primary' : 'destructive'}
              hint={k.netProfit >= 0 ? 'In profit' : 'In loss'}
              change={pk ? pctChange(k.netProfit, pk.netProfit) : undefined} />
            <KpiCard title="Active Members" value={k.activeMembers.toString()} icon={Users} tone="primary"
              onClick={() => navigate('/app/members?status=active')} />
            <KpiCard title="New Members" value={k.newMembers.toString()} icon={UserPlus} tone="primary"
              change={pk ? pctChange(k.newMembers, pk.newMembers) : undefined}
              onClick={() => navigate('/app/members')} />
            <KpiCard title="Total Leads" value={k.newLeads.toString()} icon={Target} tone="muted"
              hint={`${k.convertedLeads} converted`}
              onClick={() => navigate('/app/leads')} />
            <KpiCard title="Conversion Rate"
              value={`${k.newLeads > 0 ? Math.round((k.convertedLeads / k.newLeads) * 100) : 0}%`}
              icon={Activity} tone="primary"
              onClick={() => navigate('/app/leads/dashboard')} />
            <KpiCard title="Cash Collected" value={`₹${collectedAmt.toLocaleString()}`} icon={Wallet} tone="success"
              hint={pendingAmt > 0 ? `₹${pendingAmt.toLocaleString()} pending` : 'All clear'}
              onClick={() => navigate('/app/payments')} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">Revenue vs Expenses</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }} className="min-h-[250px] px-2 sm:px-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(curr?.series ?? []).map(s => ({ ...s, profit: s.revenue - s.expenses }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                    <Bar dataKey="profit" fill="hsl(var(--accent))" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Expense Breakdown</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }} className="min-h-[250px] px-2 sm:px-6">
                {curr && curr.expenseBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={curr.expenseBreakdown} dataKey="value" nameKey="name" outerRadius={90} label
                        onClick={() => navigate('/app/expenses/dashboard')} className="cursor-pointer">
                        {curr.expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No expense data</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Cash status */}
            <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('/app/payments')}>
              <CardHeader><CardTitle className="text-lg">Cash Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Collected</span><span className="font-semibold text-emerald-500">₹{collectedAmt.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm">Pending</span><span className="font-semibold text-amber-500">₹{pendingAmt.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm">Overdue</span><span className="font-semibold text-destructive">₹{overdueAmt.toLocaleString()}</span></div>
                {overdueAmt > 0 && (
                  <Badge variant="destructive" className="w-full justify-center mt-2">⚠ Overdue risk</Badge>
                )}
              </CardContent>
            </Card>

            {/* Members health */}
            <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('/app/members/dashboard')}>
              <CardHeader><CardTitle className="text-lg">Members Health</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Active</span><span className="font-semibold text-emerald-500">{active.length}</span></div>
                <div className="flex justify-between"><span className="text-sm">Expiring (7d)</span><span className="font-semibold text-amber-500">{expiringSoon.length}</span></div>
                <div className="flex justify-between"><span className="text-sm">Expired</span><span className="font-semibold text-destructive">{expired.length}</span></div>
                {(() => {
                  const total = members.length || 1;
                  const health = Math.round((active.length / total) * 100);
                  return (
                    <Badge variant={health >= 70 ? 'default' : 'destructive'} className="w-full justify-center mt-2">
                      Retention {health}%
                    </Badge>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Leads funnel */}
            <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('/app/leads')}>
              <CardHeader><CardTitle className="text-lg">Leads Performance</CardTitle></CardHeader>
              <CardContent style={{ height: 200 }} className="min-h-[200px] px-2 sm:px-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { stage: 'New', value: leadsNew },
                    { stage: 'Contacted', value: leadsContacted },
                    { stage: 'Converted', value: leadsConverted },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Quick Insights</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notable insights for this period.</p>
                ) : insights.map((ins, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm border ${
                    ins.tone === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                    ins.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300' :
                    'bg-primary/5 border-primary/20'
                  }`}>{ins.text}</div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Action Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All clear — no urgent actions.</p>
                ) : alerts.map((a, i) => (
                  <button key={i} onClick={a.action}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 hover:bg-accent/5 transition text-left">
                    <span className="text-sm flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-amber-500" />
                      {a.text}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/app/payments')}>View Payments</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/members')}>View Members</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/leads')}>View Leads</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/expenses')}>View Expenses</Button>
          </div>
        </>
      )}
    </div>
  );
}
