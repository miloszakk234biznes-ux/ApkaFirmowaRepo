/**
 * Plik: types/index.ts
 * Cel: Typy DTO współdzielone między API a UI (zlecenia, klienci, użytkownicy).
 *      Kwoty z Prisma.Decimal są serializowane do string przez JSON.
 * Zależności: @prisma/client (enumy).
 */
import type {
  OrderStatus,
  Priority,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

export interface ClientLite {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface ClientFull extends ClientLite {
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
}

export interface UserLite {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

export interface OrderListItem {
  id: string;
  title: string;
  serviceType: string | null;
  description: string | null;
  address: string | null;
  scheduledAt: string | null;
  estimatedDuration: number | null;
  status: OrderStatus;
  priority: Priority;
  amount: string;
  deposit: string;
  remainingAmount: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  isRecurring: boolean;
  recurringRule: string | null;
  notes: string | null;
  clientId: string | null;
  assignedUserId: string | null;
  client: ClientLite | null;
  assignedUser: UserLite | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryItem {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
  changedBy: { name: string | null; email: string } | null;
}

export interface OrderDetail extends OrderListItem {
  client:
    | (ClientLite & { email: string | null; address: string | null })
    | null;
  statusHistory: StatusHistoryItem[];
}

export interface OrdersResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
