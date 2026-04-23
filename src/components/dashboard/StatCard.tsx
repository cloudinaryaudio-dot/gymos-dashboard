import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

export function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  const changeColor = {
    positive: 'text-primary',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  }[changeType];

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center justify-between ">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold font-display">{value}</p>
            <p className={`text-xs font-medium ${changeColor}`}>{change}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
