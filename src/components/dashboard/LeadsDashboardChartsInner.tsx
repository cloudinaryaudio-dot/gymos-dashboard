import {
  ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { LeadsChartsData } from './LeadsDashboardCharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
  },
} as const;

function ChartCard({ title, children, height = 280, onClick }: { title: string; children: React.ReactNode; height?: number; onClick?: () => void }) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function LeadsDashboardChartsInner({ data, granularity }: { data: LeadsChartsData; granularity: 'day' | 'month' }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2">
        <ChartCard title={`Lead Trend (${granularity === 'day' ? 'Daily' : 'Monthly'})`}>
          <LineChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
            <Line type="monotone" dataKey="converted" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="Converted" />
          </LineChart>
        </ChartCard>
      </div>

      <ChartCard title="Status Distribution">
        <PieChart>
          <Pie data={data.statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`}>
            {data.statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ChartCard>

      <ChartCard title="Conversion Funnel">
        <BarChart data={data.funnel} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={90} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ChartCard>

      {data.goalDist.length > 0 && (
        <div className="lg:col-span-2">
          <ChartCard title="Top Fitness Goals">
            <BarChart data={data.goalDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
