import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, Wallet, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ExpensesDashboardPage() {
  const navigate = useNavigate();
  const { data: expenses, isLoading } = useExpenses();
  const now = new Date();
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, label: format(new Date(2000, i, 1), 'MMMM') }));

  const periodLabel = mode === 'month'
    ? format(new Date(selYear, selMonth - 1, 1), 'MMMM yyyy')
    : String(selYear);

  // current period
  const inPeriod = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const d = new Date(e.expense_date);
      if (mode === 'month') return d.getMonth() + 1 === selMonth && d.getFullYear() === selYear;
      return d.getFullYear() === selYear;
    });
  }, [expenses, mode, selMonth, selYear]);

  // previous period for comparison
  const inPrev = useMemo(() => {
    if (!expenses) return [];
    let pMonth = selMonth, pYear = selYear;
    if (mode === 'month') {
      pMonth = selMonth - 1;
      if (pMonth === 0) { pMonth = 12; pYear = selYear - 1; }
    } else {
      pYear = selYear - 1;
    }
    return expenses.filter(e => {
      const d = new Date(e.expense_date);
      if (mode === 'month') return d.getMonth() + 1 === pMonth && d.getFullYear() === pYear;
      return d.getFullYear() === pYear;
    });
  }, [expenses, mode, selMonth, selYear]);

  const total = inPeriod.reduce((s, e) => s + Number(e.amount), 0);
  const prevTotal = inPrev.reduce((s, e) => s + Number(e.amount), 0);
  const avg = inPeriod.length ? total / inPeriod.length : 0;
  const changePct = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : (total > 0 ? 100 : 0);

  // Category breakdown
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    inPeriod.forEach(e => {
      const c = e.category || 'Other';
      map.set(c, (map.get(c) || 0) + Number(e.amount));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [inPeriod]);

  const topCategory = byCategory[0];

  // Trend (daily for month, monthly for year)
  const trend = useMemo(() => {
    if (mode === 'month') {
      const days = new Date(selYear, selMonth, 0).getDate();
      const arr = Array.from({ length: days }, (_, i) => ({ label: String(i + 1), value: 0 }));
      inPeriod.forEach(e => {
        const day = new Date(e.expense_date).getDate();
        arr[day - 1].value += Number(e.amount);
      });
      return arr;
    }
    const arr = Array.from({ length: 12 }, (_, i) => ({
      label: format(new Date(2000, i, 1), 'MMM'), value: 0,
    }));
    inPeriod.forEach(e => {
      const m = new Date(e.expense_date).getMonth();
      arr[m].value += Number(e.amount);
    });
    return arr;
  }, [inPeriod, mode, selMonth, selYear]);

  // Monthly comparison: last 6 months for current selected year context
  const monthlyComparison = useMemo(() => {
    if (!expenses) return [];
    const arr: { label: string; value: number; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const sum = expenses
        .filter(e => {
          const ed = new Date(e.expense_date);
          return ed.getMonth() + 1 === m && ed.getFullYear() === y;
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      arr.push({ label: format(d, 'MMM yy'), value: sum, month: m, year: y });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  // Smart Insights
  const insights = useMemo(() => {
    const items: { icon: any; text: string; tone: 'default' | 'warn' }[] = [];
    if (topCategory) {
      const pct = total > 0 ? Math.round((topCategory.value / total) * 100) : 0;
      items.push({
        icon: Sparkles,
        text: `${topCategory.name} accounts for ${pct}% of spending (₹${topCategory.value.toLocaleString()}).`,
        tone: 'default',
      });
    }
    // spike detection vs prev period
    if (prevTotal > 0 && changePct > 30) {
      items.push({
        icon: AlertTriangle,
        text: `Spending up ${Math.round(changePct)}% vs previous ${mode}. Review recent additions.`,
        tone: 'warn',
      });
    }
    // fixed vs variable (heuristic: Rent/Salaries/Utilities = fixed)
    const fixedSet = new Set(['Rent', 'Salaries', 'Utilities']);
    const fixed = inPeriod.filter(e => fixedSet.has(e.category || '')).reduce((s, e) => s + Number(e.amount), 0);
    const variable = total - fixed;
    if (total > 0) {
      items.push({
        icon: Layers,
        text: `Fixed: ₹${fixed.toLocaleString()} · Variable: ₹${variable.toLocaleString()}`,
        tone: 'default',
      });
    }
    if (byCategory.length >= 2) {
      const heavy = byCategory.filter(c => total > 0 && c.value / total > 0.25);
      if (heavy.length > 0) {
        items.push({
          icon: TrendingUp,
          text: `Cost-heavy areas: ${heavy.map(h => h.name).join(', ')}`,
          tone: 'default',
        });
      }
    }
    return items;
  }, [topCategory, total, prevTotal, changePct, inPeriod, byCategory, mode]);

  const drillToCategory = (cat: string) => {
    navigate(`/app/expenses?category=${encodeURIComponent(cat)}&mode=${mode}&month=${selMonth}&year=${selYear}`);
  };
  const drillToMonth = (m: number, y: number) => {
    navigate(`/app/expenses?mode=month&month=${m}&year=${y}`);
  };
  const drillToCurrent = () => {
    navigate(`/app/expenses?mode=${mode}&month=${selMonth}&year=${selYear}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/expenses')} className="-ml-2 mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Expenses
          </Button>
          <h1 className="text-2xl font-bold font-display">Expenses Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Insights for {periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === 'month' && (
            <Select value={String(selMonth)} onValueChange={(v) => setSelMonth(parseInt(v, 10))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={String(selYear)} onValueChange={(v) => setSelYear(parseInt(v, 10))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={Wallet} label="Total Expenses"
          value={`₹${total.toLocaleString()}`}
          onClick={drillToCurrent}
        />
        <KpiCard
          icon={Layers} label="Top Category"
          value={topCategory?.name ?? '—'}
          hint={topCategory ? `₹${topCategory.value.toLocaleString()}` : undefined}
          onClick={() => topCategory && drillToCategory(topCategory.name)}
        />
        <KpiCard
          icon={Receipt} label="Avg / Entry"
          value={`₹${Math.round(avg).toLocaleString()}`}
        />
        <KpiCard
          icon={Receipt} label="Total Entries"
          value={String(inPeriod.length)}
          onClick={drillToCurrent}
        />
        <KpiCard
          icon={changePct >= 0 ? TrendingUp : TrendingDown}
          label={`Change vs prev ${mode}`}
          value={`${changePct >= 0 ? '+' : ''}${Math.round(changePct)}%`}
          tone={changePct > 30 ? 'warn' : 'default'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <EmptyChart label="No data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={byCategory} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    onClick={(d: any) => d?.name && drillToCategory(d.name)}
                    cursor="pointer"
                  >
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {mode === 'month' ? 'Daily Trend' : 'Monthly Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trend.every(t => t.value === 0) ? (
              <EmptyChart label="No data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Last 6 Months Comparison</CardTitle></CardHeader>
          <CardContent>
            {monthlyComparison.every(m => m.value === 0) ? (
              <EmptyChart label="No data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyComparison} onClick={(e: any) => {
                  const p = e?.activePayload?.[0]?.payload;
                  if (p) drillToMonth(p.month, p.year);
                }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart insights */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Smart Insights</CardTitle></CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No insights for this period yet.</p>
          ) : (
            <ul className="space-y-3">
              {insights.map((it, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    it.tone === 'warn' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  }`}>
                    <it.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm pt-1.5">{it.text}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Category list with drill-down */}
      {byCategory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Categories ({periodLabel})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {byCategory.map(c => (
                <button key={c.name} onClick={() => drillToCategory(c.name)}>
                  <Badge variant="secondary" className="hover:bg-primary/20 cursor-pointer">
                    {c.name} · ₹{c.value.toLocaleString()}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, hint, onClick, tone = 'default' }: {
  icon: any; label: string; value: string; hint?: string; onClick?: () => void; tone?: 'default' | 'warn';
}) {
  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            tone === 'warn' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-xl font-bold truncate">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
