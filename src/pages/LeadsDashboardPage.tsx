import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, LEAD_STAGES } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, UserPlus, Phone, UserCheck, TrendingUp } from 'lucide-react';
import { LeadsDashboardCharts, type LeadsChartsData } from '@/components/dashboard/LeadsDashboardCharts';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

type Mode = 'month' | 'year';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function LeadsDashboardPage() {
  const navigate = useNavigate();
  const { leads, isLoading } = useLeads();
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

  const periodLeads = useMemo(() => {
    return leads.filter(l => {
      const d = new Date(l.created_at);
      return d >= from && d <= to;
    });
  }, [leads, from, to]);

  const stats = useMemo(() => {
    const total = periodLeads.length;
    const newL = periodLeads.filter(l => l.status === 'new').length;
    const contacted = periodLeads.filter(l => l.status === 'contacted' || l.status === 'visit_scheduled').length;
    const converted = periodLeads.filter(l => l.status === 'joined').length;
    const lost = periodLeads.filter(l => l.status === 'lost').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, newL, contacted, converted, lost, conversionRate };
  }, [periodLeads]);

  const chartData: LeadsChartsData = useMemo(() => {
    const buckets = granularity === 'day'
      ? eachDayOfInterval({ start: from, end: to }).map(d => ({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'd MMM') }))
      : eachMonthOfInterval({ start: from, end: to }).map(d => ({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM') }));

    const trend = buckets.map(b => {
      const inBucket = periodLeads.filter(l => {
        const k = granularity === 'day' ? l.created_at.slice(0, 10) : l.created_at.slice(0, 7);
        return k === b.key;
      });
      return {
        label: b.label,
        leads: inBucket.length,
        converted: inBucket.filter(l => l.status === 'joined').length,
      };
    });

    const statusDist = LEAD_STAGES
      .map(s => ({ name: s.label, value: periodLeads.filter(l => l.status === s.value).length }))
      .filter(s => s.value > 0);

    const totalCount = periodLeads.length;
    const contactedPlus = periodLeads.filter(l => ['contacted', 'visit_scheduled', 'joined'].includes(l.status)).length;
    const convertedCount = periodLeads.filter(l => l.status === 'joined').length;
    const funnel = [
      { name: 'Total', value: totalCount },
      { name: 'Contacted', value: contactedPlus },
      { name: 'Converted', value: convertedCount },
    ];

    const goalMap = new Map<string, number>();
    periodLeads.forEach(l => {
      const g = l.fitness_goal || 'Unknown';
      goalMap.set(g, (goalMap.get(g) || 0) + 1);
    });
    const goalDist = Array.from(goalMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { trend, statusDist, funnel, goalDist };
  }, [periodLeads, from, to, granularity]);

  const goToLeads = (params: Record<string, string>) => {
    const sp = new URLSearchParams({
      mode,
      year: String(year),
      ...(mode === 'month' ? { month: String(month) } : {}),
      ...params,
    });
    navigate(`/app/leads?${sp.toString()}`);
  };

  const cards = [
    { label: 'Total Leads', value: stats.total, icon: Users, tone: 'text-blue-400 bg-blue-500/10', filter: 'all' },
    { label: 'New', value: stats.newL, icon: UserPlus, tone: 'text-yellow-400 bg-yellow-500/10', filter: 'new' },
    { label: 'Contacted', value: stats.contacted, icon: Phone, tone: 'text-purple-400 bg-purple-500/10', filter: 'contacted' },
    { label: 'Converted', value: stats.converted, icon: UserCheck, tone: 'text-primary bg-primary/10', filter: 'joined' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, tone: 'text-chart-4 bg-chart-4/10', filter: 'joined' },
  ];

  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Leads Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Growth & conversion analytics</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => goToLeads({ status: c.filter })}
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
      ) : periodLeads.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No data available for selected period
        </div>
      ) : (
        <LeadsDashboardCharts data={chartData} granularity={granularity} />
      )}
    </div>
  );
}
