/**
 * Renders a small "View only" pill when the active demo user lacks edit
 * permission on the given module. Renders nothing outside demo mode.
 */
import { Eye, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDemoMode } from './DemoModeContext';
import type { Module } from './permissions';

interface ViewOnlyPillProps {
  module: Module;
  className?: string;
}

export function ViewOnlyPill({ module, className }: ViewOnlyPillProps) {
  const { isDemo, can, vendorLocked } = useDemoMode();
  if (!isDemo) return null;
  if (can(module, 'edit')) return null;

  const Icon = vendorLocked ? Lock : Eye;
  const label = vendorLocked ? 'Vendor locked' : 'View only';

  return (
    <Badge
      variant="outline"
      className={
        'gap-1 border-amber-500/60 text-amber-500 bg-amber-500/10 ' + (className ?? '')
      }
    >
      <Icon className="h-3 w-3" />
      <span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
    </Badge>
  );
}
