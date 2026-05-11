import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, Plus, Trash2, Users, IndianRupee, ShieldCheck, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoMode } from '@/demo/DemoModeContext';
import {
  getAllSuperOwners,
  getSuperOwnerGyms,
  getSuperOwnerAnalytics,
  assignGymToSuperOwner,
  removeGymFromSuperOwner,
} from '@/demo/superOwnerService';
import {
  SO_MODULES, type SuperOwnerModule,
  getSuperOwnerPermission, setSuperOwnerModule, setSuperOwnerFullView,
  setSuperOwnerPermissionPreset, FULL_MODULES, ANALYTICS_ONLY, MEMBERS_AND_PAYMENTS, LIMITED,
} from '@/demo/superOwnerPermissions';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function SuperOwnersAdminPage() {
  const { isDemo, currentUser, vendors, changeTick } = useDemoMode();
  const [openFor, setOpenFor] = useState<string | null>(null);

  const owners = useMemo(() => getAllSuperOwners(), [changeTick]);

  if (!isDemo || !currentUser || currentUser.role !== 'super_admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Super Owners
        </h1>
        <p className="text-sm text-muted-foreground">Manage which gyms each super owner can access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {owners.map(o => {
          const gyms = getSuperOwnerGyms(o.id);
          const stats = getSuperOwnerAnalytics(o.id, null);
          return (
            <Card key={o.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="truncate">{o.name}</span>
                  <Badge variant="secondary" className="shrink-0">{gyms.length} gyms</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground truncate">{o.email}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" />{stats.totals.members} members</div>
                  <div className="flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />{fmtINR(stats.totals.revenue)}</div>
                </div>

                <div className="space-y-1.5">
                  {gyms.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No gyms assigned</p>
                  )}
                  {gyms.map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{g.name}</div>
                        <div className="text-[11px] text-muted-foreground">{g.city}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <ManageAccessButton superOwnerId={o.id} vendorId={g.id} vendorName={g.name} changeTick={changeTick} />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            removeGymFromSuperOwner(o.id, g.id);
                            toast.success(`Revoked ${g.name}`);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Dialog open={openFor === o.id} onOpenChange={(v) => setOpenFor(v ? o.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Assign Gym
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign gyms to {o.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {vendors.map(v => {
                        const assigned = gyms.some(g => g.id === v.id);
                        return (
                          <label
                            key={v.id}
                            className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 cursor-pointer hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={assigned}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  assignGymToSuperOwner(o.id, v.id);
                                  toast.success(`Assigned ${v.name}`);
                                } else {
                                  removeGymFromSuperOwner(o.id, v.id);
                                  toast.success(`Revoked ${v.name}`);
                                }
                              }}
                            />
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{v.name}</div>
                              <div className="text-xs text-muted-foreground">{v.city}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setOpenFor(null)}>Done</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const MODULE_LABELS: Record<SuperOwnerModule, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  members: 'Members',
  payments: 'Payments',
  leads: 'Leads',
  expenses: 'Expenses',
  trainers: 'Trainers',
  plans: 'Plans',
  website: 'Website',
  settings: 'Settings',
};

function ManageAccessButton({
  superOwnerId, vendorId, vendorName, changeTick,
}: { superOwnerId: string; vendorId: string; vendorName: string; changeTick: number }) {
  const [open, setOpen] = useState(false);
  const perm = useMemo(
    () => getSuperOwnerPermission(superOwnerId, vendorId),
    [superOwnerId, vendorId, changeTick, open],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Manage access">
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> {vendorName}
          </DialogTitle>
          <DialogDescription>
            Configure which modules this super owner can access in this gym.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="rounded-md border border-border/60 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Allow full owner view</div>
                <div className="text-xs text-muted-foreground">Grant edit/create/delete (otherwise read-only).</div>
              </div>
              <Switch
                checked={perm.allow_full_owner_view}
                onCheckedChange={(v) => {
                  setSuperOwnerFullView(superOwnerId, vendorId, Boolean(v));
                  toast.success(v ? 'Full owner view enabled' : 'Switched to read-only');
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setSuperOwnerPermissionPreset(superOwnerId, vendorId, FULL_MODULES, true); toast.success('Preset: Full access'); }}>
              Full
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setSuperOwnerPermissionPreset(superOwnerId, vendorId, LIMITED, false); toast.success('Preset: Limited'); }}>
              Limited
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setSuperOwnerPermissionPreset(superOwnerId, vendorId, MEMBERS_AND_PAYMENTS, false); toast.success('Preset: Members + Payments'); }}>
              Members+Pay
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setSuperOwnerPermissionPreset(superOwnerId, vendorId, ANALYTICS_ONLY, false); toast.success('Preset: Analytics only'); }}>
              Analytics
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {SO_MODULES.map(m => (
              <label key={m} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 cursor-pointer hover:bg-muted/40">
                <span className="text-sm">{MODULE_LABELS[m]}</span>
                <Switch
                  checked={Boolean(perm.modules[m])}
                  onCheckedChange={(v) => setSuperOwnerModule(superOwnerId, vendorId, m, Boolean(v))}
                />
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
