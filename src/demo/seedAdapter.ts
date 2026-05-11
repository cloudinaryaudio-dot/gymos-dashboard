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

  // Seed default super-owner permission presets so demo showcases the
  // gym-level visibility controls.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sop = require('./superOwnerPermissions') as typeof import('./superOwnerPermissions');
  const presets: Array<{
    so: string; vendor: string;
    modules: Record<sop.SuperOwnerModule, boolean>;
    full: boolean;
  }> = [
    { so: 'super_owner_1', vendor: 'vendor_1', modules: sop.FULL_MODULES,         full: true  },
    { so: 'super_owner_1', vendor: 'vendor_2', modules: sop.ANALYTICS_ONLY,        full: false },
    { so: 'super_owner_1', vendor: 'vendor_3', modules: sop.MEMBERS_AND_PAYMENTS,  full: false },
    { so: 'super_owner_2', vendor: 'vendor_4', modules: sop.FULL_MODULES,         full: true  },
    { so: 'super_owner_2', vendor: 'vendor_5', modules: sop.LIMITED,              full: false },
  ];
  const rows = presets.map((p, i) => ({
    id: `soperm_seed_${i + 1}`,
    super_owner_id: p.so,
    vendor_id: p.vendor,
    modules: { ...p.modules },
    allow_full_owner_view: p.full,
  }));
  sop.hydrateSuperOwnerPermissions(rows);

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
