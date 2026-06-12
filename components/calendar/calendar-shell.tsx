/**
 * Plik: components/calendar/calendar-shell.tsx
 * Cel: Główny komponent kalendarza — przełączanie widoków (miesiąc/tydzień/dzień),
 *      nawigacja po datach, filtry, panel dnia, dodawanie/edycja zleceń oraz
 *      przenoszenie zleceń między dniami metodą drag & drop (zmiana terminu).
 * Zależności: @dnd-kit/core, date-fns, hooks/use-orders, components/calendar/*,
 *      components/orders/order-form-dialog, lib/fetcher.
 * Użycie: app/(dashboard)/calendar/page.tsx.
 */
'use client';

import * as React from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  addMonths,
  addWeeks,
  addDays,
  setHours,
  setMinutes,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Role } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { DayPanel } from '@/components/calendar/day-panel';
import {
  CalendarFilters,
  type CalendarFilterState,
} from '@/components/calendar/calendar-filters';
import { OrderFormDialog } from '@/components/orders/order-form-dialog';
import { useCalendarOrders } from '@/hooks/use-orders';
import { apiRequest } from '@/lib/fetcher';
import {
  rangeForMonth,
  rangeForWeek,
  rangeForDay,
  groupByDay,
  dayKey,
  formatMonthLabel,
  formatWeekLabel,
  formatDayLabel,
} from '@/lib/calendar-utils';
import type { OrderListItem } from '@/types';

type View = 'month' | 'week' | 'day';
const ALL = 'ALL';

export function CalendarShell({ role }: { role: Role }) {
  const [view, setView] = React.useState<View>('month');
  const [current, setCurrent] = React.useState(() => new Date());
  const [filters, setFilters] = React.useState<CalendarFilterState>({
    status: ALL,
    serviceType: ALL,
    assignedUserId: ALL,
  });
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [addDate, setAddDate] = React.useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Zakres dat do pobrania zależy od aktywnego widoku.
  const range = React.useMemo(() => {
    if (view === 'month') return rangeForMonth(current);
    if (view === 'week') return rangeForWeek(current);
    return rangeForDay(current);
  }, [view, current]);

  const apiFilters = {
    status: filters.status === ALL ? undefined : filters.status,
    serviceType: filters.serviceType === ALL ? undefined : filters.serviceType,
    assignedUserId:
      filters.assignedUserId === ALL ? undefined : filters.assignedUserId,
  };

  const { orders, isLoading, mutate } = useCalendarOrders(
    range.from,
    range.to,
    apiFilters,
  );

  const label =
    view === 'month'
      ? formatMonthLabel(current)
      : view === 'week'
        ? formatWeekLabel(current)
        : formatDayLabel(current);

  function navigate(dir: -1 | 1) {
    setCurrent((d) =>
      view === 'month'
        ? addMonths(d, dir)
        : view === 'week'
          ? addWeeks(d, dir)
          : addDays(d, dir),
    );
  }

  function selectOrder(o: OrderListItem) {
    window.location.href = `/orders/${o.id}`;
  }

  function openAdd(date: Date) {
    setAddDate(format(setHours(date, 9), "yyyy-MM-dd'T'HH:mm"));
    setSelectedDay(null);
    setDialogOpen(true);
  }

  // Drag & drop — przeniesienie zlecenia na inny dzień (zachowuje godzinę).
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const order = active.data.current?.order as OrderListItem | undefined;
    const targetIso = over.data.current?.date as string | undefined;
    if (!order || !targetIso) return;

    const target = new Date(targetIso);
    const origin = order.scheduledAt ? new Date(order.scheduledAt) : null;
    const newDate = origin
      ? setMinutes(setHours(target, origin.getHours()), origin.getMinutes())
      : setHours(target, 9);

    if (origin && dayKey(origin) === dayKey(target)) return; // ten sam dzień

    try {
      await apiRequest(`/api/orders/${order.id}`, 'PATCH', {
        scheduledAt: newDate.toISOString(),
      });
      toast.success('Zlecenie przeniesione');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się przenieść');
    }
  }

  const panelOrders = selectedDay
    ? (groupByDay(orders).get(dayKey(selectedDay)) ?? [])
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Poprzedni"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(1)}
            aria-label="Następny"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent(new Date())}
          >
            Dziś
          </Button>
          <h2 className="ml-2 text-lg font-semibold capitalize">{label}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CalendarFilters role={role} value={filters} onChange={setFilters} />
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="month">Miesiąc</TabsTrigger>
              <TabsTrigger value="week">Tydzień</TabsTrigger>
              <TabsTrigger value="day">Dzień</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-lg" />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {view === 'month' && (
            <MonthView
              current={current}
              orders={orders}
              onSelectDay={setSelectedDay}
              onSelectOrder={selectOrder}
            />
          )}
          {view === 'week' && (
            <WeekView
              current={current}
              orders={orders}
              onSelectDay={setSelectedDay}
              onSelectOrder={selectOrder}
            />
          )}
          {view === 'day' && (
            <DayView
              current={current}
              orders={orders}
              onSelectOrder={selectOrder}
            />
          )}
        </DndContext>
      )}

      <DayPanel
        date={selectedDay}
        orders={panelOrders}
        onClose={() => setSelectedDay(null)}
        onAdd={openAdd}
      />

      <OrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={role}
        defaultScheduledAt={addDate}
        onSaved={() => mutate()}
      />
    </div>
  );
}
