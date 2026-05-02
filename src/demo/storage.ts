/**
 * Structured localStorage layer for demo mode.
 * One key per entity — modules read ONLY from these keys via dataService (in demo mode).
 *
 * All operations are SSR-safe and JSON-resilient.
 */
import type {
  SeedDataset,
  DemoUser,
  Vendor,
  DemoPlan,
  DemoMember,
  DemoPayment,
  DemoLead,
  DemoExpense,
  PermissionGrant,
  VendorLockState,
} from './types';
import type { Trainer, TrainerAssignment, TrainerSession } from '@/data/seedDemoData';

export const DEMO_KEYS = {
  users:        'gymos_users',
  vendors:      'gymos_vendors',
  members:      'gymos_members',
  payments:     'gymos_payments',
  leads:        'gymos_leads',
  expenses:     'gymos_expenses',
  plans:        'gymos_plans',
  permissions:  'gymos_permissions',
  vendorLocks:  'gymos_vendor_locks',
  currentUser:  'gymos_current_user_id',
  isDemoLoaded: 'gymos_is_demo_loaded',
  trainers:           'gymos_trainers',
  trainerAssignments: 'gymos_trainer_assignments',
  trainerSessions:    'gymos_trainer_sessions',
} as const;

const isBrowser = typeof window !== 'undefined';

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[demo-storage] failed to write ${key}`, err);
  }
}

function remove(key: string): void {
  if (!isBrowser) return;
  try { window.localStorage.removeItem(key); } catch {}
}

// ─── Typed accessors ────────────────────────────────────────────
export const demoStore = {
  // Reads
  getUsers:       (): DemoUser[]         => read(DEMO_KEYS.users, []),
  getVendors:     (): Vendor[]           => read(DEMO_KEYS.vendors, []),
  getMembers:     (): DemoMember[]       => read(DEMO_KEYS.members, []),
  getPayments:    (): DemoPayment[]      => read(DEMO_KEYS.payments, []),
  getLeads:       (): DemoLead[]         => read(DEMO_KEYS.leads, []),
  getExpenses:    (): DemoExpense[]      => read(DEMO_KEYS.expenses, []),
  getPlans:       (): DemoPlan[]         => read(DEMO_KEYS.plans, []),
  getPermissions: (): PermissionGrant[]  => read(DEMO_KEYS.permissions, []),
  getVendorLocks: (): VendorLockState    => read(DEMO_KEYS.vendorLocks, {}),
  getCurrentUserId: (): string | null    => read<string | null>(DEMO_KEYS.currentUser, null),
  isDemoLoaded:   (): boolean            => read(DEMO_KEYS.isDemoLoaded, false),

  // Writes
  setUsers:        (v: DemoUser[])        => write(DEMO_KEYS.users, v),
  setVendors:      (v: Vendor[])          => write(DEMO_KEYS.vendors, v),
  setMembers:      (v: DemoMember[])      => write(DEMO_KEYS.members, v),
  setPayments:     (v: DemoPayment[])     => write(DEMO_KEYS.payments, v),
  setLeads:        (v: DemoLead[])        => write(DEMO_KEYS.leads, v),
  setExpenses:     (v: DemoExpense[])     => write(DEMO_KEYS.expenses, v),
  setPlans:        (v: DemoPlan[])        => write(DEMO_KEYS.plans, v),
  setPermissions:  (v: PermissionGrant[]) => write(DEMO_KEYS.permissions, v),
  setVendorLocks:  (v: VendorLockState)   => write(DEMO_KEYS.vendorLocks, v),
  setCurrentUserId:(id: string | null)    => write(DEMO_KEYS.currentUser, id),
  setDemoLoaded:   (v: boolean)           => write(DEMO_KEYS.isDemoLoaded, v),

  /** Replace the entire dataset atomically (idempotent). */
  hydrateAll(d: SeedDataset, opts?: { defaultUserId?: string }): void {
    write(DEMO_KEYS.users,       d.users);
    write(DEMO_KEYS.vendors,     d.vendors);
    write(DEMO_KEYS.plans,       d.plans);
    write(DEMO_KEYS.members,     d.members);
    write(DEMO_KEYS.payments,    d.payments);
    write(DEMO_KEYS.leads,       d.leads);
    write(DEMO_KEYS.expenses,    d.expenses);
    write(DEMO_KEYS.permissions, d.permissions);
    write(DEMO_KEYS.vendorLocks, {} as VendorLockState);
    write(DEMO_KEYS.isDemoLoaded, true);
    if (opts?.defaultUserId) write(DEMO_KEYS.currentUser, opts.defaultUserId);
  },

  /** Clear ONLY demo-related keys (leaves other app keys intact). */
  clearAll(): void {
    Object.values(DEMO_KEYS).forEach(remove);
  },
};

/** Notify subscribers (across components/tabs) that demo data changed. */
export const DEMO_CHANGE_EVENT = 'gymos:demo-changed';
export function emitDemoChange() {
  if (!isBrowser) return;
  try { window.dispatchEvent(new CustomEvent(DEMO_CHANGE_EVENT)); } catch {}
}
