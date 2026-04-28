import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AnalyticsResult } from '@/services/dataService';
import type { ChartVariant } from './AnalyticsCharts';

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2, 200 70% 50%))', 'hsl(var(--chart-3, 280 60% 55%))', 'hsl(var(--chart-4, 30 80% 55%))', 'hsl(var(--chart-5, 340 70% 55%))', 'hsl(var(--accent))'];

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
};

function ChartCard({ title, children, height = 280 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-5">
      <h3 className="font-display font-semibold text-sm mb-3 sm:mb-4">{title}</h3>
      <div style={{ width: '100%', height, minHeight: 250 }}>{children}</div>
    </div>
  );
}

export default function AnalyticsChartsInner({ data, variant }: { data: AnalyticsResult; variant: ChartVariant }) {
  const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;
  const fullFmt = (v: number) => `₹${Number(v).toLocaleString()}`;

  if (variant === 'today') {
    // Compact summary — small bar of revenue/expenses + leads/conversions count
    const summary = [
      { name: 'Revenue', value: data.kpis.totalRevenue },
      { name: 'Expenses', value: data.kpis.totalExpenses },
      { name: 'Profit', value: data.kpis.netProfit },
    ];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Today's Money Flow">
          <ResponsiveContainer>
            <BarChart data={summary} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fullFmt(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Today's Activity">
          <div className="h-full grid grid-cols-2 gap-4 content-center">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold font-display text-primary">{data.kpis.newMembers}</p>
              <p className="text-xs text-muted-foreground mt-1">New joins today</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold font-display text-primary">{data.kpis.newLeads}</p>
              <p className="text-xs text-muted-foreground mt-1">Walk-in leads</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center col-span-2">
              <p className="text-3xl font-bold font-display text-emerald-500">{data.kpis.convertedLeads}</p>
              <p className="text-xs text-muted-foreground mt-1">Conversions (lead → member)</p>
            </div>
          </div>
        </ChartCard>
      </div>
    );
  }

  if (variant === 'weekly') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Revenue Trend">
          <ResponsiveContainer>
            <LineChart data={data.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fullFmt(v)} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="New Members per Day">
          <ResponsiveContainer>
            <BarChart data={data.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="newMembers" fill="hsl(var(--accent, var(--primary)))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {data.topDay && (
          <div className="lg:col-span-2 rounded-xl border bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Best performing day</p>
              <p className="text-xl font-display font-semibold mt-1">{data.topDay.label}</p>
            </div>
            <p className="text-2xl font-bold font-display text-primary">{fullFmt(data.topDay.revenue)}</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'monthly') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue vs Expenses">
          <ResponsiveContainer>
            <BarChart data={data.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fullFmt(v)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top Plans Sold">
          {data.planDistribution.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No plans sold in this period</div>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`} labelLine={false}>
                  {data.planDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <div className="lg:col-span-2">
          <ChartCard title="Expense Breakdown by Category">
            {data.expenseBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No expenses in this period</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={data.expenseBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={fmt} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={100} />
                  <Tooltip formatter={(v: number) => fullFmt(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    );
  }

  // yearly
  const profitSeries = data.series.map(s => ({ ...s, profit: s.revenue - s.expenses }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Month-wise Revenue">
        <ResponsiveContainer>
          <LineChart data={data.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={fmt} />
            <Tooltip formatter={(v: number) => fullFmt(v)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Profit Trend">
        <ResponsiveContainer>
          <BarChart data={profitSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={fmt} />
            <Tooltip formatter={(v: number) => fullFmt(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="profit" name="Profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="lg:col-span-2">
        <ChartCard title="New Members per Month">
          <ResponsiveContainer>
            <BarChart data={data.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="newMembers" name="New Members" fill="hsl(var(--accent, var(--primary)))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
