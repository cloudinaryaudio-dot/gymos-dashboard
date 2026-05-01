/**
 * Demo Mode Context — toggleable overlay on top of real Supabase auth.
 *
 *  • When demo is active: `currentUser` is the simulated user; UI uses RBAC + vendor filtering.
 *  • When inactive: real Supabase auth flow remains untouched.
 *
 * The provider is mounted at the App root so every route — public AND /app/* —
 * can read/switch the demo identity without prop drilling.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { demoStore, DEMO_CHANGE_EVENT, emitDemoChange } from './storage';
import { loadDemoDataset, unloadDemoDataset, isDemoActive } from './seedAdapter';
import { checkPermission, getVendorScope, isVendorLocked, type Module, type Action } from './permissions';
import type { DemoUser, Vendor } from './types';

interface DemoModeContextValue {
  /** Is demo mode currently the source of truth? */
  isDemo: boolean;
  /** The simulated current user (or null). */
  currentUser: DemoUser | null;
  /** Vendor scope — null for super_admin (sees all). */
  vendorId: string | null;
  /** Vendor record matching `vendorId`. */
  vendor: Vendor | null;
  /** Is the current user's vendor locked by super_admin? */
  vendorLocked: boolean;
  /** All users (for the role switcher dropdown). */
  users: DemoUser[];
  /** All vendors (for super_admin views). */
  vendors: Vendor[];
  /** Switch active user (re-renders consumers). */
  setCurrentUser: (userId: string) => void;
  /** Click "Load Demo Data" — idempotent. */
  loadDemo: () => void;
  /** Exit demo mode and clear localStorage. */
  exitDemo: () => void;
  /** Lock/unlock a vendor (super_admin only). */
  setVendorLocked: (vendorId: string, locked: boolean) => void;
  /** RBAC check helper bound to current user. */
  can: (module: Module, action: Action) => boolean;
  /** Increment a tick when demo data changes (for downstream cache busting). */
  changeTick: number;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within <DemoModeProvider>');
  return ctx;
}

/** Optional hook — never throws. Useful from components that may render outside the provider. */
export function useDemoModeOptional(): DemoModeContextValue | null {
  return useContext(DemoModeContext);
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  // Hydrate from localStorage on mount.
  const [isDemo, setIsDemo] = useState<boolean>(() => isDemoActive());
  const [currentUser, setCurrentUserState] = useState<DemoUser | null>(() => {
    const id = demoStore.getCurrentUserId();
    if (!id) return null;
    return demoStore.getUsers().find(u => u.id === id) ?? null;
  });
  const [users, setUsers] = useState<DemoUser[]>(() => demoStore.getUsers());
  const [vendors, setVendors] = useState<Vendor[]>(() => demoStore.getVendors());
  const [changeTick, setChangeTick] = useState(0);

  // Re-pull from localStorage whenever demo data changes (same tab via custom event,
  // or other tabs via the native `storage` event).
  const refresh = useCallback(() => {
    const active = isDemoActive();
    setIsDemo(active);
    setUsers(demoStore.getUsers());
    setVendors(demoStore.getVendors());
    const id = demoStore.getCurrentUserId();
    setCurrentUserState(id ? demoStore.getUsers().find(u => u.id === id) ?? null : null);
    setChangeTick(t => t + 1);
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(DEMO_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(DEMO_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  const setCurrentUser = useCallback((userId: string) => {
    demoStore.setCurrentUserId(userId);
    emitDemoChange();
  }, []);

  const loadDemo = useCallback(() => {
    loadDemoDataset();
    // emitDemoChange() already called inside loadDemoDataset
  }, []);

  const exitDemo = useCallback(() => {
    unloadDemoDataset();
  }, []);

  const setVendorLocked = useCallback((vendorId: string, locked: boolean) => {
    const next = { ...demoStore.getVendorLocks(), [vendorId]: locked };
    demoStore.setVendorLocks(next);
    emitDemoChange();
  }, []);

  const vendorId = useMemo(() => getVendorScope(currentUser), [currentUser]);
  const vendor = useMemo(
    () => (vendorId ? vendors.find(v => v.id === vendorId) ?? null : null),
    [vendorId, vendors],
  );
  const vendorLocked = useMemo(() => isVendorLocked(vendorId), [vendorId, changeTick]);

  const can = useCallback(
    (module: Module, action: Action) => checkPermission(currentUser, module, action),
    [currentUser],
  );

  const value = useMemo<DemoModeContextValue>(() => ({
    isDemo,
    currentUser,
    vendorId,
    vendor,
    vendorLocked,
    users,
    vendors,
    setCurrentUser,
    loadDemo,
    exitDemo,
    setVendorLocked,
    can,
    changeTick,
  }), [isDemo, currentUser, vendorId, vendor, vendorLocked, users, vendors,
       setCurrentUser, loadDemo, exitDemo, setVendorLocked, can, changeTick]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
