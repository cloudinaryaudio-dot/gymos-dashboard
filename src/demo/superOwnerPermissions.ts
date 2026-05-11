/**
 * Super Owner per-gym permission layer.
 *
 * Sits ON TOP of the existing RBAC system without replacing it.
 *
 *   • Each super_owner can be granted/revoked access to specific gyms (existing)
 *   • For each (super_owner, vendor) pair a row of fine-grained module toggles
 *     decides which modules are visible inside that gym's "Owner View"
 *   • `allow_full_owner_view` upgrades the super-owner from read-only to
 *     full owner-equivalent edit access for that gym.
 *
 * Persisted to localStorage via demoStore (gymos_super_owner_permissions).
 */
import { demoStore, emitDemoChange, DEMO_KEYS } from './storage';

export type SuperOwnerModule =
  | 'dashboard'
  | 'analytics'
  | 'members'
  | 'payments'
  | 'leads'
  | 'expenses'
  | 'trainers'
  | 'plans'
  | 'website'
  | 'settings';

export const SO_MODULES: SuperOwnerModule[] = [
  'dashboard', 'analytics', 'members', 'payments', 'leads',
  'expenses', 'trainers', 'plans', 'website', 'settings',
];

export interface SuperOwnerPermission {
  id: string;
  super_owner_id: string;
  vendor_id: string;
  modules: Record<SuperOwnerModule, boolean>;
  allow_full_owner_view: boolean;
}

export const FULL_MODULES: Record<SuperOwnerModule, boolean> = {
  dashboard: true, analytics: true, members: true, payments: true, leads: true,
  expenses: true, trainers: true, plans: true, website: true, settings: true,
};

export const ANALYTICS_ONLY: Record<SuperOwnerModule, boolean> = {
  dashboard: true, analytics: true, members: false, payments: false, leads: false,
  expenses: false, trainers: false, plans: false, website: false, settings: false,
};

export const MEMBERS_AND_PAYMENTS: Record<SuperOwnerModule, boolean> = {
  dashboard: true, analytics: true, members: true, payments: true, leads: false,
  expenses: false, trainers: false, plans: false, website: false, settings: false,
};

export const LIMITED: Record<SuperOwnerModule, boolean> = {
  dashboard: true, analytics: true, members: true, payments: false, leads: true,
  expenses: false, trainers: false, plans: false, website: false, settings: false,
};

const SO_PERMS_KEY = DEMO_KEYS.superOwnerPermissions;

function readAll(): SuperOwnerPermission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SO_PERMS_KEY);
    return raw ? (JSON.parse(raw) as SuperOwnerPermission[]) : [];
  } catch { return []; }
}
function writeAll(rows: SuperOwnerPermission[]): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(SO_PERMS_KEY, JSON.stringify(rows)); } catch {}
}
function genId() {
  return `soperm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getAllSuperOwnerPermissions(): SuperOwnerPermission[] {
  return readAll();
}

/** Default = full access for that gym. */
export function getSuperOwnerPermission(
  superOwnerId: string,
  vendorId: string,
): SuperOwnerPermission {
  const found = readAll().find(
    p => p.super_owner_id === superOwnerId && p.vendor_id === vendorId,
  );
  if (found) {
    // Backward-compat: ensure all modules present
    return {
      ...found,
      modules: { ...FULL_MODULES, ...found.modules },
    };
  }
  return {
    id: genId(),
    super_owner_id: superOwnerId,
    vendor_id: vendorId,
    modules: { ...FULL_MODULES },
    allow_full_owner_view: true,
  };
}

function upsert(
  superOwnerId: string,
  vendorId: string,
  patch: Partial<Omit<SuperOwnerPermission, 'id' | 'super_owner_id' | 'vendor_id'>>,
): void {
  const all = readAll();
  const idx = all.findIndex(
    p => p.super_owner_id === superOwnerId && p.vendor_id === vendorId,
  );
  const base = idx >= 0
    ? all[idx]
    : {
        id: genId(),
        super_owner_id: superOwnerId,
        vendor_id: vendorId,
        modules: { ...FULL_MODULES },
        allow_full_owner_view: true,
      };
  const next: SuperOwnerPermission = {
    ...base,
    ...patch,
    modules: { ...FULL_MODULES, ...base.modules, ...(patch.modules ?? {}) },
  };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeAll(all);
  emitDemoChange();
}

export function setSuperOwnerModule(
  superOwnerId: string,
  vendorId: string,
  module: SuperOwnerModule,
  enabled: boolean,
): void {
  const current = getSuperOwnerPermission(superOwnerId, vendorId);
  upsert(superOwnerId, vendorId, {
    modules: { ...current.modules, [module]: enabled },
  });
}

export function setSuperOwnerFullView(
  superOwnerId: string,
  vendorId: string,
  enabled: boolean,
): void {
  upsert(superOwnerId, vendorId, { allow_full_owner_view: enabled });
}

export function setSuperOwnerPermissionPreset(
  superOwnerId: string,
  vendorId: string,
  preset: Record<SuperOwnerModule, boolean>,
  fullView = false,
): void {
  upsert(superOwnerId, vendorId, {
    modules: { ...preset },
    allow_full_owner_view: fullView,
  });
}

export function deleteSuperOwnerPermission(superOwnerId: string, vendorId: string): void {
  const next = readAll().filter(
    p => !(p.super_owner_id === superOwnerId && p.vendor_id === vendorId),
  );
  writeAll(next);
  emitDemoChange();
}

/** Replace the whole permission table (used by seed loader). */
export function hydrateSuperOwnerPermissions(rows: SuperOwnerPermission[]): void {
  writeAll(rows);
}

/** Permission summary level → for badges. */
export type AccessLevel = 'full' | 'limited' | 'analytics' | 'none';
export function summarizeAccess(perm: SuperOwnerPermission): AccessLevel {
  const enabled = SO_MODULES.filter(m => perm.modules[m]).length;
  if (enabled === 0) return 'none';
  if (enabled === SO_MODULES.length && perm.allow_full_owner_view) return 'full';
  if (enabled <= 2) return 'analytics';
  return 'limited';
}

/**
 * Decide whether the active super-owner can access a module within their
 * currently-selected gym. Returns true for non-super-owners (other RBAC
 * paths handle them).
 */
export function canSuperOwnerAccess(
  superOwnerId: string | null | undefined,
  vendorId: string | null | undefined,
  module: SuperOwnerModule,
): boolean {
  if (!superOwnerId || !vendorId) return false;
  const perm = getSuperOwnerPermission(superOwnerId, vendorId);
  return Boolean(perm.modules[module]);
}

/** True if the super-owner has any modules enabled at all in this gym. */
export function hasAnyAccess(superOwnerId: string, vendorId: string): boolean {
  const perm = getSuperOwnerPermission(superOwnerId, vendorId);
  return SO_MODULES.some(m => perm.modules[m]);
}
