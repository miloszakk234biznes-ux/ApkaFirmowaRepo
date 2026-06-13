/**
 * Plik: tests/integration/clients-invoices.test.ts
 * Cel: Testy integracyjne — fulltext klientów (tsvector + unaccent, prefiks)
 *      oraz numeracja faktur (licznik miesięczny).
 * Zależności: vitest, lib/prisma, lib/clients, lib/invoices.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listClients } from '@/lib/clients';
import { nextInvoiceNumber } from '@/lib/invoices';

let clientId: string;

beforeAll(async () => {
  const c = await prisma.client.create({
    data: { firstName: 'Łukasz', lastName: 'Żółtański', city: 'Gdańsk' },
  });
  clientId = c.id;
});

afterAll(async () => {
  await prisma.client.deleteMany({ where: { id: clientId } });
  await prisma.$disconnect();
});

describe('listClients (fulltext + unaccent)', () => {
  it('znajduje klienta mimo polskich znaków (zoltan → Żółtański)', async () => {
    const { rows } = await listClients({
      query: 'zoltan',
      page: 1,
      pageSize: 10,
      sort: 'lastName',
      order: 'asc',
    });
    expect(rows.some((r) => r.id === clientId)).toBe(true);
  });

  it('znajduje po mieście bez ogonków (gdansk → Gdańsk)', async () => {
    const { rows } = await listClients({
      query: 'gdansk',
      page: 1,
      pageSize: 10,
      sort: 'lastName',
      order: 'asc',
    });
    expect(rows.some((r) => r.id === clientId)).toBe(true);
  });
});

describe('nextInvoiceNumber', () => {
  it('zwraca numer w formacie PREFIX/NNNN/MM/RRRR', async () => {
    const date = new Date('2030-03-15T10:00:00Z');
    const number = await nextInvoiceNumber('FV', date);
    expect(number).toMatch(/^FV\/\d{4}\/03\/2030$/);
  });
});
