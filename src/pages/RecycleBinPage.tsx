import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, Users, CreditCard, UserPlus, Receipt, Inbox } from 'lucide-react';
import * as ds from '@/services/dataService';
import type { DeletedItem, RecycleEntityType } from '@/services/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDemoMode } from '@/demo/DemoModeContext';
import { NoAccessCard } from '@/demo/NoAccessCard';

const TYPE_META: Record<RecycleEntityType, { label: string; icon: typeof Users; color: string }> = {
  member: { label: 'Members', icon: Users, color: 'text-blue-500' },
  payment: { label: 'Payments', icon: CreditCard, color: 'text-emerald-500' },
  lead: { label: 'Leads', icon: UserPlus, color: 'text-orange-500' },
  expense: { label: 'Expenses', icon: Receipt, color: 'text-rose-500' },
};

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTimeRemaining(expiresIso: string) {
  const diff = new Date(expiresIso).getTime() - Date.now();
  if (diff <= 0) return 'expiring';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export default function RecycleBinPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { isDemo, can } = useDemoMode();
  const [confirmDelete, setConfirmDelete] = useState<DeletedItem | null>(null);

  // Run cleanup on mount
  useEffect(() => {
    const removed = ds.runRecycleCleanup();
    if (removed > 0) {
      qc.invalidateQueries();
    }
  }, [qc]);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['recycle-bin'],
    queryFn: () => ds.getDeletedData(),
    refetchInterval: 60_000, // refresh every minute for time-remaining display
  });

  const grouped = useMemo(() => {
    const g: Record<RecycleEntityType, DeletedItem[]> = { member: [], payment: [], lead: [], expense: [] };
    items.forEach(it => g[it.type].push(it));
    return g;
  }, [items]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['recycle-bin'] });
    qc.invalidateQueries({ queryKey: ['members'] });
    qc.invalidateQueries({ queryKey: ['payments'] });
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['analytics'] });
  };

  const handleRestore = async (item: DeletedItem) => {
    try {
      await ds.restoreItem(item.type, item.id);
      toast({ title: 'Restored', description: `${item.label} restored to ${TYPE_META[item.type].label}.` });
      invalidateAll();
      refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;
    try {
      await ds.permanentDelete(confirmDelete.type, confirmDelete.id);
      toast({ title: 'Permanently deleted', description: confirmDelete.label });
      setConfirmDelete(null);
      invalidateAll();
      refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  if (isDemo && !can('recycle', 'view')) return <NoAccessCard />;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Recycle Bin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deleted items are kept here for 24 hours, then permanently removed.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {items.length} item{items.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg">Recycle bin is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Deleted members, payments, leads and expenses will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        (Object.keys(grouped) as RecycleEntityType[]).map(type => {
          const list = grouped[type];
          if (list.length === 0) return null;
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                  {meta.label}
                  <Badge variant="outline" className="ml-2">{list.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.map(item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors flex-wrap"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{item.label}</div>
                      {item.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                        <span>Deleted {formatTimeAgo(item.deleted_at)}</span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400">{formatTimeRemaining(item.expires_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleRestore(item)}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Restore
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(item)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{confirmDelete?.label}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
