import { lazy, Suspense } from 'react';

export interface LeadsChartsData {
  trend: { label: string; leads: number; converted: number }[];
  statusDist: { name: string; value: number }[];
  funnel: { name: string; value: number }[];
  goalDist: { name: string; value: number }[];
}

const Inner = lazy(() => import('./LeadsDashboardChartsInner'));

export function LeadsDashboardCharts(props: { data: LeadsChartsData; granularity: 'day' | 'month' }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border bg-card p-6 h-[280px] flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
