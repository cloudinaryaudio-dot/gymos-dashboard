import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, IndianRupee, Receipt, TrendingUp, UserPlus, UserMinus, Users, AlertCircle, Target } from 'lucide-react';
import type { AnalyticsResult } from '@/services/dataService';

interface KpiItem {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'destructive' | 'muted';
}

function KpiCard({ title, value, hint, icon: Icon, tone }: KpiItem) {
  const toneClass = {
    primary: 'text-primary bg-primary/10',
    success: 'text-emerald-500 bg-emerald-500/10',
    destructive: 'text-destructive bg-destructive/10',
    muted: 'text-muted-foreground bg-muted',
  }[tone];

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold font-display truncate">{value}</p>
            {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsKpis({ kpis }: { kpis: AnalyticsResult['kpis'] }) {
  const items: KpiItem[] = [
    { title: 'Total Revenue', value: `₹${kpis.totalRevenue.toLocaleString()}`, icon: IndianRupee, tone: 'success' },
    { title: 'Total Expenses', value: `₹${kpis.totalExpenses.toLocaleString()}`, icon: Receipt, tone: 'destructive' },
    {
      title: 'Net Profit', value: `₹${kpis.netProfit.toLocaleString()}`,
      hint: kpis.netProfit >= 0 ? 'In profit' : 'In loss',
      icon: TrendingUp, tone: kpis.netProfit >= 0 ? 'primary' : 'destructive',
    },
    { title: 'New Members', value: kpis.newMembers.toString(), icon: UserPlus, tone: 'primary' },
    { title: 'Members Left', value: kpis.membersLeft.toString(), icon: UserMinus, tone: 'destructive' },
    { title: 'Active Members', value: kpis.activeMembers.toString(), icon: Users, tone: 'primary' },
    {
      title: 'Pending Payments', value: kpis.pendingPayments.toString(),
      hint: kpis.pendingAmount > 0 ? `₹${kpis.pendingAmount.toLocaleString()}` : 'All clear',
      icon: AlertCircle, tone: kpis.pendingPayments > 0 ? 'destructive' : 'success',
    },
    { title: 'New Leads', value: kpis.newLeads.toString(), hint: `${kpis.convertedLeads} converted`, icon: Target, tone: 'muted' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((it, i) => (
        <div key={it.title} style={{ animationDelay: `${i * 50}ms` }}>
          <KpiCard {...it} />
        </div>
      ))}
    </div>
  );
}
