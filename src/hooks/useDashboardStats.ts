import { useQuery } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export interface DashboardStats {
  monthlyRevenue: number;
  totalExpenses: number;
  profit: number;
  activeMembers: number;
  expiringMemberships: number;
  expiredMemberships: number;
  pendingPayments: number;
  overdueCount: number;
  totalPendingAmount: number;
  newLeads: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  recentPayments: { member_name: string; amount: number; date: string }[];
  todayNewMembers: number;
  todayPayments: number;
  todayPaymentsAmount: number;
  todayLeads: number;
  monthNewMembers: number;
  revenueAtRisk: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => ds.getDashboardStats() as Promise<DashboardStats>,
  });
}
