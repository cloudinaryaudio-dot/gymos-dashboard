import { useQuery } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => ds.getRevenueChart() as Promise<MonthlyRevenue[]>,
  });
}
