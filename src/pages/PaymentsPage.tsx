import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Trash2, CheckCircle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const methods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function PaymentsPage() {
  const { user, loading } = useAuth();
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

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

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
                <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {showMarkPaid && p.status === 'pending' && (
                  <Button variant="ghost" size="icon" onClick={() => updateStatus.mutateAsync({ id: p.id, status: 'paid' })}>
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
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No payments found.</p>
      </div>
    )
  );

  return (
    <DashboardLayout>
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

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({payments?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
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
                  <TabsContent value="paid" className="m-0"><PaymentTable data={paidPayments} /></TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
