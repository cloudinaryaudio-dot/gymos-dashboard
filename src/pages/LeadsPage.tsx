import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads, LeadStatus } from '@/hooks/useLeads';
import { useLeads, LeadStatus } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  converted: 'bg-primary/20 text-primary border-primary/30',
};

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const { leads, isLoading, addLead, updateLeadStatus, deleteLead } = useLeads();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState<string>('all');

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    addLead.mutate({ name: name.trim(), phone: phone.trim() }, {
      onSuccess: () => { setOpen(false); setName(''); setPhone(''); },
    });
  };

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">Track potential members</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
                <Button onClick={handleAdd} disabled={addLead.isPending} className="w-full">
                  {addLead.isPending ? 'Adding...' : 'Add Lead'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'converted'].map(s => (
            <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{lead.name}</td>
                    <td className="p-3 text-muted-foreground">{lead.phone}</td>
                    <td className="p-3">
                      <Select value={lead.status} onValueChange={(v) => updateLeadStatus.mutate({ id: lead.id, status: v as LeadStatus })}>
                        <SelectTrigger className="w-[130px] h-8">
                          <Badge variant="outline" className={statusColors[lead.status] || ''}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-muted-foreground">{format(new Date(lead.created_at), 'dd MMM yyyy')}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteLead.mutate(lead.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
