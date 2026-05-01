/**
 * Idempotent demo-data loader.
 *
 *   1. Build the multi-vendor dataset from seedDemoData()
 *   2. Replace the 7 entity keys + meta keys atomically
 *   3. Default the current user to the first owner (owner_1)
 *   4. Mark `is_demo_loaded = true`
 *
 * Calling this multiple times is safe — it always replaces, never appends.
 */
import { seedDemoData, summarizeDataset } from '@/data/seedDemoData';
import { demoStore, emitDemoChange } from './storage';

export interface LoadResult {
  ok: true;
  defaultUserId: string;
  summary: ReturnType<typeof summarizeDataset>;
}

export function loadDemoDataset(): LoadResult {
  const dataset = seedDemoData();
  const firstOwner = dataset.users.find(u => u.role === 'owner');
  const defaultUserId = firstOwner?.id ?? dataset.users[0]?.id ?? 'super_admin_1';

  demoStore.hydrateAll(dataset, { defaultUserId });
  emitDemoChange();

  return {
    ok: true,
    defaultUserId,
    summary: summarizeDataset(dataset),
  };
}

/** Reset / exit demo mode (clears all demo keys). */
export function unloadDemoDataset(): void {
  demoStore.clearAll();
  emitDemoChange();
}

/** True if demo data is currently loaded in localStorage. */
export function isDemoActive(): boolean {
  return demoStore.isDemoLoaded() && demoStore.getCurrentUserId() != null;
}
