/**
 * Plik: tests/integration/finance.test.ts
 * Cel: Testy integracyjne logiki finansowej na prawdziwej bazie — automatyczny
 *      przychód przy DONE (i jego usuwanie) oraz rentowność zlecenia.
 * Zależności: vitest, lib/prisma, lib/finance. Wymaga DATABASE_URL.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncOrderIncome, orderProfitability } from '@/lib/finance';
import { Prisma } from '@prisma/client';

const created: string[] = [];

async function makeOrder(status: 'NEW' | 'DONE', amount = 500) {
  const o = await prisma.order.create({
    data: {
      title: 'IT-test',
      status,
      amount: new Prisma.Decimal(amount),
    },
  });
  created.push(o.id);
  return o;
}

afterAll(async () => {
  await prisma.income.deleteMany({ where: { orderId: { in: created } } });
  await prisma.orderCost.deleteMany({ where: { orderId: { in: created } } });
  await prisma.order.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
});

describe('syncOrderIncome', () => {
  it('tworzy automatyczny przychód przy DONE', async () => {
    const order = await makeOrder('DONE', 500);
    await syncOrderIncome(order);
    const inc = await prisma.income.findFirst({
      where: { orderId: order.id, source: 'AUTO_ORDER' },
    });
    expect(inc).not.toBeNull();
    expect(Number(inc!.amount)).toBe(500);
  });

  it('usuwa automatyczny przychód po zmianie statusu z DONE', async () => {
    const order = await makeOrder('DONE', 300);
    await syncOrderIncome(order);
    const reverted = { ...order, status: 'NEW' as const };
    await syncOrderIncome(reverted);
    const inc = await prisma.income.findFirst({
      where: { orderId: order.id, source: 'AUTO_ORDER' },
    });
    expect(inc).toBeNull();
  });
});

describe('orderProfitability', () => {
  it('liczy zysk = brutto − koszty oraz marżę %', async () => {
    const order = await makeOrder('NEW', 500);
    await prisma.orderCost.create({
      data: {
        orderId: order.id,
        category: 'Materiały',
        amount: new Prisma.Decimal(150),
      },
    });
    const p = await orderProfitability(order.id);
    expect(p).not.toBeNull();
    expect(p!.gross).toBe(500);
    expect(p!.costs).toBe(150);
    expect(p!.profit).toBe(350);
    expect(Math.round(p!.marginPct)).toBe(70);
  });
});
