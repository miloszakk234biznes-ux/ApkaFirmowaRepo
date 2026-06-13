/**
 * Plik: app/api/invoices/[id]/pdf/route.ts
 * Cel: Pobranie wygenerowanej faktury jako PDF (ADMIN).
 * Zależności: lib/prisma, lib/rbac, lib/pdf, lib/invoices.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { renderInvoicePdf } from '@/lib/pdf';
import { invoiceToPdfData } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole(Role.ADMIN);
    const inv = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!inv) {
      return NextResponse.json(
        { error: 'Faktura nie istnieje' },
        { status: 404 },
      );
    }
    const buffer = await renderInvoicePdf(invoiceToPdfData(inv));
    const filename = `${inv.number.replace(/\//g, '-')}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
