/**
 * Friendly "no permission" empty-state card.
 * Used to guard /app/* pages when the active demo user lacks `module:view`.
 */
import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NoAccessCardProps {
  title?: string;
  message?: string;
}

export function NoAccessCard({
  title = 'No access',
  message = "You don't have permission to view this section",
}: NoAccessCardProps) {
  return (
    <div className="flex items-center justify-center min-h-[40vh] p-4">
      <Card className="max-w-md w-full border-dashed">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook helper: returns true if demo is active AND user lacks view permission.
 * Use at the top of a page to short-circuit render with `<NoAccessCard />`.
 */
import { useDemoMode } from './DemoModeContext';
import type { Module } from './permissions';

export function useCanView(module: Module): boolean {
  const { isDemo, can } = useDemoMode();
  // In non-demo mode there's no RBAC overlay — always allow.
  if (!isDemo) return true;
  return can(module, 'view');
}
