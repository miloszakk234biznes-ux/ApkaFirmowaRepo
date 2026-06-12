/**
 * Plik: app/api/orders/route.ts
 * Cel: Lista zleceń (GET, z filtrami/paginacją/sortem/wyszukiwaniem, RBAC scope)
 *      oraz tworzenie zlecenia (POST, walidacja Zod, obsługa klienta istniejącego
 *      lub nowego, wyliczenie kwot, wpis historii statusu i audytu).
 * Zależności: lib/prisma, lib/rbac, lib/orders, lib/validations/order, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import {
  scopeForUser,
  orderInclude,
  computeRemaining,
  recordStatusChange,
} from '@/lib/orders';
import { createOrderSchema, orderQuerySchema } from '@/lib/validations/order';
import { createAuditLog } from '@/lib/audit';
import { syncOrderToGoogle } from '@/lib/google-calendar';

// GET /api/orders — lista z filtrami.
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const parsed = orderQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe parametry', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const q = parsed.data;

    const where: Prisma.OrderWhereInput = { ...scopeForUser(session) };
    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;
    if (q.serviceType) where.serviceType = q.serviceType;
    // Filtr po pracowniku dostępny tylko dla admina (pracownik jest już zawężony).
    if (q.assignedUserId && session.user.role === Role.ADMIN) {
      where.assignedUserId = q.assignedUserId;
    }
    if (q.from || q.to) {
      where.scheduledAt = {};
      if (q.from) where.scheduledAt.gte = new Date(q.from);
      if (q.to) where.scheduledAt.lte = new Date(q.to);
    }
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: 'insensitive' } },
        { address: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
        {
          client: {
            is: {
              OR: [
                { firstName: { contains: q.q, mode: 'insensitive' } },
                { lastName: { contains: q.q, mode: 'insensitive' } },
                { phone: { contains: q.q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { [q.sort]: q.order },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/orders — utwórz zlecenie.
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;

    // Ustal klienta: istniejący lub nowy (dedupe po telefonie).
    let clientId = d.clientId ?? null;
    if (!clientId && d.clientLastName && d.clientFirstName) {
      if (d.clientPhone) {
        const existing = await prisma.client.findFirst({
          where: { phone: d.clientPhone },
        });
        clientId = existing?.id ?? null;
      }
      if (!clientId) {
        const created = await prisma.client.create({
          data: {
            firstName: d.clientFirstName,
            lastName: d.clientLastName,
            phone: d.clientPhone,
            address: d.address,
          },
        });
        clientId = created.id;
      }
    }

    // RBAC: pracownik może przypisać zlecenie tylko do siebie.
    const assignedUserId =
      session.user.role === Role.ADMIN
        ? (d.assignedUserId ?? null)
        : session.user.id;

    const remainingAmount = computeRemaining(d.amount, d.deposit);

    const order = await prisma.order.create({
      data: {
        title: d.title,
        clientId,
        assignedUserId,
        serviceType: d.serviceType,
        description: d.description,
        address: d.address,
        scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
        estimatedDuration: d.estimatedDuration,
        status: d.status,
        priority: d.priority,
        amount: new Prisma.Decimal(d.amount),
        deposit: new Prisma.Decimal(d.deposit),
        remainingAmount: new Prisma.Decimal(remainingAmount),
        paymentMethod: d.paymentMethod,
        paymentStatus: d.paymentStatus,
        isRecurring: d.isRecurring,
        recurringRule: d.recurringRule,
        notes: d.notes,
      },
      include: orderInclude,
    });

    await recordStatusChange({
      orderId: order.id,
      fromStatus: null,
      toStatus: order.status,
      changedById: session.user.id,
      note: 'Utworzenie zlecenia',
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'ORDER_CREATE',
      entity: 'Order',
      entityId: order.id,
    });

    // Synchronizacja z Google Calendar (no-op, gdy brak konfiguracji/połączenia).
    await syncOrderToGoogle(order, session.user.id);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
