/**
 * Plik: app/(dashboard)/orders/new/page.tsx
 * Cel: Dedykowana strona tworzenia zlecenia (pełny formularz poza modalem).
 * Zależności: lib/auth, components/orders/order-form-page, components/ui/card.
 */
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';
import { OrderFormPage } from '@/components/orders/order-form-page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function NewOrderPage() {
  const session = await auth();
  const role = session?.user?.role ?? Role.EMPLOYEE;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nowe zlecenie</CardTitle>
          <CardDescription>
            Wypełnij dane zlecenia. Pola oznaczone * są wymagane.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderFormPage role={role} />
        </CardContent>
      </Card>
    </div>
  );
}
