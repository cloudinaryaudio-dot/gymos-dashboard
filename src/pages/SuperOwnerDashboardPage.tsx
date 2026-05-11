import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, Users, IndianRupee, AlertCircle, TrendingUp, UserPlus, Receipt, Activity, ArrowRight, BarChart3, CreditCard, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDemoMode } from '@/demo/DemoModeContext';
import {
  getSuperOwnerGyms,
  getSuperOwnerAnalytics,
  setActiveSuperOwnerVendor,
  getActiveSuperOwnerVendor,
} from '@/demo/superOwnerService';
import { getSuperOwnerPermission, summarizeAccess, type AccessLevel } from '@/demo/superOwnerPermissions';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function SuperOwnerDashboardPage() {
  const { isDemo, currentUser, changeTick } = useDemoMode();
  const [active, setActive] = useState<string>(() => getActiveSuperOwnerVendor() ?? 'all');

  // Reset active filter when switching users
  useEffect(() => {
    setActive(getActiveSuperOwnerVendor() ?? 'all');
  }, [currentUser?.id, changeTick]);

  const gyms = useMemo(
    () => (currentUser ? getSuperOwnerGyms(currentUser.id) : []),
    [currentUser?.id, changeTick],
  );

  const analytics = useMemo(
    () => (currentUser ? getSuperOwnerAnalytics(currentUser.id, active === 'all' ? null : active) : null),
    [currentUser?.id, active, changeTick],
  );

  if (!isDemo || !currentUser || currentUser.role !== 'super_owner') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onChange = (v: string) => {
    setActive(v);
    setActiveSuperOwnerVendor(v === 'all' ? null : v);
  };

  if (!analytics) return null;
  const { totals, perGym, monthlyRevenue, gymComparison } = analytics;

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-display truncate">{currentUser.name}</h1>
          <p className="text-sm text-muted-foreground">
            Centralized overview across {gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={active} onValueChange={onChange}>
            <SelectTrigger className="w-[220px] sm:w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gyms (combined)</SelectItem>
              {gyms.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name} · {g.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {gyms.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          No gyms assigned yet. A super admin can assign gyms from the Super Owners page.
        </CardContent></Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard title="Revenue (MTD)" value={fmtINR(totals.revenue)} change={`Profit ${fmtINR(totals.profit)}`} changeType={totals.profit >= 0 ? 'positive' : 'negative'} icon={IndianRupee} />
            <StatCard title="Active Members" value={String(totals.activeMembers)} change={`Total ${totals.members}`} changeType="neutral" icon={Users} />
            <StatCard title="Pending Payments" value={String(totals.pendingCount)} change={`Overdue ${fmtINR(totals.overdueAmount)}`} changeType={totals.overdueAmount > 0 ? 'negative' : 'neutral'} icon={AlertCircle} />
            <StatCard title="PT Revenue" value={fmtINR(totals.ptRevenue)} change="All-time" changeType="positive" icon={TrendingUp} />
            <StatCard title="Leads" value={String(totals.leads)} change="All-time" changeType="neutral" icon={UserPlus} />
            <StatCard title="Expenses (MTD)" value={fmtINR(totals.expenses)} change="This month" changeType="neutral" icon={Receipt} />
            <StatCard title="Gyms" value={String(gyms.length)} change={active === 'all' ? 'Combined view' : 'Single gym'} changeType="neutral" icon={Building2} />
            <StatCard title="Activity" value={String(totals.members + totals.leads)} change="Members + Leads" changeType="neutral" icon={Activity} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue & Expenses (last 6 months)</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(v: number) => fmtINR(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Gym-wise Revenue (MTD)</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gymComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(v: number) => fmtINR(v)} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Per-gym comparison table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Gym Comparison</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium">Gym</th>
                    <th className="text-right p-3 font-medium">Members</th>
                    <th className="text-right p-3 font-medium">Active</th>
                    <th className="text-right p-3 font-medium hidden sm:table-cell">Leads</th>
                    <th className="text-right p-3 font-medium">Revenue (MTD)</th>
                    <th className="text-right p-3 font-medium">Pending</th>
                    <th className="text-right p-3 font-medium hidden md:table-cell">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {perGym.map(g => (
                    <tr key={g.vendor_id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium truncate">{g.vendor_name}</div>
                        <div className="text-xs text-muted-foreground">{g.city}</div>
                      </td>
                      <td className="p-3 text-right">{g.members}</td>
                      <td className="p-3 text-right">
                        <Badge variant="secondary" className="font-mono">{g.active_members}</Badge>
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">{g.leads}</td>
                      <td className="p-3 text-right font-medium">{fmtINR(g.revenue)}</td>
                      <td className="p-3 text-right">{g.pending}</td>
                      <td className="p-3 text-right hidden md:table-cell text-destructive">
                        {g.overdue_amount > 0 ? fmtINR(g.overdue_amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
