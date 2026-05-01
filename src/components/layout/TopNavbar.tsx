import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Home, Database, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
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

  const handleLoadDemo = () => {
    const res = loadDemoDataset();
    const { vendors, members } = res.summary;
    toast.success(`Demo data loaded — ${vendors} vendors, ${members} members`);
  };

  const handleExitDemo = () => {
    demo?.exitDemo();
    setConfirmExit(false);
    toast.success('Exited demo mode');
  };

  const initials = isDemo ? initialsOf(currentUser?.name) : 'RS';

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
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isDemo ? (
          <>
            <RoleSwitcher />
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
