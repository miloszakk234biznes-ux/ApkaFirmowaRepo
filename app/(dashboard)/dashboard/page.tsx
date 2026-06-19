/**
 * Plik: app/(dashboard)/dashboard/page.tsx
 * Cel: Widok główny (pulpit) — KPI dnia (zlecenia oraz — dla admina — przychód,
 *      wydatki, zysk) i lista najbliższych zleceń (z uwzględnieniem RBAC scope).
 * Zależności: lib/auth, lib/prisma, lib/orders, components/*.
 */
import {
  startOfDay,
  endOfDay,
  addDays,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scopeForUser } from '@/lib/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingOrders } from '@/components/dashboard/upcoming-orders';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const name = session.user.name ?? 'użytkowniku';
  const isAdmin = session.user.role === Role.ADMIN;

  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);
  const tomorrowFrom = startOfDay(addDays(now, 1));
  const tomorrowTo = endOfDay(addDays(now, 1));
  const monthFrom = startOfMonth(now);
  const monthTo = endOfMonth(now);
  const scope = scopeForUser(session);

  // Wspólny zestaw pól dla list zleceń na pulpicie.
  const orderSelect = {
    id: true,
    title: true,
    status: true,
    paymentStatus: true,
    amount: true,
    address: true,
    scheduledAt: true,
    client: { select: { firstName: true, lastName: true } },
  } as const;

  // Dzisiejsze zlecenia (wg roli) — licznik oraz pełna lista na cały dzień
  // (pokazujemy wszystkie zlecenia dnia, także te z minioną godziną — nie znikają).
  const [
    todayOrders,
    upcoming,
    tomorrow,
    income,
    expense,
    monthIncome,
    monthExpense,
  ] = await Promise.all([
    prisma.order.count({
      where: { ...scope, scheduledAt: { gte: from, lte: to } },
    }),
    prisma.order.findMany({
      where: { ...scope, scheduledAt: { gte: from, lte: to } },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
      select: orderSelect,
    }),
    prisma.order.findMany({
      where: { ...scope, scheduledAt: { gte: tomorrowFrom, lte: tomorrowTo } },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
      select: orderSelect,
    }),
    isAdmin
      ? prisma.income.aggregate({
          where: { date: { gte: from, lte: to } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.expense.aggregate({
          where: { date: { gte: from, lte: to } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.income.aggregate({
          where: { date: { gte: monthFrom, lte: monthTo } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.expense.aggregate({
          where: { date: { gte: monthFrom, lte: monthTo } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
  ]);

  const revenue = Number(income?._sum.amount ?? 0);
  const costs = Number(expense?._sum.amount ?? 0);
  const profitToday = revenue - costs;
  const monthRevenue = Number(monthIncome?._sum.amount ?? 0);
  const monthCosts = Number(monthExpense?._sum.amount ?? 0);
  const profitMonth = monthRevenue - monthCosts;

  const toItems = (
    list: {
      id: string;
      title: string;
      status: (typeof upcoming)[number]['status'];
      paymentStatus: (typeof upcoming)[number]['paymentStatus'];
      amount: unknown;
      address: string | null;
      scheduledAt: Date | null;
      client: { firstName: string; lastName: string } | null;
    }[],
  ) =>
    list.map((o) => ({
      id: o.id,
      title: o.title,
      status: o.status,
      paymentStatus: o.paymentStatus,
      amount: Number(o.amount),
      address: o.address ?? null,
      scheduledAt: o.scheduledAt ? o.scheduledAt.toISOString() : null,
      clientName: o.client
        ? `${o.client.firstName} ${o.client.lastName}`
        : null,
    }));

  const upcomingItems = toItems(upcoming);
  const tomorrowItems = toItems(tomorrow);

  const kpis = [
    { label: 'Dzisiejsze zlecenia', value: String(todayOrders) },
    ...(isAdmin
      ? [
          { label: 'Zysk dziś', value: formatCurrency(profitToday) },
          {
            label: 'Zysk od początku miesiąca',
            value: formatCurrency(profitMonth),
          },
          {
            label: 'Wydatki od początku miesiąca',
            value: formatCurrency(monthCosts),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Witaj, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Oto przegląd Twojej firmy na dziś.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zlecenia na dziś</CardTitle>
        </CardHeader>
        <CardContent>
          <UpcomingOrders
            orders={upcomingItems}
            emptyText="Brak zleceń na dziś."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zlecenia na jutro</CardTitle>
        </CardHeader>
        <CardContent>
          <UpcomingOrders
            orders={tomorrowItems}
            emptyText="Brak zleceń na jutro."
          />
        </CardContent>
      </Card>
    </div>
  );
}
