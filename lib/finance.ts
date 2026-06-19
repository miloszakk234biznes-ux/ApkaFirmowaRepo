/**
 * Plik: lib/finance.ts
 * Cel: Logika modułu finansowego — automatyczny przychód przy DONE, agregaty
 *      dashboardu (KPI dziś/miesiąc, serie M/M, koszty wg kategorii, statystyki,
 *      postęp celu, alerty) oraz rentowność zlecenia.
 * Zależności: lib/prisma, date-fns, @prisma/client.
 */
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { EXPENSE_CATEGORY } from '@/lib/constants';

/** Marker źródła automatycznego przychodu (tworzonego przy statusie DONE). */
const AUTO_SOURCE = 'AUTO_ORDER';

/**
 * Synchronizuje automatyczny przychód zlecenia: tworzy wpis Income, gdy zlecenie
 * jest OPŁACONE lub ZAKOŃCZONE (jeśli brak), a usuwa go, gdy przestaje spełniać
 * ten warunek. Idempotentne. Dzięki temu oznaczenie zlecenia jako „Opłacone"
 * od razu zasila przychód na pulpicie i w finansach.
 */
export async function syncOrderIncome(order: Order): Promise<void> {
  const existing = await prisma.income.findFirst({
    where: { orderId: order.id, source: AUTO_SOURCE },
  });

  // Przychód rozpoznajemy kasowo: gdy zlecenie jest opłacone, a dodatkowo
  // (dla zgodności) gdy zostało zakończone.
  const shouldHaveIncome =
    order.paymentStatus === PaymentStatus.PAID ||
    order.status === OrderStatus.DONE;

  if (shouldHaveIncome) {
    const amount = Number(order.amount);
    const date = order.scheduledAt ?? new Date();
    if (existing) {
      // Zaktualizuj kwotę, jeśli się zmieniła.
      if (Number(existing.amount) !== amount) {
        await prisma.income.update({
          where: { id: existing.id },
          data: { amount: order.amount, date },
        });
      }
    } else {
      await prisma.income.create({
        data: {
          orderId: order.id,
          amount: order.amount,
          date,
          source: AUTO_SOURCE,
          description: `Przychód ze zlecenia: ${order.title}`,
        },
      });
    }
  } else if (existing) {
    await prisma.income.delete({ where: { id: existing.id } });
  }
}

function sumDecimal(values: { amount: unknown }[]): number {
  return values.reduce((s, v) => s + Number(v.amount), 0);
}

/** Rentowność pojedynczego zlecenia: brutto − koszty = zysk, % marży. */
export async function orderProfitability(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { costs: true },
  });
  if (!order) return null;
  const gross = Number(order.amount);
  const costs = sumDecimal(order.costs);
  const profit = gross - costs;
  const marginPct = gross > 0 ? (profit / gross) * 100 : 0;
  return {
    gross,
    costs,
    profit,
    marginPct,
    items: order.costs,
  };
}

interface RangeTotals {
  revenue: number;
  expense: number;
  profit: number;
  orders: number;
}

async function totalsForRange(from: Date, to: Date): Promise<RangeTotals> {
  const [incomeAgg, expenseAgg, ordersCount] = await Promise.all([
    prisma.income.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: { scheduledAt: { gte: from, lte: to } },
    }),
  ]);
  const revenue = Number(incomeAgg._sum.amount ?? 0);
  const expense = Number(expenseAgg._sum.amount ?? 0);
  return { revenue, expense, profit: revenue - expense, orders: ordersCount };
}

