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

// ── CRM klientów ────────────────────────────────────────────────────────────

export interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  ordersCount: number;
  totalValue: number;
  lastVisit: string | null;
}

export interface ClientsListResponse {
  items: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClientStats {
  ordersCount: number;
  doneCount: number;
  totalValue: number;
  paidValue: number;
  lastVisit: string | null;
}

export interface ClientOrderRow {
  id: string;
  title: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amount: string;
  deposit: string;
  remainingAmount: string;
  scheduledAt: string | null;
  assignedUser: UserLite | null;
}

export interface ClientDetailResponse {
  client: ClientFull & {
    notes: string | null;
    createdAt: string;
    orders: ClientOrderRow[];
  };
  stats: ClientStats;
}

// ── Finanse ─────────────────────────────────────────────────────────────────

export interface FinanceTotals {
  revenue: number;
  expense: number;
  profit: number;
  orders: number;
}

export interface FinanceSummary {
  today: FinanceTotals;
  month: FinanceTotals;
  monthly: {
    key: string;
    label: string;
    revenue: number;
    expense: number;
    profit: number;
  }[];
  categories: { category: string; label: string; amount: number }[];
  stats: {
    avgRevenuePerOrder: number;
    avgCost: number;
    marginPct: number;
    revenueTrendPct: number | null;
  };
  goal: {
    targetRevenue: number;
    targetProfit: number;
    targetOrders: number;
    currentRevenue: number;
    currentProfit: number;
    currentOrders: number;
    remainingRevenue: number;
    ordersNeeded: number | null;
    avgOrderValue: number;
    revenuePct: number;
  } | null;
  alerts: { level: 'warning' | 'danger'; message: string }[];
}

export interface ExpenseRow {
  id: string;
  date: string;
  amount: string;
  category: string;
  description: string | null;
  paymentMethod: string | null;
  receiptPhoto: string | null;
  orderId: string | null;
}

export interface IncomeRow {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  source: string | null;
  orderId: string | null;
  order: { id: string; title: string } | null;
}

export interface GoalRow {
  id: string;
  month: number;
  year: number;
  targetRevenue: string;
  targetProfit: string;
  targetOrders: number;
}

export interface OrderCostItem {
  id: string;
  category: string;
  description: string | null;
  amount: string;
}

export interface Profitability {
  gross: number;
  costs: number;
  profit: number;
  marginPct: number;
  items: OrderCostItem[];
}
