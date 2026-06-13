/**
 * Plik: components/documents/reports-tabs.tsx
 * Cel: Zakładki sekcji raportów (ADMIN) — Faktury (wystawianie + lista),
 *      Raporty (eksport roczny PDF/XLSX) oraz Dane firmy.
 * Zależności: components/documents/*, components/ui/*.
 */
'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvoiceForm } from '@/components/documents/invoice-form';
import { InvoicesList } from '@/components/documents/invoices-list';
import { CompanyForm } from '@/components/documents/company-form';

export function ReportsTabs() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [year, setYear] = React.useState(new Date().getFullYear());

  return (
    <Tabs defaultValue="invoices" className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="invoices">Faktury</TabsTrigger>
        <TabsTrigger value="reports">Raporty</TabsTrigger>
        <TabsTrigger value="company">Dane firmy</TabsTrigger>
      </TabsList>

      <TabsContent value="invoices" className="space-y-4">
        <InvoiceForm onSaved={() => setRefreshKey((k) => k + 1)} />
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Wystawione dokumenty
          </h3>
          <InvoicesList refreshKey={refreshKey} />
        </div>
      </TabsContent>

      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Eksport raportu finansowego
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="year">Rok</Label>
                <Input
                  id="year"
                  type="number"
                  className="w-28"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <Button asChild variant="outline">
                <a href={`/api/reports/finance?year=${year}&format=pdf`}>
                  <Download className="h-4 w-4" /> PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/api/reports/finance?year=${year}&format=xlsx`}>
                  <Download className="h-4 w-4" /> XLSX
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Raport zawiera miesięczne przychody, koszty i zysk za wybrany rok.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="company">
        <CompanyForm />
      </TabsContent>
    </Tabs>
  );
}
