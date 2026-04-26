import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Users, Crown, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMembers } from '@/hooks/useMembers';
import { usePlans } from '@/hooks/usePlans';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
}

function KpiCard({ label, value, icon: Icon, gradient }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow ${gradient}`}
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
    </motion.div>
  );
}

const BAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(217 91% 60%)',
  'hsl(142 71% 45%)',
  'hsl(38 92% 50%)',
  'hsl(280 70% 60%)',
  'hsl(340 82% 60%)',
  'hsl(190 90% 50%)',
  'hsl(20 90% 55%)',
];

export default function PlansDashboardPage() {
  const navigate = useNavigate();
  const { data: members = [], isLoading: lm } = useMembers();
  const { data: plans = [], isLoading: lp } = usePlans();

  const isLoading = lm || lp;

  const { rows, totalActive, mostPopular } = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');
    const counts = new Map<string, number>();
    activeMembers.forEach(m => {
      const key = m.plan_id || 'unassigned';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const rows = plans.map(p => ({
      id: p.id,
      name: p.name,
      count: counts.get(p.id) || 0,
    })).sort((a, b) => b.count - a.count);

    const unassigned = counts.get('unassigned') || 0;
    if (unassigned > 0) {
      rows.push({ id: 'unassigned', name: 'Unassigned', count: unassigned });
    }

    const totalActive = activeMembers.length;
    const mostPopular = rows.find(r => r.count > 0)?.name ?? '—';

    return { rows, totalActive, mostPopular };
  }, [members, plans]);

  const handleRowClick = (planId: string) => {
    if (planId === 'unassigned') return;
    navigate(`/app/members?plan=${planId}&status=active`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/plans')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Plans Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Active members per plan — performance overview</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total Plans"
          value={String(plans.length)}
          icon={Package}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <KpiCard
          label="Total Active Members"
          value={String(totalActive)}
          icon={Users}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <KpiCard
          label="Most Popular Plan"
          value={mostPopular}
          icon={Crown}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Bar Chart */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Active Members by Plan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[360px]">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : rows.length === 0 || rows.every(r => r.count === 0) ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No active members yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} members`, 'Active']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Plan Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-32 w-full" /></div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No plans created yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead className="text-right">Active Members</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const share = totalActive > 0 ? (r.count / totalActive) * 100 : 0;
                  return (
                    <TableRow
                      key={r.id}
                      className={r.id !== 'unassigned' ? 'cursor-pointer hover:bg-muted/40' : ''}
                      onClick={() => handleRowClick(r.id)}
                    >
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{r.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{share.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
