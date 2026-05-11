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

const ACCESS_BADGE: Record<AccessLevel, { label: string; className: string }> = {
  full:      { label: 'Full Access',     className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  limited:   { label: 'Limited Access',  className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  analytics: { label: 'Analytics Only',  className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  none:      { label: 'No Access',       className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function SuperOwnerDashboardPage() {
  const { isDemo, currentUser, changeTick } = useDemoMode();
  const navigate = useNavigate();
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

          {/* Quick-access gym cards */}
          {currentUser && (
            <div>
              <h2 className="text-lg font-semibold font-display mb-3">Your Gyms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {perGym.map(g => {
                  const perm = getSuperOwnerPermission(currentUser.id, g.vendor_id);
                  const level = summarizeAccess(perm);
                  const badge = ACCESS_BADGE[level];
                  const open = (path: string, module?: string) => {
                    if (module && !(perm.modules as Record<string, boolean>)[module]) return;
                    setActiveSuperOwnerVendor(g.vendor_id);
                    navigate(path);
                  };
                  return (
                    <Card key={g.vendor_id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{g.vendor_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{g.city}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>{badge.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-muted-foreground">Revenue</div>
                            <div className="font-semibold">{fmtINR(g.revenue)}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-muted-foreground">Active</div>
                            <div className="font-semibold">{g.active_members}/{g.members}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-muted-foreground">Pending</div>
                            <div className="font-semibold">{g.pending}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-muted-foreground">Leads</div>
                            <div className="font-semibold">{g.leads}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={level === 'none' || !perm.modules.dashboard}
                          onClick={() => open('/app/dashboard', 'dashboard')}
                        >
                          Open Gym Dashboard <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <div className="grid grid-cols-3 gap-1.5">
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs gap-1"
                            disabled={!perm.modules.members}
                            onClick={() => open('/app/members', 'members')}>
                            <Users className="h-3 w-3" /> Members
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs gap-1"
                            disabled={!perm.modules.payments}
                            onClick={() => open('/app/payments', 'payments')}>
                            <CreditCard className="h-3 w-3" /> Pay
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs gap-1"
                            disabled={!perm.modules.analytics}
                            onClick={() => open('/app/analytics', 'analytics')}>
                            <BarChart3 className="h-3 w-3" /> Stats
                          </Button>
                        </div>
                        {!perm.allow_full_owner_view && level !== 'none' && (
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" /> Read-only access
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

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
