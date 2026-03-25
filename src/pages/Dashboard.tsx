import { DollarSign, Users, Clock, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

const stats = [
  { title: 'Total Revenue', value: '₹4,52,000', change: '+12.5% from last month', changeType: 'positive' as const, icon: DollarSign },
  { title: 'Active Members', value: '284', change: '+8 new this week', changeType: 'positive' as const, icon: Users },
  { title: 'Expiring Memberships', value: '23', change: 'Next 7 days', changeType: 'negative' as const, icon: Clock },
  { title: 'New Leads', value: '47', change: '+15% conversion rate', changeType: 'positive' as const, icon: UserPlus },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's your gym overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={stat.title} style={{ animationDelay: `${i * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6 min-h-[300px]">
          <h3 className="font-display font-semibold mb-4">Revenue Overview</h3>
          <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
            Chart coming soon
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 min-h-[300px]">
          <h3 className="font-display font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {['Rahul joined Premium Plan', 'Priya renewed membership', 'New lead: Amit Kumar', 'Payment received: ₹2,500'].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
