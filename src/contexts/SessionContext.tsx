import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getCurrentUser, setCurrentUser, getCurrentVendorId, setCurrentVendorId,
  type AppUserRow, type AppRole,
} from '@/data/mockDb';

interface SessionContextValue {
  user: AppUserRow | null;
  role: AppRole | null;
  vendorId: string | null; // null = "All Gyms"
  switchUser: (u: AppUserRow | null) => void;
  switchVendor: (vendorId: string | null) => void;
}

const Ctx = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUserRow | null>(() => getCurrentUser());
  const [vendorId, setVendorIdState] = useState<string | null>(() => getCurrentVendorId());
  const qc = useQueryClient();

  useEffect(() => {
    // Re-hydrate from localStorage on mount (in case demo data just loaded)
    setUserState(getCurrentUser());
    setVendorIdState(getCurrentVendorId());
  }, []);

  const switchUser = useCallback((u: AppUserRow | null) => {
    setCurrentUser(u);
    setUserState(u);
    // Reset vendor selection — owner locks to its vendor; others default to all
    if (u?.role === 'owner' && u.vendor_id) {
      setCurrentVendorId(u.vendor_id);
      setVendorIdState(u.vendor_id);
    } else {
      setCurrentVendorId(null);
      setVendorIdState(null);
    }
    qc.resetQueries();
  }, [qc]);

  const switchVendor = useCallback((vid: string | null) => {
    setCurrentVendorId(vid);
    setVendorIdState(vid);
    qc.resetQueries();
  }, [qc]);

  return (
    <Ctx.Provider value={{ user, role: user?.role ?? null, vendorId, switchUser, switchVendor }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): SessionContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside SessionProvider');
  return v;
}