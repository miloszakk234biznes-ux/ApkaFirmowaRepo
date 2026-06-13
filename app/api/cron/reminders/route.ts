/**
 * Plik: app/api/cron/reminders/route.ts
 * Cel: Zadanie przypomnień (cron) — powiadomienia o zleceniach na jutro oraz o
 *      zleceniach nieopłaconych po 24h. Tworzy powiadomienia in-app (+push),
 *      wysyła e-mail/SMS do klienta (jeśli skonfigurowane). Autoryzacja: nagłówek
 *      `Authorization: Bearer CRON_SECRET` lub sesja administratora.
 * Zależności: lib/prisma, lib/auth, lib/notifications, lib/email, lib/twilio.
 */
import { NextResponse } from 'next/server';
import { addDays, startOfDay, endOfDay, subHours } from 'date-fns';
import { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notifyUser } from '@/lib/notifications';
import { sendMail } from '@/lib/email';
import { sendSms } from '@/lib/twilio';

async function authorize(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get('authorization');
  if (secret && header === `Bearer ${secret}`) return true;
  const session = await auth();
  return session?.user?.role === 'ADMIN';
}

export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = addDays(now, 1);

  // 1) Zlecenia zaplanowane na jutro → przypomnienie pracownikowi + klientowi.
  const upcoming = await prisma.order.findMany({
    where: {
      scheduledAt: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.DONE] },
    },
    include: { client: true },
  });

  let reminded = 0;
  for (const o of upcoming) {
    if (o.assignedUserId) {
      await notifyUser({
        userId: o.assignedUserId,
        type: 'ORDER_REMINDER',
        title: 'Przypomnienie o zleceniu',
        message: `Jutro: ${o.title}${o.scheduledAt ? ` o ${o.scheduledAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}` : ''}`,
        url: `/orders/${o.id}`,
      });
      reminded++;
    }
    // E-mail / SMS do klienta (opcjonalnie).
    if (o.client?.email) {
      await sendMail({
        to: o.client.email,
        subject: 'Przypomnienie o wizycie — jutro',
        html: `<p>Dzień dobry, przypominamy o jutrzejszej wizycie: <b>${o.title}</b>.</p>`,
        text: `Przypomnienie o jutrzejszej wizycie: ${o.title}.`,
      }).catch(() => {});
    }
    if (o.client?.phone) {
      await sendSms(
        o.client.phone,
        `Przypomnienie: jutro wizyta "${o.title}". Pozdrawiamy.`,
      ).catch(() => {});
    }
  }

  // 2) Zlecenia nieopłacone po 24h od realizacji → alert dla administratorów.
  const unpaid = await prisma.order.findMany({
    where: {
      status: OrderStatus.DONE,
      paymentStatus: { not: 'PAID' },
      updatedAt: { lt: subHours(now, 24) },
    },
    take: 50,
  });
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', active: true },
    select: { id: true },
  });
  let unpaidAlerts = 0;
  for (const o of unpaid) {
    for (const a of admins) {
      await notifyUser({
        userId: a.id,
        type: 'ORDER_UNPAID',
        title: 'Nieopłacone zlecenie',
        message: `Zlecenie "${o.title}" pozostaje nieopłacone.`,
        url: `/orders/${o.id}`,
      });
    }
    unpaidAlerts++;
  }

  return NextResponse.json({
    upcomingReminders: reminded,
    unpaidAlerts,
  });
}
