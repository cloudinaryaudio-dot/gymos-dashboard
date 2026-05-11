import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, AlertCircle, ShieldAlert, Building2, UserPlus, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useSession } from '@/contexts/SessionContext';
import * as ds from '@/services/dataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SuperOwnerDashboard() {
  const { user, role } = useSession();
  const [filter, setFilter] = useState<string | 'all'>('all');

  if (role !== 'super_owner') {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">This dashboard is for Super Owners only.</p>
      </div>
    );
  }

  const { data: gyms = [] } = useQuery({
    queryKey: ['super-owner-gyms', user?.id],
    queryFn: () => ds.getSuperOwnerGyms(user!.id),
    enabled: !!user,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['super-owner-analytics', user?.id, filter],
    queryFn: () => ds.getSuperOwnerAnalytics(user!.id, filter),
    enabled: !!user,
  });

  const c = analytics?.combined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Super Owner Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.name} · Managing {gyms.length} gym{gyms.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">Viewing:</span>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🏢 All Gyms (Combined)</SelectItem>
              {gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {gyms.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No gyms assigned yet. Contact your platform admin.</p>
          </CardContent>
        </Card>
      )}

      {c && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Revenue (Month)" value={`₹${c.monthlyRevenue.toLocaleString()}`} change={`Across ${c.totalGyms} gym${c.totalGyms === 1 ? '' : 's'}`} changeType="positive" icon={DollarSign} />
            <StatCard title="Active Members" value={c.activeMembers.toString()} change={`${c.totalMembers} total`} changeType="positive" icon={Users} />
            <StatCard title="Pending Payments" value={c.pendingPayments.toString()} change={c.pendingAmount > 0 ? `₹${c.pendingAmount.toLocaleString()} due` : 'All clear'} changeType={c.pendingPayments > 0 ? 'negative' : 'positive'} icon={AlertCircle} />
            <StatCard title="New Leads" value={c.newLeads.toString()} change={`${c.convertedLeads} converted`} changeType="positive" icon={UserPlus} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue Trend (6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={analytics?.revenueTrend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Gym-Wise Revenue Comparison</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={(analytics?.perVendor ?? []).map(p => ({ name: p.vendor.name, revenue: p.revenue }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Per-Gym Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gym</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Members</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(analytics?.perVendor ?? []).map(p => (
                      <TableRow key={p.vendor.id}>
                        <TableCell>
                          <div className="font-medium">{p.vendor.name}</div>
                          <div className="text-xs text-muted-foreground">{p.vendor.location}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{p.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.members}</TableCell>
                        <TableCell className="text-right">{p.activeMembers}</TableCell>
                        <TableCell className={`text-right ${p.overdue > 0 ? 'text-destructive' : ''}`}>{p.overdue}</TableCell>
                        <TableCell className="text-right">{p.leads}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}