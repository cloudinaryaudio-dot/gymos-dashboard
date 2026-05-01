import { useState, useMemo } from 'react';
import { usePayments, useCreatePayment, useDeletePayment, useUpdatePaymentStatus, type Payment } from '@/hooks/usePayments';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CheckCircle, CreditCard, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useDemoMode } from '@/demo/DemoModeContext';
import { ViewOnlyPill } from '@/demo/ViewOnlyPill';
import { VendorFilter, useDemoVendorFilter } from '@/demo/VendorFilter';

const PAGE_SIZE = 15;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
type TimeMode = 'all' | 'month' | 'year';

type ConfirmAction =
  | { type: 'mark-paid'; payment: Payment }
  | { type: 'delete'; payment: Payment }
  | null;

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
  const { isDemo, can } = useDemoMode();
  const canEdit = !isDemo || can('payments', 'edit');
  const { vendorId: vfId, setVendorId: setVfId, filter: vendorFilter } = useDemoVendorFilter();
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

  // Time filter
  const today = new Date();
  const [timeMode, setTimeMode] = useState<TimeMode>('all');
  const [filterMonth, setFilterMonth] = useState<number>(today.getMonth());
  const [filterYear, setFilterYear] = useState<number>(today.getFullYear());

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (timeMode === 'all') return payments;
    if (timeMode === 'month') {
      const f = startOfMonth(new Date(filterYear, filterMonth, 1));
      const t = endOfMonth(f);
      return payments.filter(p => {
        const d = new Date(p.payment_date);
        return d >= f && d <= t;
      });
    }
    const f = startOfYear(new Date(filterYear, 0, 1));
    const t = endOfYear(f);
    return payments.filter(p => {
      const d = new Date(p.payment_date);
      return d >= f && d <= t;
    });
  }, [payments, timeMode, filterMonth, filterYear]);

  const paidPayments = filteredPayments.filter(p => p.status === 'paid');
  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const overduePayments = filteredPayments.filter(p => p.status === 'overdue');

  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - i);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pages, setPages] = useState<Record<string, number>>({ all: 1, pending: 1, overdue: 1, paid: 1 });

  const setPage = (key: string, page: number) => setPages(p => ({ ...p, [key]: page }));

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'mark-paid') {
        await updateStatus.mutateAsync({ id: confirmAction.payment.id, status: 'paid' });
        toast({ title: 'Payment marked as paid' });
      } else {
        await deletePayment.mutateAsync(confirmAction.payment.id);
        toast({ title: 'Payment deleted' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setConfirmAction(null);
    }
  };

  const PaymentTable = ({ data, showMarkPaid, pageKey }: { data: typeof payments; showMarkPaid?: boolean; pageKey: string }) => {
    const list = data ?? [];
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const currentPage = Math.min(pages[pageKey] ?? 1, totalPages);
    const pageData = useMemo(
      () => list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
      [list, currentPage]
    );

    if (list.length === 0) {
      return (
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
      );
    }

    // Page number window (max 5 shown)
    const pageNumbers: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pageNumbers.push(i);

    return (
      <>
        <div className="responsive-card-table"><Table>
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
            {pageData.map(p => (
              <TableRow key={p.id}>
                <TableCell data-label="Member" className="font-medium">{p.members?.name ?? '—'}</TableCell>
                <TableCell data-label="Amount">₹{Number(p.amount).toLocaleString()}</TableCell>
                <TableCell data-label="Date">{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                <TableCell data-label="Method" className="capitalize">{p.method.replace('_', ' ')}</TableCell>
                <TableCell data-label="Status">
                  <Badge variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'}
                    className={cn(
                      p.status === 'paid' && 'bg-emerald-500/10 text-emerald-600 border border-emerald-300',
                      p.status === 'overdue' && '',
                      p.status === 'pending' && 'border-orange-400 text-orange-500 bg-orange-500/10'
                    )}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell data-label="Actions" className="text-right actions-cell">
                  <div className="inline-flex items-center gap-1 justify-end">
                  {showMarkPaid && (p.status === 'pending' || p.status === 'overdue') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Mark as Paid"
                      onClick={() => setConfirmAction({ type: 'mark-paid', payment: p })}
                    >
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete Payment"
                    onClick={() => setConfirmAction({ type: 'delete', payment: p })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, list.length)} of {list.length}
          </p>
          {totalPages > 1 && (
            <Pagination className="m-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={cn(currentPage === 1 && 'pointer-events-none opacity-50')}
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) setPage(pageKey, currentPage - 1); }}
                  />
                </PaginationItem>
                {start > 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {pageNumbers.map(n => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={n === currentPage}
                      onClick={(e) => { e.preventDefault(); setPage(pageKey, n); }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {end < totalPages && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === totalPages}
                    className={cn(currentPage === totalPages && 'pointer-events-none opacity-50')}
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setPage(pageKey, currentPage + 1); }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </>
    );
  };



  return (
    <div className="space-y-6 max-w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-display">Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Track all payment transactions</p>
          </div>
          <div className="grid grid-cols-1 sm:flex sm:items-center gap-2">
            <Link to="/app/payments/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <BarChart3 className="h-4 w-4 mr-2" />Payments Dashboard
              </Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto" disabled={!members || members.length === 0}>
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
        </div>



        {/* Time toggle */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border bg-card">
          <ToggleGroup type="single" value={timeMode} onValueChange={(v) => v && setTimeMode(v as TimeMode)}>
            <ToggleGroupItem value="all">All Time</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
            <ToggleGroupItem value="year">Year</ToggleGroupItem>
          </ToggleGroup>

          {timeMode === 'month' && (
            <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {timeMode !== 'all' && (
            <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredPayments.length}</span> of {payments?.length ?? 0}
          </span>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="all">All ({filteredPayments.length})</TabsTrigger>
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
                  <TabsContent value="all" className="m-0"><PaymentTable data={filteredPayments} showMarkPaid pageKey="all" /></TabsContent>
                  <TabsContent value="pending" className="m-0"><PaymentTable data={pendingPayments} showMarkPaid pageKey="pending" /></TabsContent>
                  <TabsContent value="overdue" className="m-0"><PaymentTable data={overduePayments} showMarkPaid pageKey="overdue" /></TabsContent>
                  <TabsContent value="paid" className="m-0"><PaymentTable data={paidPayments} pageKey="paid" /></TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>

        <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.type === 'delete' ? 'Delete payment?' : 'Mark payment as paid?'}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  {confirmAction && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm text-foreground">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Member</span>
                        <span className="font-medium">{confirmAction.payment.members?.name ?? '—'}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">₹{Number(confirmAction.payment.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{format(new Date(confirmAction.payment.payment_date), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                  )}
                  <p>Are you sure you want to proceed?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={cn(confirmAction?.type === 'delete' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
