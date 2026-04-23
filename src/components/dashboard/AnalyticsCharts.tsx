import { lazy, Suspense } from 'react';
import type { AnalyticsResult } from '@/services/dataService';

const ChartsInner = lazy(() => import('./AnalyticsChartsInner'));

export type ChartVariant = 'today' | 'weekly' | 'monthly' | 'yearly';

export function AnalyticsCharts(props: { data: AnalyticsResult; variant: ChartVariant }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border bg-card p-6 h-[280px] flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ChartsInner {...props} />
    </Suspense>
  );
}
