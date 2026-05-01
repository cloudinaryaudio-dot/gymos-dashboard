/**
 * RBAC helpers for demo mode.
 *
 *   super_admin → all access, no vendor scope
 *   owner       → all access within own vendor
 *   employee    → permission-list driven, scoped to vendor
 */
import { demoStore } from './storage';
import type { DemoUser, Permission, PermissionGrant } from './types';

export type Module = 'members' | 'payments' | 'leads' | 'expenses' | 'reports' | 'settings';
export type Action = 'view' | 'edit';

const OWNER_FULL: Permission[] = [
  'members:view', 'members:edit',
  'payments:view', 'payments:edit',
  'leads:view', 'leads:edit',
  'expenses:view', 'expenses:edit',
  'reports:view', 'settings:edit',
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
  if (user.role === 'super_admin') return true;
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
