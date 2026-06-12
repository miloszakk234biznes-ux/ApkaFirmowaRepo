/**
 * Plik: app/(dashboard)/clients/[id]/page.tsx
 * Cel: Strona karty klienta — weryfikuje istnienie klienta i sesję, renderuje
 *      interaktywną kartę z zakładkami (ClientDetail).
 * Zależności: lib/auth, lib/prisma, components/clients/client-detail.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ClientDetail } from '@/components/clients/client-detail';

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const exists = await prisma.client.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/clients">
          <ArrowLeft className="h-4 w-4" /> Klienci
        </Link>
      </Button>
      <ClientDetail id={params.id} role={session.user.role as Role} />
    </div>
  );
}
