/**
 * Super-admin vendor selector for /app pages.
 * Renders nothing unless demo mode is on AND the active user is super_admin.
 *
 * Usage:
 *   const { vendorId, setVendorId, filter } = useDemoVendorFilter();
 *   <VendorFilter value={vendorId} onChange={setVendorId} />
 *   const visible = filter(rows);
 */
import { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDemoMode } from './DemoModeContext';

const ALL = '__all__';
const VENDOR_SCOPE_KEY = 'demo_vendor_scope';

export function useDemoVendorFilter() {
  const { isDemo, currentUser, vendors } = useDemoMode();
  // Persist super_admin's vendor selection across reloads.
  const [vendorId, setVendorIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return ALL;
    try { return window.localStorage.getItem(VENDOR_SCOPE_KEY) || ALL; } catch { return ALL; }
  });
  const setVendorId = useCallback((next: string) => {
    setVendorIdState(next);
    try { window.localStorage.setItem(VENDOR_SCOPE_KEY, next); } catch {}
  }, []);
  // Reset when leaving demo mode so a real-auth session never inherits a stale scope.
  useEffect(() => {
    if (!isDemo) {
      setVendorIdState(ALL);
      try { window.localStorage.removeItem(VENDOR_SCOPE_KEY); } catch {}
    }
  }, [isDemo]);

  const isSuperAdmin = isDemo && currentUser?.role === 'super_admin';

  const filter = useCallback(
    <T extends { vendor_id?: string | null }>(rows: T[] | undefined): T[] => {
      if (!rows) return [];
      if (!isSuperAdmin) return rows;
      if (vendorId === ALL) return rows;
      return rows.filter(r => r.vendor_id === vendorId);
    },
    [isSuperAdmin, vendorId],
  );

  return { isSuperAdmin, vendors, vendorId, setVendorId, filter };
}

interface VendorFilterProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

export function VendorFilter({ value, onChange, className }: VendorFilterProps) {
  const { isDemo, currentUser, vendors } = useDemoMode();
  if (!isDemo || currentUser?.role !== 'super_admin') return null;

  return (
    <div className={'inline-flex items-center gap-2 ' + (className ?? '')}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="All vendors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Vendors</SelectItem>
          {vendors.map(v => (
            <SelectItem key={v.id} value={v.id}>
              {v.name} <span className="text-muted-foreground">· {v.city}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const VENDOR_FILTER_ALL = ALL;
