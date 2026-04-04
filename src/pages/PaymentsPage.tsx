import { useState } from 'react';
import { usePayments, useCreatePayment, useDeletePayment, useUpdatePaymentStatus } from '@/hooks/usePayments';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const methods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const { data: members } = useMembers();
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();
  const updateStatus = useUpdatePaymentStatus();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('cash');
  const [status, setStatus] = useState('paid');
  const [note, setNote] = useState('');

  

  const resetForm = () => {
    setMemberId(''); setAmount(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    setMethod('cash'); setStatus('paid'); setNote('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPayment.mutateAsync({
        member_id: memberId,
        amount: parseFloat(amount),
        payment_date: date,
        method,
        status,
        note: note || undefined,
      });
      toast({ title: 'Payment recorded!' });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const paidPayments = payments?.filter(p => p.status === 'paid') ?? [];
  const pendingPayments = payments?.filter(p => p.status === 'pending') ?? [];
  const overduePayments = payments?.filter(p => p.status === 'overdue') ?? [];

  const PaymentTable = ({ data, showMarkPaid }: { data: typeof payments; showMarkPaid?: boolean }) => (
    data && data.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.members?.name ?? '—'}</TableCell>
              <TableCell>₹{Number(p.amount).toLocaleString()}</TableCell>
              <TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
              <TableCell className="capitalize">{p.method.replace('_', ' ')}</TableCell>
              <TableCell>
                <Badge variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'}
                  className={cn(
                    p.status === 'paid' && 'bg-emerald-500/10 text-emerald-600 border border-emerald-300',
                    p.status === 'overdue' && '',
                    p.status === 'pending' && 'border-orange-400 text-orange-500 bg-orange-500/10'
                  )}>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {showMarkPaid && (p.status === 'pending' || p.status === 'overdue') && (
                  <Button variant="ghost" size="icon" title="Mark as Paid" onClick={() => updateStatus.mutateAsync({ id: p.id, status: 'paid' })}>
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => deletePayment.mutateAsync(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-lg mb-1">No payments found</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Record your first payment to start tracking revenue.
        </p>
        <Button onClick={() => setDialogOpen(true)} disabled={!members || members.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Record Your First Payment
        </Button>
        {(!members || members.length === 0) && (
          <p className="text-xs text-muted-foreground mt-3">
            First, <a href="/app/members" className="text-primary hover:underline">add a member</a> to get started.
          </p>
        )}
      </div>
    )
  );

  const totalPendingAmount = [...(pendingPayments), ...(overduePayments)].reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Track all payment transactions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!members || members.length === 0}>
                <Plus className="h-4 w-4 mr-2" />Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Member</Label>
                  <Select value={memberId} onValueChange={setMemberId} required>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {members?.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {methods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Note (optional)</Label>
                  <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Any note..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!memberId}>Record Payment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        {(pendingPayments.length > 0 || overduePayments.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overduePayments.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{totalPendingAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Due</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({payments?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overduePayments.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidPayments.length})</TabsTrigger>
          </TabsList>
          <Card className="mt-4">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="m-0"><PaymentTable data={payments} showMarkPaid /></TabsContent>
                  <TabsContent value="pending" className="m-0"><PaymentTable data={pendingPayments} showMarkPaid /></TabsContent>
                  <TabsContent value="overdue" className="m-0"><PaymentTable data={overduePayments} showMarkPaid /></TabsContent>
                  <TabsContent value="paid" className="m-0"><PaymentTable data={paidPayments} /></TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
  );
}
