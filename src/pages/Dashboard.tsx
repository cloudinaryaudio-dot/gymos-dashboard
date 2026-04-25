import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Database, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { seedDemoData, resetDemoData, clearLocalData } from '@/data/mockDb';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { SetupBanner } from '@/components/SetupBanner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsKpis } from '@/components/dashboard/AnalyticsKpis';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import {
  TodayPicker, WeekPicker, MonthPicker, YearPicker,
  rangeForToday, rangeForWeek, rangeForMonth, rangeForYear,
} from '@/components/dashboard/DateRangePickers';

type TabId = 'today' | 'weekly' | 'monthly' | 'yearly';

export default function Dashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabId>('today');
  const now = new Date();
  const [day, setDay] = useState<Date>(now);
  const [week, setWeek] = useState<Date>(now);
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());
  const [yearOnly, setYearOnly] = useState<number>(now.getFullYear());

  const { range, granularity } = useMemo(() => {
    if (tab === 'today') return { range: rangeForToday(day), granularity: 'day' as const };
    if (tab === 'weekly') return { range: rangeForWeek(week), granularity: 'day' as const };
    if (tab === 'monthly') return { range: rangeForMonth(month, year), granularity: 'day' as const };
    return { range: rangeForYear(yearOnly), granularity: 'month' as const };
  }, [tab, day, week, month, year, yearOnly]);

  const { data, isLoading } = useAnalytics(range.from, range.to, granularity);

  const handleSeed = async () => {
    resetDemoData();
    seedDemoData();
    await qc.resetQueries();
    toast({ title: '✅ Demo data loaded successfully!' });
  };
  const handleReset = async () => {
    resetDemoData();
    await qc.resetQueries();
    toast({ title: '🗑️ All data cleared!' });
  };


  return (
    <div className="space-y-6">
      <SetupBanner />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Database className="mr-2 h-4 w-4" /> Load Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Load Demo Data?</AlertDialogTitle>
                <AlertDialogDescription>This will overwrite current data with demo data. Continue?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeed}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                <AlertDialogDescription>This will remove all data. Continue?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Local Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Local Data?</AlertDialogTitle>
                <AlertDialogDescription>This will clear all local data and reload the app. Continue?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { toast({ title: '🧹 Local data cleared!' }); setTimeout(clearLocalData, 300); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-muted">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          <div>
            {tab === 'today' && <TodayPicker date={day} onChange={setDay} />}
            {tab === 'weekly' && <WeekPicker weekStart={week} onChange={setWeek} />}
            {tab === 'monthly' && <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
            {tab === 'yearly' && <YearPicker year={yearOnly} onChange={setYearOnly} />}
          </div>
        </div>

        {isLoading || !data ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <TabsContent value="today" className="space-y-6 mt-0">
              <AnalyticsKpis kpis={data.kpis} />
              <AnalyticsCharts data={data} variant="today" />
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6 mt-0">
              <AnalyticsKpis kpis={data.kpis} />
              <AnalyticsCharts data={data} variant="weekly" />
            </TabsContent>

            <TabsContent value="monthly" className="space-y-6 mt-0">
              <AnalyticsKpis kpis={data.kpis} />
              <AnalyticsCharts data={data} variant="monthly" />
            </TabsContent>

            <TabsContent value="yearly" className="space-y-6 mt-0">
              <AnalyticsKpis kpis={data.kpis} />
              <AnalyticsCharts data={data} variant="yearly" />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
