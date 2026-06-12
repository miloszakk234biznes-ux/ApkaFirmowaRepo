/**
 * Plik: lib/excel.ts
 * Cel: Generowanie plików XLSX (ExcelJS). W Etapie 4 — export listy klientów;
 *      rozszerzane o raporty finansowe w Etapie 6.
 * Zależności: exceljs.
 */
import ExcelJS from 'exceljs';
import type { ClientListRow } from '@/lib/clients';

/** Buduje skoroszyt XLSX z listą klientów i zwraca bufor. */
export async function buildClientsWorkbook(
  rows: ClientListRow[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ApkaFirmowa';
  wb.created = new Date();
  const ws = wb.addWorksheet('Klienci');

  ws.columns = [
    { header: 'Imię', key: 'firstName', width: 18 },
    { header: 'Nazwisko', key: 'lastName', width: 22 },
    { header: 'Telefon', key: 'phone', width: 16 },
    { header: 'E-mail', key: 'email', width: 26 },
    { header: 'Miasto', key: 'city', width: 16 },
    { header: 'Adres', key: 'address', width: 28 },
    { header: 'Liczba zleceń', key: 'ordersCount', width: 14 },
    { header: 'Łączna wartość (zł)', key: 'totalValue', width: 18 },
    { header: 'Ostatnia wizyta', key: 'lastVisit', width: 18 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const r of rows) {
    ws.addRow({
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone ?? '',
      email: r.email ?? '',
      city: r.city ?? '',
      address: r.address ?? '',
      ordersCount: r.ordersCount,
      totalValue: r.totalValue,
      lastVisit: r.lastVisit
        ? new Date(r.lastVisit).toLocaleDateString('pl-PL')
        : '',
    });
  }
  ws.getColumn('totalValue').numFmt = '#,##0.00';

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
