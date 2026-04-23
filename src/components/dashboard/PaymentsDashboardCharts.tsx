import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

interface ChartData {
  series: { label: string; in: number; expected: number; lost: number }[];
  methodData: { name: string; value: number }[];
  planRevenue: { name: string; value: number }[];
}

const COLORS = ['hsl(var(--primary))', '#f97316', '#3b82f6', '#a855f7', '#eab308', '#06b6d4'];

export default function PaymentsDashboardCharts({
  variant, data,
}: { variant: 'cashflow' | 'method' | 'plan'; data: ChartData }) {
  if (variant === 'cashflow') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data.series} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="in" name="Money In" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expected" name="Expected" stroke="#f97316" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="lost" name="Lost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (variant === 'method') {
    if (data.methodData.length === 0) {
      return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No method data</div>;
    }
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data.methodData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={45}
            paddingAngle={2}
          >
            {data.methodData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // plan
  if (data.planRevenue.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No plan revenue data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.planRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
        />
        <Bar dataKey="value" name="Revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
