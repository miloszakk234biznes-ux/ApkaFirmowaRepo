/**
 * Plik: components/clients/client-detail.tsx
 * Cel: Karta klienta z zakładkami: Dane (+statystyki, edycja), Historia zleceń,
 *      Historia płatności (z filtrem), Notatki (edycja z datownikiem), Pliki.
 * Zależności: hooks/use-clients, components/ui/*, components/clients/*,
 *      components/shared/attachments-manager, components/orders/order-status-badge.
 * Użycie: app/(dashboard)/clients/[id]/page.tsx.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Pencil, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Role, PaymentStatus } from '@prisma/client';
import { toast } from 'sonner';
import { useClientDetail } from '@/hooks/use-clients';
import { apiRequest } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { AttachmentsManager } from '@/components/shared/attachments-manager';
import type { ClientFull } from '@/types';

const ALL = 'ALL';

export function ClientDetail({ id, role }: { id: string; role: Role }) {
  const router = useRouter();
  const { data, isLoading, mutate } = useClientDetail(id);
  const [editOpen, setEditOpen] = React.useState(false);
  const [payFilter, setPayFilter] = React.useState<string>(ALL);
  const [notes, setNotes] = React.useState('');
  const [savingNotes, setSavingNotes] = React.useState(false);

  React.useEffect(() => {
    if (data?.client) setNotes(data.client.notes ?? '');
  }, [data?.client]);

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  const { client, stats } = data;
  const orders = client.orders;
  const payments = orders.filter((o) =>
    payFilter === ALL ? true : o.paymentStatus === payFilter,
  );

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await apiRequest(`/api/clients/${id}`, 'PATCH', { notes });
      toast.success('Zapisano notatki');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSavingNotes(false);
    }
  }

  async function deleteClient() {
    if (!confirm('Usunąć klienta? Zlecenia pozostaną bez przypisania.')) return;
    try {
      await apiRequest(`/api/clients/${id}`, 'DELETE');
      toast.success('Usunięto klienta');
      router.push('/clients');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd usuwania');
    }
  }

  const clientForEdit: ClientFull & { notes: string | null } = {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    email: client.email,
    address: client.address,
    city: client.city,
    notes: client.notes,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {client.firstName} {client.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-4 w-4" /> {client.phone}
              </a>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Mail className="h-4 w-4" /> {client.email}
              </a>
            )}
            {(client.address || client.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[client.address, client.city].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edytuj
          </Button>
          {role === Role.ADMIN && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={deleteClient}
            >
              <Trash2 className="h-4 w-4" /> Usuń
            </Button>
          )}
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Liczba zleceń', value: String(stats.ordersCount) },
          { label: 'Zrealizowane', value: String(stats.doneCount) },
          { label: 'Łączna wartość', value: formatCurrency(stats.totalValue) },
          {
            label: 'Ostatnia wizyta',
            value: stats.lastVisit ? formatDate(stats.lastVisit) : '—',
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">Zlecenia</TabsTrigger>
          <TabsTrigger value="payments">Płatności</TabsTrigger>
          <TabsTrigger value="notes">Notatki</TabsTrigger>
          <TabsTrigger value="files">Pliki</TabsTrigger>
        </TabsList>

        {/* Historia zleceń */}
        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Brak zleceń tego klienta.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tytuł</TableHead>
                      <TableHead>Termin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Kwota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/orders/${o.id}`}
                            className="hover:underline"
                          >
                            {o.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {o.scheduledAt ? formatDate(o.scheduledAt) : '—'}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(o.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historia płatności */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Historia płatności</CardTitle>
              <Select value={payFilter} onValueChange={setPayFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Wszystkie</SelectItem>
                  {Object.entries(PAYMENT_STATUS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Brak płatności dla wybranego filtra.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Termin</TableHead>
                      <TableHead className="text-right">Kwota</TableHead>
                      <TableHead className="text-right">Zaliczka</TableHead>
                      <TableHead className="text-right">Pozostało</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Forma
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          {o.scheduledAt ? formatDate(o.scheduledAt) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(o.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(o.deposit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(o.remainingAmount)}
                        </TableCell>
                        <TableCell>
                          {PAYMENT_STATUS[o.paymentStatus as PaymentStatus]}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {o.paymentMethod
                            ? PAYMENT_METHOD[o.paymentMethod]
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notatki */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notatki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notatki o kliencie…"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Klient od: {formatDate(client.createdAt)}
                </p>
                <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Zapisywanie…' : 'Zapisz notatki'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pliki */}
        <TabsContent value="files">
          <Card>
            <CardContent className="pt-6">
              <AttachmentsManager endpoint={`/api/clients/${id}/attachments`} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={clientForEdit}
        onSaved={() => mutate()}
      />
    </div>
  );
}
