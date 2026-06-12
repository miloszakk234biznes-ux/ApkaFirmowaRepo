/**
 * Plik: lib/clients.ts
 * Cel: Logika domenowa CRM — budowa zapytania fulltext (tsquery prefiksowy),
 *      wyszukiwanie listy klientów z agregatami (liczba zleceń, suma wartości,
 *      ostatnia wizyta) oraz statystyki pojedynczego klienta.
 * Zależności: lib/prisma, @prisma/client (Prisma.sql).
 */
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Buduje prefiksowe zapytanie tsquery z frazy użytkownika (konfiguracja 'simple').
 * Zwraca null dla pustej frazy. Przykład: "kow jan" → "kow:* & jan:*".
 */
export function buildTsQuery(input?: string | null): string | null {
  if (!input) return null;
  const terms = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // usuń znaki specjalne (ochrona przed injekcją tsquery)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${t}:*`);
  return terms.length ? terms.join(' & ') : null;
}

export interface ClientListRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  ordersCount: number;
  totalValue: number;
  lastVisit: Date | null;
}

/**
 * Lista klientów z agregatami i fulltext. Zwraca wiersze + łączną liczbę
 * pasujących klientów (do paginacji). Sortowanie: ostatnia wizyta / nazwisko.
 */
export async function listClients(params: {
  query?: string | null;
  page: number;
  pageSize: number;
  sort: 'lastName' | 'lastVisit' | 'ordersCount' | 'totalValue';
  order: 'asc' | 'desc';
}): Promise<{ rows: ClientListRow[]; total: number }> {
  const tsquery = buildTsQuery(params.query);
  const offset = (params.page - 1) * params.pageSize;

  // Whitelist kolumn sortowania (zapobiega injekcji w ORDER BY).
  const sortColumn = {
    lastName: 'c."lastName"',
    lastVisit: '"lastVisit"',
    ordersCount: '"ordersCount"',
    totalValue: '"totalValue"',
  }[params.sort];
  const orderBy = Prisma.raw(
    `${sortColumn} ${params.order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`,
  );

  const whereClause = tsquery
    ? Prisma.sql`WHERE c."searchVector" @@ to_tsquery('simple', public.unaccent(${tsquery}))`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    (ClientListRow & { fullCount: bigint })[]
  >`
    SELECT
      c.id, c."firstName", c."lastName", c.phone, c.email, c.city, c.address,
      COUNT(o.id)::int AS "ordersCount",
      COALESCE(SUM(o.amount), 0)::float AS "totalValue",
      MAX(o."scheduledAt") AS "lastVisit",
      COUNT(*) OVER()::bigint AS "fullCount"
    FROM "Client" c
    LEFT JOIN "Order" o ON o."clientId" = c.id
    ${whereClause}
    GROUP BY c.id
    ORDER BY ${orderBy}
    LIMIT ${params.pageSize} OFFSET ${offset}
  `;

  const total = rows.length > 0 ? Number(rows[0]!.fullCount) : 0;
  const cleaned: ClientListRow[] = rows.map(({ fullCount: _f, ...r }) => r);
  return { rows: cleaned, total };
}

/** Statystyki pojedynczego klienta (do karty klienta). */
export async function clientStats(clientId: string): Promise<{
  ordersCount: number;
  doneCount: number;
  totalValue: number;
  paidValue: number;
  lastVisit: Date | null;
}> {
  const agg = await prisma.order.aggregate({
    where: { clientId },
    _count: { _all: true },
    _sum: { amount: true },
    _max: { scheduledAt: true },
  });
  const done = await prisma.order.aggregate({
    where: { clientId, status: 'DONE' },
    _count: { _all: true },
  });
  const paid = await prisma.order.aggregate({
    where: { clientId, paymentStatus: 'PAID' },
    _sum: { amount: true },
  });

  return {
    ordersCount: agg._count._all,
    doneCount: done._count._all,
    totalValue: Number(agg._sum.amount ?? 0),
    paidValue: Number(paid._sum.amount ?? 0),
    lastVisit: agg._max.scheduledAt ?? null,
  };
}
