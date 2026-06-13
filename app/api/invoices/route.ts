/**
 * Plik: app/api/invoices/route.ts
 * Cel: Faktury (ADMIN) — lista (GET) oraz wystawienie (POST: numeracja, zrzut
 *      danych sprzedawcy, wyliczenie kwot, zapis). Walidacja Zod, audit log.
 * Zależności: lib/prisma, lib/rbac, lib/validations/documents, lib/invoice-calc,
 *      lib/invoices, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { createInvoiceSchema } from '@/lib/validations/documents';
import { computeInvoice } from '@/lib/invoice-calc';
import { nextInvoiceNumber } from '@/lib/invoices';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireRole(Role.ADMIN);
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, Number(sp.get('page') ?? 1));
    const pageSize = 20;

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: { select: { firstName: true, lastName: true } },
          order: { select: { id: true, title: true } },
        },
      }),
      prisma.invoice.count(),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(Role.ADMIN);
    const parsed = createInvoiceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;

    const company =
      (await prisma.companySettings.findUnique({ where: { id: 'default' } })) ??
      null;
    if (!company || !company.name) {
      return NextResponse.json(
        {
          error:
            'Uzupełnij dane firmy w Ustawieniach przed wystawieniem faktury.',
        },
        { status: 400 },
      );
    }

    const totals = computeInvoice(d.items);
    const issueDate = d.issueDate ? new Date(d.issueDate) : new Date();
    const number = await nextInvoiceNumber(company.invoicePrefix, issueDate);

    const seller = {
      name: company.name,
      nip: company.nip,
      address: company.address,
      postalCode: company.postalCode,
      city: company.city,
      bankAccount: company.bankAccount,
      email: company.email,
      phone: company.phone,
    };

    const invoice = await prisma.invoice.create({
      data: {
        number,
        type: d.type,
        clientId: d.clientId,
        orderId: d.orderId,
        createdById: session.user.id,
        issueDate,
        saleDate: d.saleDate ? new Date(d.saleDate) : issueDate,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        vatRate: d.items[0]?.vatRate ?? 23,
        netAmount: new Prisma.Decimal(totals.net),
        vatAmount: new Prisma.Decimal(totals.vat),
        grossAmount: new Prisma.Decimal(totals.gross),
        buyerName: d.buyerName,
        buyerNip: d.buyerNip,
        buyerAddress: d.buyerAddress,
        seller,
        items: d.items,
        paymentMethod: d.paymentMethod,
        notes: d.notes,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'INVOICE_CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: number,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
