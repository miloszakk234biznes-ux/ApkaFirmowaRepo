/**
 * Plik: app/api/reports/finance/route.ts
 * Cel: Eksport rocznego raportu finansowego (ADMIN) do PDF lub XLSX.
 *      Parametry: ?year=YYYY&format=pdf|xlsx.
 * Zależności: lib/rbac, lib/finance, lib/pdf, lib/excel.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { getYearlyReport } from '@/lib/finance';
import { renderFinancialReportPdf } from '@/lib/pdf';
import { buildFinanceReportWorkbook } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireRole(Role.ADMIN);
    const sp = new URL(req.url).searchParams;
    const year = Number(sp.get('year')) || new Date().getFullYear();
    const format = sp.get('format') === 'xlsx' ? 'xlsx' : 'pdf';

    const report = await getYearlyReport(year);
    const title = `Raport finansowy ${year}`;

    if (format === 'xlsx') {
      const buffer = await buildFinanceReportWorkbook({
        title,
        rows: report.rows,
        totals: report.totals,
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="raport-${year}.xlsx"`,
        },
      });
    }

    const buffer = await renderFinancialReportPdf({
      title,
      periodLabel: `Rok ${year}`,
      rows: report.rows,
      totals: report.totals,
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="raport-${year}.pdf"`,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
