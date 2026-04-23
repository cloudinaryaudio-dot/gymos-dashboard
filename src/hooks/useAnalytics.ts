import { useQuery } from '@tanstack/react-query';
import * as ds from '@/services/dataService';
import type { AnalyticsResult } from '@/services/dataService';

export function useAnalytics(from: string, to: string, granularity: 'day' | 'month' = 'day') {
  return useQuery({
    queryKey: ['analytics', from, to, granularity],
    queryFn: () => ds.getAnalytics({ from, to }, granularity) as Promise<AnalyticsResult>,
  });
}
