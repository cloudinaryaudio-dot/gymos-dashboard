/**
 * Owner Control Panel — manage per-employee module visibility & edit access.
 *
 * Route: /app/employee-access
 * Access: owner & super_admin only. Employees see <NoAccessCard />.
 *
 * Storage: persists via demoStore.setPermissions() — UI updates instantly through
 * the existing DEMO_CHANGE_EVENT listener in DemoModeContext.
 */
import { useMemo, useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDemoMode } from '@/demo/DemoModeContext';
import { NoAccessCard } from '@/demo/NoAccessCard';
import {
  ALL_MODULES,
  getEmployeePermissions,
  setEmployeePermission,
  isOwnerLike,
  type Module,
} from '@/demo/permissions';
import type { Permission } from '@/demo/types';

const MODULE_LABELS: Record<Module, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  payments: 'Payments',
  leads: 'Leads',
  expenses: 'Expenses',
  plans: 'Plans',
  website: 'Website',
  settings: 'Settings',
  recycle: 'Recycle Bin',
  reports: 'Reports',
};

const VISIBLE_MODULES: Module[] = [
  'dashboard', 'members', 'payments', 'leads', 'expenses', 'plans', 'website', 'settings', 'recycle',
];

export default function EmployeeAccessPage() {
  const { isDemo, currentUser, users, vendorId, changeTick } = useDemoMode();

  // Gate: only owner/super_admin can access. Real (non-demo) auth is unaffected.
  if (isDemo && !isOwnerLike(currentUser)) {
    return <NoAccessCard title="Owner only" message="Only the gym owner can manage employee permissions." />;
  }

  // Outside demo there are no employees to manage — show a friendly explainer.
  if (!isDemo) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Employee Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>This panel manages per-employee module visibility and edit rights.</p>
            <p>Enable Demo Mode (or invite an employee) to start configuring access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Employees in this owner's vendor scope.
  const employees = useMemo(
    () => users.filter(u => u.role === 'employee' && (vendorId == null || u.vendor_id === vendorId)),
    [users, vendorId],
  );

  const [selectedId, setSelectedId] = useState<string>(() => employees[0]?.id ?? '');

  // Recompute current employee perms whenever data changes.
  const employee = employees.find(u => u.id === selectedId) ?? employees[0];
  const perms = useMemo(
    () => (employee ? getEmployeePermissions(employee.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employee?.id, changeTick],
  );

  const has = (m: Module, a: 'view' | 'edit') => perms.includes(`${m}:${a}` as Permission);

  const toggle = (m: Module, a: 'view' | 'edit', enabled: boolean) => {
    if (!employee) return;
    setEmployeePermission(employee.id, `${m}:${a}` as Permission, enabled);
    // If turning off view, also strip edit (edit implies view).
    if (a === 'view' && !enabled && has(m, 'edit')) {
      setEmployeePermission(employee.id, `${m}:edit` as Permission, false);
    }
    // If turning on edit, ensure view is on.
    if (a === 'edit' && enabled && !has(m, 'view')) {
      setEmployeePermission(employee.id, `${m}:view` as Permission, true);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Employee Access Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which sections each employee can view or edit. Changes apply instantly.
          </p>
        </div>
        <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Owner only</Badge>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No employees found in your gym yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Select employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={employee?.id ?? ''} onValueChange={setSelectedId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Pick an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} <span className="text-xs text-muted-foreground ml-2">{e.email}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permissions for {employee?.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                    <div className="col-span-6">Section</div>
                    <div className="col-span-3 text-center">Visible</div>
                    <div className="col-span-3 text-center">Can edit</div>
                  </div>
                  {VISIBLE_MODULES.map(m => {
                    const view = has(m, 'view');
                    const edit = has(m, 'edit');
                    return (
                      <div key={m} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/30">
                        <div className="col-span-6 font-medium">{MODULE_LABELS[m]}</div>
                        <div className="col-span-3 flex justify-center">
                          <Switch checked={view} onCheckedChange={(v) => toggle(m, 'view', v)} />
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <Switch
                            checked={edit}
                            disabled={!view}
                            onCheckedChange={(v) => toggle(m, 'edit', v)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <p className="text-xs text-muted-foreground">
            Tip: turning off Visible automatically revokes edit access. Owner accounts are never restricted.
          </p>
        </>
      )}
    </div>
  );
}
