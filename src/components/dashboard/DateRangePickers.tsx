import { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

// ─── TODAY ───
export function TodayPicker({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onChange(addDays(date, -1))} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('justify-start text-left font-normal min-w-[180px]')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, 'EEE, dd MMM yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { if (d) { onChange(d); setOpen(false); } }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="sm" onClick={() => onChange(addDays(date, 1))} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onChange(new Date())}>Today</Button>
    </div>
  );
}

// ─── WEEK ───
export function WeekPicker({ weekStart, onChange }: { weekStart: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = endOfWeek(weekStart, { weekStartsOn: 1 });
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onChange(addDays(start, -7))} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start text-left font-normal min-w-[230px]">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(start, 'dd MMM')} – {format(end, 'dd MMM yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={start}
            onSelect={(d) => { if (d) { onChange(startOfWeek(d, { weekStartsOn: 1 })); setOpen(false); } }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="sm" onClick={() => onChange(addDays(start, 7))} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onChange(new Date())}>This week</Button>
    </div>
  );
}

// ─── MONTH ───
export function MonthPicker({ month, year, onChange }: { month: number; year: number; onChange: (m: number, y: number) => void }) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i, label: format(new Date(2000, i, 1), 'MMMM'),
  }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const goPrev = () => {
    if (month === 0) onChange(11, year - 1); else onChange(month - 1, year);
  };
  const goNext = () => {
    if (month === 11) onChange(0, year + 1); else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={goPrev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={String(month)} onValueChange={(v) => onChange(Number(v), year)}>
        <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => onChange(month, Number(v))}>
        <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={goNext} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => { const n = new Date(); onChange(n.getMonth(), n.getFullYear()); }}>This month</Button>
    </div>
  );
}

// ─── YEAR ───
export function YearPicker({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onChange(year - 1)} aria-label="Previous year">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={String(year)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-9 w-[120px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={() => onChange(year + 1)} aria-label="Next year">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onChange(currentYear)}>This year</Button>
    </div>
  );
}

// ─── Range helpers ───
export function rangeForToday(date: Date) { return { from: ymd(date), to: ymd(date) }; }
export function rangeForWeek(weekStart: Date) {
  return { from: ymd(startOfWeek(weekStart, { weekStartsOn: 1 })), to: ymd(endOfWeek(weekStart, { weekStartsOn: 1 })) };
}
export function rangeForMonth(month: number, year: number) {
  const d = new Date(year, month, 1);
  return { from: ymd(startOfMonth(d)), to: ymd(endOfMonth(d)) };
}
export function rangeForYear(year: number) {
  const d = new Date(year, 0, 1);
  return { from: ymd(startOfYear(d)), to: ymd(endOfYear(d)) };
}
