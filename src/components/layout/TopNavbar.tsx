import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Home, Database, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
import * as ds from '@/services/dataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDemoModeOptional } from '@/demo/DemoModeContext';
import { loadDemoDataset } from '@/demo/seedAdapter';
import { RoleSwitcher } from '@/demo/RoleSwitcher';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  super_owner: 'Super Owner',
  owner: 'Owner',
  employee: 'Employee',
};

function initialsOf(name?: string | null): string {
  if (!name) return 'RS';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RS';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function TopNavbar() {
  const demo = useDemoModeOptional();
  const isDemo = demo?.isDemo ?? false;
  const currentUser = demo?.currentUser ?? null;
  const vendor = demo?.vendor ?? null;
  const [confirmExit, setConfirmExit] = useState(false);

  const session = (() => {
    try { return useSession(); } catch { return null; }
  })();
  const sessionUser = session?.user ?? null;
  const sessionRole = session?.role ?? null;
  const sessionVendorId = session?.vendorId ?? null;

  const { data: users = [] } = useQuery({
    queryKey: ['app-users'],
    queryFn: ds.getAppUsers,
    enabled: !isDemo && !!session,
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: ds.getVendors,
    enabled: !isDemo && !!session,
  });

  const handleLoadDemo = () => {
    const wasActive = isDemo;
    const res = loadDemoDataset();
    const { vendors: vCount, members, trainers, pt_assignments } = res.summary;
    if (wasActive) {
      toast.success(`Demo refreshed — Trainers: ${trainers}, PT Members: ${pt_assignments}`);
    } else {
      toast.success(
        `Demo loaded — ${vCount} vendors, ${members} members, ${trainers} trainers, ${pt_assignments} PT clients`,
      );
    }
  };

  const handleExitDemo = () => {
    demo?.exitDemo();
    setConfirmExit(false);
    toast.success('Exited demo mode');
  };

  const initials = isDemo
    ? initialsOf(currentUser?.name)
    : initialsOf(sessionUser?.name) || 'RS';

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-4 bg-card gap-2">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <SidebarTrigger />
        <Link to="/" aria-label="Back to Home">
          <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 gap-1.5 text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline text-xs sm:text-sm">Back to Home</span>
          </Button>
        </Link>
        <h2 className="text-sm font-medium text-muted-foreground hidden md:block truncate">
          Gym Management
        </h2>
        {isDemo && (
          <Badge
            variant="outline"
            className="ml-1 text-[10px] uppercase tracking-wide border-amber-500/60 text-amber-500 bg-amber-500/10"
          >
            Demo
          </Badge>
        )}
        {!isDemo && sessionRole && (
          <Badge variant="secondary" className="hidden md:inline-flex ml-1">
            {ROLE_LABEL[sessionRole] ?? sessionRole}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
        {!isDemo && session && users.length > 0 && (
          <Select
            value={sessionUser?.id ?? ''}
            onValueChange={(id) => session.switchUser(users.find(u => u.id === id) ?? null)}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Switch user" /></SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">({ROLE_LABEL[u.role]})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!isDemo && session && sessionRole === 'super_admin' && vendors.length > 0 && (
          <Select
            value={sessionVendorId ?? 'all'}
            onValueChange={(v) => session.switchVendor(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gyms</SelectItem>
              {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {isDemo ? (
          <>
            <RoleSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDemo}
              className="h-9 gap-1.5"
              title="Reset demo data to a clean state"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Reload</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmExit(true)}
              className="h-9 gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Exit Demo</span>
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            className="h-9 gap-1.5"
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Load Demo Data</span>
          </Button>
        )}

        <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>

        {isDemo && currentUser ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-default">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">
                <div className="text-xs">
                  <div className="font-semibold">{currentUser.name}</div>
                  <div className="capitalize text-muted-foreground">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                  {vendor && (
                    <div className="text-muted-foreground">{vendor.name} · {vendor.city}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit demo mode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all demo data from your browser. Your real account is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitDemo}>Exit Demo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
