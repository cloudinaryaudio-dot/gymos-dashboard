/**
 * RBAC helpers for demo mode.
 *
 *   super_admin → all access, no vendor scope
 *   owner       → all access within own vendor
 *   employee    → permission-list driven, scoped to vendor
 */
import { demoStore, emitDemoChange } from './storage';
import type { DemoUser, Permission, PermissionGrant } from './types';

export type Module = 'dashboard' | 'members' | 'payments' | 'leads' | 'expenses' | 'plans' | 'website' | 'recycle' | 'reports' | 'settings';
export type Action = 'view' | 'edit';

export const ALL_MODULES: Module[] = [
  'dashboard', 'members', 'payments', 'leads', 'expenses', 'plans', 'website', 'recycle', 'reports', 'settings',
];

const OWNER_FULL: Permission[] = [
  'dashboard:view', 'dashboard:edit',
  'members:view', 'members:edit',
  'payments:view', 'payments:edit',
  'leads:view', 'leads:edit',
  'expenses:view', 'expenses:edit',
  'plans:view', 'plans:edit',
  'website:view', 'website:edit',
  'recycle:view', 'recycle:edit',
  'reports:view', 'settings:view', 'settings:edit',
];

/** Default permissions for newly added employees: read-only on basics. */
export const DEFAULT_EMPLOYEE_PERMS: Permission[] = [
  'dashboard:view',
  'members:view',
  'payments:view',
  'leads:view',
];

export function getCurrentUser(): DemoUser | null {
  const id = demoStore.getCurrentUserId();
  if (!id) return null;
  return demoStore.getUsers().find(u => u.id === id) ?? null;
}

export function getUserPermissions(user: DemoUser): Permission[] {
  if (user.role === 'super_admin') return [...OWNER_FULL]; // full access
  if (user.role === 'owner') return [...OWNER_FULL];
  const grant: PermissionGrant | undefined = demoStore.getPermissions()
    .find(p => p.user_id === user.id);
  return grant?.permissions ?? [];
}

export function checkPermission(user: DemoUser | null, module: Module, action: Action): boolean {
  if (!user) return false;
  // super_admin always has access (lock does not affect platform admin).
  if (user.role === 'super_admin') return true;

  // Vendor lock — block ALL edit/create/delete actions, allow view only.
  if (action === 'edit' && user.vendor_id && isVendorLocked(user.vendor_id)) {
    return false;
  }

  const key = `${module}:${action}` as Permission;
  // Treat 'edit' permission as also granting 'view'.
  if (action === 'view') {
    const editKey = `${module}:edit` as Permission;
    const perms = getUserPermissions(user);
    return perms.includes(key) || perms.includes(editKey);
  }
  return getUserPermissions(user).includes(key);
}

/** Vendor scope for the current user. null = super_admin (sees everything). */
export function getVendorScope(user: DemoUser | null): string | null {
  if (!user) return null;
  if (user.role === 'super_admin') return null;
  return user.vendor_id;
}

export function isVendorLocked(vendorId: string | null): boolean {
  if (!vendorId) return false;
  const locks = demoStore.getVendorLocks();
  return Boolean(locks[vendorId]);
}

/** Get permissions for a single employee user. Returns [] if none granted. */
export function getEmployeePermissions(userId: string): Permission[] {
  const grant = demoStore.getPermissions().find(p => p.user_id === userId);
  return grant?.permissions ?? [];
}

/**
 * Toggle a single permission for an employee user. Owner/super_admin are no-ops.
 * Persists to localStorage and emits a change event for reactive UI.
 */
export function setEmployeePermission(userId: string, perm: Permission, enabled: boolean): void {
  const users = demoStore.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'employee') return;

  const all = demoStore.getPermissions();
  let grant = all.find(p => p.user_id === userId);
  if (!grant) {
    grant = { user_id: userId, vendor_id: user.vendor_id ?? '', permissions: [] };
    all.push(grant);
  }
  const has = grant.permissions.includes(perm);
  if (enabled && !has) grant.permissions = [...grant.permissions, perm];
  if (!enabled && has) grant.permissions = grant.permissions.filter(p => p !== perm);

  demoStore.setPermissions(all);
  emitDemoChange();
}

/** True only for owner / super_admin. */
export function isOwnerLike(user: DemoUser | null): boolean {
  return !!user && (user.role === 'owner' || user.role === 'super_admin');
}
