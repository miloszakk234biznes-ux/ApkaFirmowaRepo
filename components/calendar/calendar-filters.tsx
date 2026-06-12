/**
 * Plik: components/calendar/calendar-filters.tsx
 * Cel: Filtry kalendarza — status, typ usługi oraz (dla admina) pracownik.
 * Zależności: components/ui/select, hooks/use-users, lib/constants.
 */
'use client';

import { Role } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/use-users';
import { ORDER_STATUS_OPTIONS, SERVICE_TYPES } from '@/lib/constants';

export interface CalendarFilterState {
  status: string;
  serviceType: string;
  assignedUserId: string;
}

const ALL = 'ALL';

export function CalendarFilters({
  role,
  value,
  onChange,
}: {
  role: Role;
  value: CalendarFilterState;
  onChange: (next: CalendarFilterState) => void;
}) {
  const isAdmin = role === Role.ADMIN;
  const { users } = useUsers(isAdmin);

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={value.status}
        onValueChange={(v) => onChange({ ...value, status: v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Wszystkie statusy</SelectItem>
          {ORDER_STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.serviceType}
        onValueChange={(v) => onChange({ ...value, serviceType: v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Wszystkie usługi</SelectItem>
          {SERVICE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isAdmin && (
        <Select
          value={value.assignedUserId}
          onValueChange={(v) => onChange({ ...value, assignedUserId: v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Wszyscy pracownicy</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name ?? u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
