import { DollarSign, Users, Clock, TrendingUp, AlertCircle, Receipt, UserPlus, CalendarDays, Zap, CreditCard, Target, UserCheck, Percent, ShieldAlert } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const s = stats ?? {
    monthlyRevenue: 0, totalExpenses: 0, profit: 0,
    activeMembers: 0, expiringMemberships: 0, expiredMemberships: 0, pendingPayments: 0,
    newLeads: 0, totalLeads: 0, convertedLeads: 0, conversionRate: 0,
    recentPayments: [],
    todayNewMembers: 0, todayPayments: 0, todayPaymentsAmount: 0, todayLeads: 0, monthNewMembers: 0,
    revenueAtRisk: 0,
    overdueCount: 0, totalPendingAmount: 0,
  };

  const statCards = [
    {
      title: 'Monthly Revenue',
      value: `₹${s.monthlyRevenue.toLocaleString()}`,
      change: 'This month (paid)',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Active Members',
      value: s.activeMembers.toString(),
      change: `${s.expiringMemberships} expiring in 3 days`,
      changeType: s.expiringMemberships > 0 ? 'negative' as const : 'positive' as const,
      icon: Users,
    },
    {
      title: 'Expiring Soon',
      value: s.expiringMemberships.toString(),
      change: 'Next 7 days',
      changeType: 'negative' as const,
      icon: Clock,
    },
    {
      title: 'Pending Payments',
      value: s.pendingPayments.toString(),
      change: s.totalPendingAmount > 0 ? `₹${s.totalPendingAmount.toLocaleString()} pending` : 'All clear!',
      changeType: s.pendingPayments > 0 ? 'negative' as const : 'positive' as const,
      icon: AlertCircle,
    },
    {
      title: 'Overdue Payments',
      value: s.overdueCount.toString(),
      change: s.overdueCount > 0 ? 'Collect now' : 'None overdue',
      changeType: s.overdueCount > 0 ? 'negative' as const : 'positive' as const,
      icon: Clock,
    },
    {
      title: 'New Leads',
      value: s.newLeads.toString(),
      change: s.newLeads > 0 ? 'Awaiting contact' : 'No new leads',
      changeType: s.newLeads > 0 ? 'positive' as const : 'neutral' as const,
      icon: UserPlus,
    },
    {
      title: 'Revenue at Risk',
      value: `₹${s.revenueAtRisk.toLocaleString()}`,
      change: `${s.expiringMemberships + s.expiredMemberships} members need renewal`,
      changeType: s.revenueAtRisk > 0 ? 'negative' as const : 'positive' as const,
      icon: ShieldAlert,
    },
    {
      title: 'Converted Leads',
      value: s.convertedLeads.toString(),
      change: `${s.conversionRate}% conversion rate`,
      changeType: s.conversionRate > 0 ? 'positive' as const : 'neutral' as const,
      icon: UserCheck,
    },
  ];

  const todayItems = [
    { label: 'New Members', value: s.todayNewMembers, icon: UserPlus, color: 'text-primary' },
    { label: 'Payments', value: s.todayPayments, sub: s.todayPaymentsAmount > 0 ? `₹${s.todayPaymentsAmount.toLocaleString()}` : null, icon: CreditCard, color: 'text-chart-2' },
    { label: 'New Leads', value: s.todayLeads, icon: Target, color: 'text-chart-4' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Today's Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {todayItems.map((item) => (
            <div key={item.label} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.sub && <p className="text-xs font-medium text-primary mt-0.5">{item.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.title} style={{ animationDelay: `${i * 80}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-display font-semibold mb-4">Revenue — Last 6 Months</h3>
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6 min-h-[280px]">
          <h3 className="font-display font-semibold mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <span className="font-semibold text-primary">₹{s.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-semibold text-destructive">₹{s.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">New Joins</span>
              <span className="font-semibold">{s.monthNewMembers}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center p-3 rounded-lg bg-primary/5">
              <span className="text-sm font-medium">Net Profit</span>
              <span className={`font-bold text-lg ${s.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                ₹{s.profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Expiring Soon</h3>
          </div>
          <div className="flex flex-col items-center justify-center h-[200px]">
            <p className={`text-5xl font-bold font-display ${s.expiringMemberships > 0 ? 'text-destructive' : 'text-primary'}`}>
              {s.expiringMemberships}
            </p>
            <p className="text-sm text-muted-foreground mt-2">memberships in next 7 days</p>
            {s.expiringMemberships > 0 && (
              <p className="text-xs text-destructive mt-1 font-medium">Follow up to retain</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Recent Payments</h3>
          </div>
          {s.recentPayments.length > 0 ? (
            <div className="space-y-3">
              {s.recentPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{p.member_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">₹{p.amount.toLocaleString()}</span>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.date), 'dd MMM')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No payments recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
