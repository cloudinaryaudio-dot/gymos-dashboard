import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export interface Member {
  id: string;
  name: string;
  phone: string;
  plan_id: string | null;
  start_date: string;
  expiry_date: string;
  status: string;
  user_id: string;
  created_at: string;
  plans?: { name: string; duration_days: number } | null;
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => ds.getMembers() as Promise<Member[]>,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (member: { name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) =>
      ds.createMember(member),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...member }: { id: string; name: string; phone: string; plan_id: string; start_date: string; expiry_date: string }) =>
      ds.updateMember(id, member),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ds.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}
