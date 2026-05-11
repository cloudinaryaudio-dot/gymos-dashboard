import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from '@/services/dataService';

export type Trainer = ds.Trainer;
export type TrainerAssignment = ds.TrainerAssignment;
export type TrainerSession = ds.TrainerSession;

export function useTrainers() {
  return useQuery({ queryKey: ['trainers'], queryFn: () => ds.getTrainers() });
}
export function useTrainerAssignments() {
  return useQuery({ queryKey: ['trainer_assignments'], queryFn: () => ds.getTrainerAssignments() });
}
export function useTrainerSessions() {
  return useQuery({ queryKey: ['trainer_sessions'], queryFn: () => ds.getTrainerSessions() });
}

export function useCreateTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ds.createTrainer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainers'] }),
  });
}
export function useUpdateTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Parameters<typeof ds.updateTrainer>[1] & { id: string }) =>
      ds.updateTrainer(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainers'] }),
  });
}
export function useDeleteTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ds.deleteTrainer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainers'] }),
  });
}
export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ds.createTrainerAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainer_assignments'] });
      qc.invalidateQueries({ queryKey: ['trainers'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ds.deleteTrainerAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainer_assignments'] });
      qc.invalidateQueries({ queryKey: ['trainer_sessions'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useMarkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ds.markTrainerSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainer_sessions'] });
      qc.invalidateQueries({ queryKey: ['trainer_assignments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
