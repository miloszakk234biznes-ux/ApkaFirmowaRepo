/**
 * Plik: lib/audit.ts
 * Cel: Pomocnik do zapisywania wpisów w dzienniku audytu (AuditLog) dla
 *      operacji krytycznych: logowanie, usunięcie zlecenia, zmiany finansowe.
 * Zależności: lib/prisma.
 */
import { prisma } from '@/lib/prisma';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ip?: string;
}

/**
 * Zapisuje wpis audytu. Błędy są logowane, ale nie przerywają głównej operacji
 * (audyt nie może blokować logiki biznesowej).
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: input.details,
        ip: input.ip,
      },
    });
  } catch (error) {
    console.error('[audit] Nie udało się zapisać wpisu audytu:', error);
  }
}
