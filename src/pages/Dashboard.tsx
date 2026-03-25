import { DollarSign, Users, Clock, TrendingUp, AlertCircle, Receipt, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
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
    activeMembers: 0, expiringMemberships: 0, pendingPayments: 0, newLeads: 0,
    recentPayments: [],
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
      title: 'Total Expenses',
      value: `₹${s.totalExpenses.toLocaleString()}`,
      change: 'This month',
      changeType: 'neutral' as const,
      icon: Receipt,
    },
    {
      title: 'Profit',
      value: `₹${s.profit.toLocaleString()}`,
      change: s.profit >= 0 ? 'Revenue - Expenses' : 'Net loss this month',
      changeType: s.profit >= 0 ? 'positive' as const : 'negative' as const,
      icon: TrendingUp,
    },
    {
      title: 'Active Members',
      value: s.activeMembers.toString(),
      change: `${s.expiringMemberships} expiring in 7 days`,
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
      change: s.pendingPayments > 0 ? 'Needs follow-up' : 'All clear!',
      changeType: s.pendingPayments > 0 ? 'negative' as const : 'positive' as const,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's your gym overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.title} style={{ animationDelay: `${i * 80}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
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
            <div className="border-t pt-3 flex justify-between items-center p-3 rounded-lg bg-primary/5">
              <span className="text-sm font-medium">Net Profit</span>
              <span className={`font-bold text-lg ${s.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                ₹{s.profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 min-h-[280px]">
          <h3 className="font-display font-semibold mb-4">Recent Payments</h3>
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
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No payments recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