/** Kompletne dane dashboardu finansowego. */
export async function getFinanceSummary() {
  const now = new Date();
  const todayRange = { from: startOfDay(now), to: endOfDay(now) };
  const monthRange = { from: startOfMonth(now), to: endOfMonth(now) };

  const [today, month] = await Promise.all([
    totalsForRange(todayRange.from, todayRange.to),
    totalsForRange(monthRange.from, monthRange.to),
  ]);

  // Serie 12 miesięcy (przychód / koszt / zysk).
  const monthly: {
    key: string;
    label: string;
    revenue: number;
    expense: number;
    profit: number;
  }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    const from = startOfMonth(d);
    const to = endOfMonth(d);
    const t = await totalsForRange(from, to);
    monthly.push({
      key: format(d, 'yyyy-MM'),
      label: format(d, 'LLL', { locale: pl }),
      revenue: t.revenue,
      expense: t.expense,
      profit: t.profit,
    });
  }

  // Koszty wg kategorii (bieżący miesiąc).
  const byCategory = await prisma.expense.groupBy({
    by: ['category'],
    where: { date: { gte: monthRange.from, lte: monthRange.to } },
    _sum: { amount: true },
  });
  const categories = byCategory
    .map((c) => ({
      category: c.category,
      label: EXPENSE_CATEGORY[c.category],
      amount: Number(c._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Statystyki: średni przychód ze zlecenia (DONE), średni koszt, marża, trend M/M.
  const doneAgg = await prisma.order.aggregate({
    where: { status: OrderStatus.DONE },
    _avg: { amount: true },
    _count: { _all: true },
  });
  const expenseAvg = await prisma.expense.aggregate({ _avg: { amount: true } });
  const prevMonthD = subMonths(now, 1);
  const prev = await totalsForRange(
    startOfMonth(prevMonthD),
    endOfMonth(prevMonthD),
  );
  const revenueTrendPct =
    prev.revenue > 0
      ? ((month.revenue - prev.revenue) / prev.revenue) * 100
      : null;
  const avgOrderValue = Number(doneAgg._avg.amount ?? 0);

  const stats = {
    avgRevenuePerOrder: avgOrderValue,
    avgCost: Number(expenseAvg._avg.amount ?? 0),
    marginPct: month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0,
    revenueTrendPct,
  };

  // Cel bieżącego miesiąca + postęp.
  const goalRow = await prisma.financialGoal.findUnique({
    where: {
      year_month: { year: now.getFullYear(), month: now.getMonth() + 1 },
    },
  });
  let goal = null;
  if (goalRow) {
    const targetRevenue = Number(goalRow.targetRevenue);
    const remainingRevenue = Math.max(0, targetRevenue - month.revenue);
    const ordersNeeded =
      avgOrderValue > 0 ? Math.ceil(remainingRevenue / avgOrderValue) : null;
    goal = {
      targetRevenue,
      targetProfit: Number(goalRow.targetProfit),
      targetOrders: goalRow.targetOrders,
      currentRevenue: month.revenue,
      currentProfit: month.profit,
      currentOrders: month.orders,
      remainingRevenue,
      ordersNeeded,
      avgOrderValue,
      revenuePct:
        targetRevenue > 0
          ? Math.min(100, (month.revenue / targetRevenue) * 100)
          : 0,
    };
  }

  // Alerty.
  const alerts: { level: 'warning' | 'danger'; message: string }[] = [];
  if (month.expense > month.revenue && month.expense > 0) {
    alerts.push({
      level: 'danger',
      message: `Wydatki w tym miesiącu (${month.expense.toFixed(2)} zł) przewyższają przychody (${month.revenue.toFixed(2)} zł).`,
    });
  }
  if (goal && now.getDate() >= 20 && goal.revenuePct < 100) {
    alerts.push({
      level: 'warning',
      message: `Zbliża się koniec miesiąca, a cel przychodu zrealizowany w ${goal.revenuePct.toFixed(0)}%. Brakuje ${goal.remainingRevenue.toFixed(2)} zł${goal.ordersNeeded ? ` (~${goal.ordersNeeded} zleceń)` : ''}.`,
    });
  }

  return { today, month, monthly, categories, stats, goal, alerts };
}

const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

/** Raport roczny — przychody/koszty/zysk dla każdego miesiąca + sumy. */
export async function getYearlyReport(year: number) {
  const rows: {
    label: string;
    revenue: number;
    expense: number;
    profit: number;
  }[] = [];
  for (let m = 0; m < 12; m++) {
    const from = new Date(year, m, 1);
    const to = endOfMonth(from);
    const t = await totalsForRange(from, to);
    rows.push({
      label: MONTH_NAMES[m]!,
      revenue: t.revenue,
      expense: t.expense,
      profit: t.profit,
    });
  }
  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expense: acc.expense + r.expense,
      profit: acc.profit + r.profit,
    }),
    { revenue: 0, expense: 0, profit: 0 },
  );
  return { rows, totals };
}
