import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import * as ds from '@/services/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function SuperOwnersAdminPage() {
  const { role } = useSession();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [openFor, setOpenFor] = useState<string | null>(null);

  const { data: superOwners = [] } = useQuery({ queryKey: ['super-owners'], queryFn: ds.getSuperOwners });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: ds.getVendors });
  const { data: access = [] } = useQuery({ queryKey: ['super-owner-access'], queryFn: ds.getSuperOwnerAccess });

  if (role !== 'super_admin') {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">This page is for Platform Admins only.</p>
      </div>
    );
  }

  const gymsFor = (soId: string) => access.filter(a => a.super_owner_id === soId).map(a => vendors.find(v => v.id === a.vendor_id)).filter(Boolean) as typeof vendors;
  const openSo = superOwners.find(s => s.id === openFor);
  const openAssigned = openFor ? gymsFor(openFor) : [];
  const openAvailable = openFor ? vendors.filter(v => !openAssigned.find(a => a.id === v.id)) : [];

  const refresh = () => qc.invalidateQueries({ queryKey: ['super-owner-access'] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Super Owners</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage which gyms each Super Owner can access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {superOwners.map(so => {
          const assigned = gymsFor(so.id);
          return (
            <Card key={so.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{so.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{so.email}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{assigned.length} gym{assigned.length === 1 ? '' : 's'} assigned</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {assigned.map(g => <Badge key={g.id} variant="secondary">{g.name}</Badge>)}
                  {assigned.length === 0 && <span className="text-xs text-muted-foreground">No gyms yet</span>}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setOpenFor(so.id)}>
                  Manage Gyms
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!openFor} onOpenChange={(o) => !o && setOpenFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openSo?.name}</DialogTitle>
            <DialogDescription>Assign or revoke gym access for this Super Owner.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Assigned Gyms</h4>
              {openAssigned.length === 0 ? (
                <p className="text-xs text-muted-foreground">No gyms assigned.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Gym</TableHead><TableHead>Location</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {openAssigned.map(g => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{g.location}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="text-destructive"
                              onClick={async () => { await ds.removeGymFromSuperOwner(openFor!, g.id); refresh(); toast({ title: 'Gym revoked' }); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Available Gyms</h4>
              {openAvailable.length === 0 ? (
                <p className="text-xs text-muted-foreground">All gyms already assigned.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Gym</TableHead><TableHead>Location</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {openAvailable.map(g => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{g.location}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline"
                              onClick={async () => { await ds.assignGymToSuperOwner(openFor!, g.id); refresh(); toast({ title: 'Gym assigned' }); }}>
                              <Plus className="h-4 w-4 mr-1" /> Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}