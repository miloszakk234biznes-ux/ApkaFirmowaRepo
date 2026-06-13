/**
 * Plik: app/(dashboard)/dashboard/page.tsx
 * Cel: Widok główny (pulpit) — KPI dnia (zlecenia oraz — dla admina — przychód,
 *      wydatki, zysk) i lista najbliższych zleceń (z uwzględnieniem RBAC scope).
 * Zależności: lib/auth, lib/prisma, lib/orders, components/*.
 */
import Link from 'next/link';
import { startOfDay, endOfDay } from 'date-fns';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scopeForUser } from '@/lib/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const name = session.user.name ?? 'użytkowniku';
  const isAdmin = session.user.role === Role.ADMIN;

  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);
  const scope = scopeForUser(session);

  // Dzisiejsze zlecenia (wg roli) + nadchodzące.
  const [todayOrders, upcoming, income, expense] = await Promise.all([
    prisma.order.count({
      where: { ...scope, scheduledAt: { gte: from, lte: to } },
    }),
    prisma.order.findMany({
      where: { ...scope, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
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
  ]);

  const revenue = Number(income?._sum.amount ?? 0);
  const costs = Number(expense?._sum.amount ?? 0);

  const kpis = [
    { label: 'Dzisiejsze zlecenia', value: String(todayOrders) },
    ...(isAdmin
      ? [
          { label: 'Przychód dziś', value: formatCurrency(revenue) },
          { label: 'Wydatki dziś', value: formatCurrency(costs) },
          { label: 'Zysk dziś', value: formatCurrency(revenue - costs) },
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
          <CardTitle>Najbliższe zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak zaplanowanych zleceń.
            </p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {o.client
                          ? `${o.client.firstName} ${o.client.lastName}`
                          : 'Brak klienta'}
                        {o.scheduledAt ? ` · ${formatDate(o.scheduledAt)}` : ''}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
