/**
 * Demo-only Role Switcher dropdown.
 * Lets the user impersonate any seeded user (super_admin / owner / employee).
 * Renders nothing when demo mode is inactive.
 */
import { useMemo } from 'react';
import { ChevronDown, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDemoMode } from './DemoModeContext';
import type { DemoUser, Vendor } from './types';

export function RoleSwitcher() {
  const { isDemo, currentUser, users, vendors, setCurrentUser } = useDemoMode();

  const grouped = useMemo(() => {
    const superAdmins = users.filter(u => u.role === 'super_admin');
    const byVendor = new Map<string, DemoUser[]>();
    for (const u of users) {
      if (u.role === 'super_admin' || !u.vendor_id) continue;
      const arr = byVendor.get(u.vendor_id) ?? [];
      arr.push(u);
      byVendor.set(u.vendor_id, arr);
    }
    // owner first within each vendor
    for (const arr of byVendor.values()) {
      arr.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0));
    }
    return { superAdmins, byVendor };
  }, [users]);

  if (!isDemo) return null;

  const vendorById = new Map<string, Vendor>(vendors.map(v => [v.id, v]));

  const label = currentUser
    ? `${currentUser.name.split(' ')[0]} · ${currentUser.role}`
    : 'Switch user';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <UserCog className="h-4 w-4" />
          <span className="hidden sm:inline text-xs max-w-[140px] truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-y-auto">
        {grouped.superAdmins.length > 0 && (
          <>
            <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
            {grouped.superAdmins.map(u => (
              <UserRow
                key={u.id}
                user={u}
                vendor={null}
                active={currentUser?.id === u.id}
                onSelect={() => setCurrentUser(u.id)}
              />
            ))}
          </>
        )}
        {vendors.map(vendor => {
          const vUsers = grouped.byVendor.get(vendor.id) ?? [];
          if (vUsers.length === 0) return null;
          return (
            <div key={vendor.id}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center justify-between gap-2">
                <span className="truncate">{vendor.name}</span>
                <span className="text-[10px] font-normal text-muted-foreground">{vendor.city}</span>
              </DropdownMenuLabel>
              {vUsers.map(u => (
                <UserRow
                  key={u.id}
                  user={u}
                  vendor={vendor}
                  active={currentUser?.id === u.id}
                  onSelect={() => setCurrentUser(u.id)}
                />
              ))}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserRow({
  user,
  vendor,
  active,
  onSelect,
}: {
  user: DemoUser;
  vendor: Vendor | null;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(e) => { e.preventDefault(); onSelect(); }}
      className={active ? 'bg-accent/60' : ''}
    >
      <div className="flex flex-col gap-0.5 w-full min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{user.name}</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
            {user.role.replace('_', ' ')}
          </Badge>
        </div>
        {vendor && (
          <span className="text-[11px] text-muted-foreground truncate">{vendor.city}</span>
        )}
      </div>
    </DropdownMenuItem>
  );
}
