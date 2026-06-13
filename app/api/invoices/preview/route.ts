/**
 * Plik: app/api/invoices/preview/route.ts
 * Cel: Podgląd faktury PDF z danych formularza — BEZ zapisu i numeracji (ADMIN).
 * Zależności: lib/rbac, lib/prisma, lib/validations/documents, lib/pdf.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { createInvoiceSchema } from '@/lib/validations/documents';
import { renderInvoicePdf } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requireRole(Role.ADMIN);
    const parsed = createInvoiceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const company = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    const buffer = await renderInvoicePdf({
      number: 'PODGLĄD',
      type: d.type,
      issueDate: d.issueDate ? new Date(d.issueDate) : new Date(),
      saleDate: d.saleDate ? new Date(d.saleDate) : new Date(),
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      seller: {
        name: company?.name ?? '(brak danych firmy)',
        nip: company?.nip,
        address: company?.address,
        postalCode: company?.postalCode,
        city: company?.city,
        bankAccount: company?.bankAccount,
      },
      buyerName: d.buyerName,
      buyerNip: d.buyerNip,
      buyerAddress: d.buyerAddress,
      items: d.items,
      paymentMethod: d.paymentMethod,
      notes: d.notes,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'application/pdf' },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
