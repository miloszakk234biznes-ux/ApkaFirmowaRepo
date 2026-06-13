/**
 * Plik: app/api/clients/export/route.ts
 * Cel: Eksport listy klientów do XLSX (z uwzględnieniem aktualnego wyszukiwania).
 * Zależności: lib/rbac, lib/clients, lib/excel.
 */
import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { listClients } from '@/lib/clients';
import { buildClientsWorkbook } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireAuth();
    const q = new URL(req.url).searchParams.get('q');

    // Eksportujemy do 5000 pasujących klientów.
    const { rows } = await listClients({
      query: q,
      page: 1,
      pageSize: 5000,
      sort: 'lastName',
      order: 'asc',
    });

    const buffer = await buildClientsWorkbook(rows);
    const filename = `klienci-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
