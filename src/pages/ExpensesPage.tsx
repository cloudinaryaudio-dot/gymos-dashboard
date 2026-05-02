import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Receipt, Search, ArrowUpDown, BarChart3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { useDemoMode } from '@/demo/DemoModeContext';
import { ViewOnlyPill } from '@/demo/ViewOnlyPill';
import { VendorFilter, useDemoVendorFilter } from '@/demo/VendorFilter';
import { NoAccessCard } from '@/demo/NoAccessCard';

const DEFAULT_CATEGORIES = ['Rent', 'Salaries', 'Equipment', 'Utilities', 'Maintenance', 'Marketing', 'Other'];
const PAGE_SIZE = 15;
const CATS_KEY = 'gymos_expense_categories';

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CATEGORIES;
}
function saveCategories(cats: string[]) {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats));
}

type SortKey = 'amount' | 'expense_date' | 'category';
type SortDir = 'asc' | 'desc';

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const { toast } = useToast();
  const { isDemo, can } = useDemoMode();
  const canEdit = !isDemo || can('expenses', 'edit');
  const { vendorId: vfId, setVendorId: setVfId, filter: vendorFilter } = useDemoVendorFilter();

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');

  // category management
  const [categories, setCategories] = useState<string[]>(loadCategories());
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCat, setNewCat] = useState('');

  const addCategory = () => {
    const v = newCat.trim();
    if (!v || categories.includes(v)) return;
    const next = [...categories, v];
    setCategories(next); saveCategories(next); setNewCat('');
  };
  const removeCategory = (c: string) => {
    const next = categories.filter(x => x !== c);
    setCategories(next); saveCategories(next);
  };

  // filters from URL
  const now = new Date();
  const mode = (searchParams.get('mode') as 'month' | 'year') || 'month';
  const selMonth = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);
  const selYear = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);
  const filterCategory = searchParams.get('category') ?? 'all';
  const search = searchParams.get('q') ?? '';
  const sortKey = (searchParams.get('sort') as SortKey) || 'expense_date';
  const sortDir = (searchParams.get('dir') as SortDir) || 'desc';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };

  // debounced search
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => { setSearchInput(search); }, [search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) updateParams({ q: searchInput || null, page: '1' });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast({ title: 'View only', description: 'You do not have permission to add expenses.', variant: 'destructive' }); return; }
    try {
      await createExpense.mutateAsync({
        title, amount: parseFloat(amount), expense_date: date,
        category: category || undefined,
      });
      toast({ title: 'Expense added!' });
      setDialogOpen(false);
      setTitle(''); setAmount(''); setDate(format(new Date(), 'yyyy-MM-dd')); setCategory('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // filter by period + search + category
  const filtered = useMemo(() => {
    if (!expenses) return [];
    const scoped = vendorFilter(expenses as any) as typeof expenses;
    return scoped.filter(e => {
      const d = new Date(e.expense_date);
      if (mode === 'month') {
        if (d.getMonth() + 1 !== selMonth || d.getFullYear() !== selYear) return false;
      } else {
        if (d.getFullYear() !== selYear) return false;
      }
      if (filterCategory !== 'all' && (e.category || 'Other').toLowerCase() !== filterCategory.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !(e.category || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [expenses, mode, selMonth, selYear, filterCategory, search, vendorFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === 'amount') { av = Number(a.amount); bv = Number(b.amount); }
      else if (sortKey === 'category') { av = a.category || ''; bv = b.category || ''; }
      else { av = a.expense_date; bv = b.expense_date; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalForPeriod = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) updateParams({ dir: sortDir === 'asc' ? 'desc' : 'asc' });
    else updateParams({ sort: k, dir: 'desc' });
  };

  const periodLabel = mode === 'month'
    ? format(new Date(selYear, selMonth - 1, 1), 'MMMM yyyy')
    : String(selYear);

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, label: format(new Date(2000, i, 1), 'MMMM') }));

  const hasActiveFilters = filterCategory !== 'all' || !!search;

  if (isDemo && !can('expenses', 'view')) return <NoAccessCard />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            Expenses
            <ViewOnlyPill module="expenses" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {periodLabel}: <span className="text-foreground font-semibold">₹{totalForPeriod.toLocaleString()}</span>
            <span className="text-muted-foreground"> · {filtered.length} entries</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          <VendorFilter value={vfId} onChange={setVfId} className="w-full sm:w-auto" />
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/app/expenses/dashboard')}>
            <BarChart3 className="h-4 w-4 mr-2" /> Expenses Dashboard
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" disabled={!canEdit} onClick={() => setCatDialogOpen(true)}>Manage Categories</Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (o && !canEdit) return; setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" disabled={!canEdit} title={!canEdit ? 'You do not have permission' : undefined}>
                <Plus className="h-4 w-4 mr-2" />Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Electricity Bill" required />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Period toggle + filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Tabs value={mode} onValueChange={(v) => updateParams({ mode: v, page: '1' })}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
            {mode === 'month' && (
              <Select value={String(selMonth)} onValueChange={(v) => updateParams({ month: v, page: '1' })}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={String(selYear)} onValueChange={(v) => updateParams({ year: v, page: '1' })}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="lg:ml-auto flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-[220px]"
                  placeholder="Search title or category"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={(v) => updateParams({ category: v === 'all' ? null : v, page: '1' })}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={() => updateParams({ q: null, category: null, page: '1' })}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : pageRows.length > 0 ? (
            <>
              <div className="responsive-card-table"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('amount')}>
                        Amount <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('expense_date')}>
                        Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('category')}>
                        Category <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell data-label="Title" className="font-medium">{exp.title}</TableCell>
                      <TableCell data-label="Amount">₹{Number(exp.amount).toLocaleString()}</TableCell>
                      <TableCell data-label="Date">{format(new Date(exp.expense_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell data-label="Category">{exp.category ? <Badge variant="secondary">{exp.category}</Badge> : '—'}</TableCell>
                      <TableCell data-label="Actions" className="text-right actions-cell">
                        <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => deleteExpense.mutateAsync(exp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Page {safePage} of {totalPages} · {sorted.length} results
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={safePage <= 1}
                    onClick={() => updateParams({ page: String(safePage - 1) })}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages}
                    onClick={() => updateParams({ page: String(safePage + 1) })}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {hasActiveFilters || (expenses?.length ?? 0) > 0
                  ? `No expenses found for ${periodLabel}`
                  : 'No expenses yet'}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                {(expenses?.length ?? 0) > 0
                  ? 'Try a different period or clear filters.'
                  : 'Track your gym expenses to monitor profitability.'}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Categories</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="New category" value={newCat} onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} />
              <Button onClick={addCategory}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Badge key={c} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                  {c}
                  <button onClick={() => removeCategory(c)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
