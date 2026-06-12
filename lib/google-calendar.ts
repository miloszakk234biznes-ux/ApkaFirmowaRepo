/**
 * Plik: lib/google-calendar.ts
 * Cel: Warstwa integracji z Google Calendar API v3 — OAuth2 (URL zgody, wymiana
 *      kodu), zarządzanie tokenami (auto-refresh + zapis), listowanie kalendarzy,
 *      tworzenie/aktualizacja/usuwanie eventów oraz wysokopoziomowa synchronizacja
 *      zlecenia (`syncOrderToGoogle`) używana w hookach CRUD. Zawiera retry z
 *      wykładniczym backoffem.
 * Zależności: googleapis, lib/prisma, lib/crypto, @prisma/client.
 *
 * Konfiguracja (Google Cloud Console — patrz docs/GOOGLE_CALENDAR.md):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL (do redirect URI).
 */
import { google, type calendar_v3 } from 'googleapis';
import { Order, GoogleSyncStatus, OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';

// Typ klienta OAuth2 wyprowadzony z googleapis, by uniknąć konfliktu dwóch
// kopii google-auth-library (googleapis-common ma własną).
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE ?? 'Europe/Warsaw';

/** Czy integracja jest skonfigurowana (są dane OAuth). */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

/** Bazowy URL aplikacji (do redirect URI i webhooków). */
export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
}

function getRedirectUri(): string {
  return `${getBaseUrl()}/api/google-calendar/callback`;
}

/** Tworzy klienta OAuth2 (bez ustawionych credentials). */
export function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(),
  );
}

/** Buduje URL zgody Google (offline → otrzymujemy refresh token). */
export function getAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // wymusza refresh token przy ponownym łączeniu
    scope: SCOPES,
    state,
  });
}

/**
 * Wymienia kod autoryzacyjny na tokeny i zapisuje połączenie dla użytkownika.
 * Refresh token jest szyfrowany przed zapisem.
 */
export async function exchangeCodeAndStore(
  userId: string,
  code: string,
): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  // Pobierz e-mail konta Google (informacyjnie).
  let googleEmail: string | null = null;
  try {
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const me = await oauth2.userinfo.get();
    googleEmail = me.data.email ?? null;
  } catch {
    // brak zakresu profilu — pomijamy
  }

  const refreshTokenEnc = tokens.refresh_token
    ? encrypt(tokens.refresh_token)
    : undefined;

  await prisma.googleCalendarConnection.upsert({
    where: { userId },
    create: {
      userId,
      googleEmail,
      accessToken: tokens.access_token ?? null,
      refreshTokenEnc: refreshTokenEnc ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      calendarId: 'primary',
    },
    update: {
      googleEmail,
      accessToken: tokens.access_token ?? null,
      // Zachowaj istniejący refresh token, jeśli Google nie zwrócił nowego.
      ...(refreshTokenEnc ? { refreshTokenEnc } : {}),
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });
}

/**
 * Zwraca autoryzowany klient OAuth2 dla użytkownika z odświeżaniem tokenu.
 * Nowe tokeny są utrwalane w bazie. Zwraca null, gdy brak połączenia/refresh tokenu.
 */
async function getAuthorizedClient(
  userId: string,
): Promise<{ client: OAuth2Client; calendarId: string } | null> {
  const conn = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  if (!conn || !conn.refreshTokenEnc) return null;

  const refreshToken = decrypt(conn.refreshTokenEnc);
  if (!refreshToken) return null;

  const client = createOAuthClient();
  client.setCredentials({
    access_token: conn.accessToken ?? undefined,
    refresh_token: refreshToken,
    expiry_date: conn.expiryDate ? conn.expiryDate.getTime() : undefined,
  });

  // Utrwalaj odświeżone tokeny.
  client.on('tokens', (tokens) => {
    void prisma.googleCalendarConnection
      .update({
        where: { userId },
        data: {
          accessToken: tokens.access_token ?? conn.accessToken,
          expiryDate: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : conn.expiryDate,
          ...(tokens.refresh_token
            ? { refreshTokenEnc: encrypt(tokens.refresh_token) }
            : {}),
        },
      })
      .catch(() => {});
  });

  return { client, calendarId: conn.calendarId ?? 'primary' };
}

/** Klient Calendar API dla użytkownika (lub null). */
async function getCalendar(
  userId: string,
): Promise<{ calendar: calendar_v3.Calendar; calendarId: string } | null> {
  const authorized = await getAuthorizedClient(userId);
  if (!authorized) return null;
  return {
    calendar: google.calendar({ version: 'v3', auth: authorized.client }),
    calendarId: authorized.calendarId,
  };
}

/** Lista kalendarzy użytkownika (do wyboru docelowego). */
export async function listCalendars(
  userId: string,
): Promise<{ id: string; summary: string; primary: boolean }[]> {
  const ctx = await getCalendar(userId);
  if (!ctx) throw new Error('Brak połączenia z Google Calendar');
  const res = await ctx.calendar.calendarList.list();
  return (res.data.items ?? []).map((c) => ({
    id: c.id ?? '',
    summary: c.summary ?? c.id ?? '',
    primary: Boolean(c.primary),
  }));
}

/** Retry z wykładniczym backoffem (na chwilowe błędy 5xx/429/sieć). */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = (err as { code?: number; status?: number })?.code;
      // Nie ponawiaj błędów klienta (4xx poza 429).
      if (status && status >= 400 && status < 500 && status !== 429) throw err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2 ** i * 500));
      }
    }
  }
  throw lastErr;
}

/** Buduje zasób eventu Google na podstawie zlecenia. */
function buildEvent(order: Order): calendar_v3.Schema$Event {
  const start = order.scheduledAt!;
  const durationMin = order.estimatedDuration ?? 60;
  const end = new Date(start.getTime() + durationMin * 60_000);

  const descriptionParts = [
    order.description ?? '',
    `Status: ${order.status}`,
    order.notes ? `Notatki: ${order.notes}` : '',
  ].filter(Boolean);

  return {
    summary: order.title,
    description: descriptionParts.join('\n'),
    location: order.address ?? undefined,
    start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
    extendedProperties: { private: { appOrderId: order.id } },
  };
}

/**
 * Synchronizuje zlecenie z Google Calendar użytkownika docelowego
 * (przypisany pracownik lub — gdy brak — wykonujący akcję). Aktualizuje pola
 * google* zlecenia. Nigdy nie rzuca — błędy zapisuje w googleSyncError.
 */
export async function syncOrderToGoogle(
  order: Order,
  actingUserId: string,
): Promise<void> {
  if (!isGoogleConfigured()) return;

  const targetUserId = order.assignedUserId ?? actingUserId;
  const ctx = await getCalendar(targetUserId);

  // Brak połączenia → nic nie synchronizujemy.
  if (!ctx) {
    if (order.googleSyncStatus !== GoogleSyncStatus.NONE) {
      await prisma.order.update({
        where: { id: order.id },
        data: { googleSyncStatus: GoogleSyncStatus.NONE },
      });
    }
    return;
  }

  const { calendar, calendarId } = ctx;

  try {
    // Anulowane lub bez terminu → usuń istniejący event.
    const shouldRemove =
      order.status === OrderStatus.CANCELLED || !order.scheduledAt;

    if (shouldRemove) {
      if (order.googleCalendarEventId) {
        await withRetry(() =>
          calendar.events.delete({
            calendarId: order.googleCalendarId ?? calendarId,
            eventId: order.googleCalendarEventId!,
          }),
        );
      }
      await prisma.order.update({
        where: { id: order.id },
        data: {
          googleCalendarEventId: null,
          googleCalendarId: null,
          googleSyncStatus: GoogleSyncStatus.SYNCED,
          googleSyncedAt: new Date(),
          googleSyncError: null,
        },
      });
      return;
    }

    let eventId = order.googleCalendarEventId;
    if (eventId) {
      await withRetry(() =>
        calendar.events.update({
          calendarId: order.googleCalendarId ?? calendarId,
          eventId: eventId!,
          requestBody: buildEvent(order),
        }),
      );
    } else {
      const res = await withRetry(() =>
        calendar.events.insert({
          calendarId,
          requestBody: buildEvent(order),
        }),
      );
      eventId = res.data.id ?? null;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        googleCalendarEventId: eventId,
        googleCalendarId: calendarId,
        googleSyncStatus: GoogleSyncStatus.SYNCED,
        googleSyncedAt: new Date(),
        googleSyncError: null,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Nieznany błąd synchronizacji';
    await prisma.order.update({
      where: { id: order.id },
      data: {
        googleSyncStatus: GoogleSyncStatus.ERROR,
        googleSyncError: message.slice(0, 500),
      },
    });
  }
}

/**
 * Włącza powiadomienia push (events.watch) dla wybranego kalendarza użytkownika.
 * Wymaga publicznego HTTPS (adres webhooka). Zapisuje kanał + seeduje syncToken.
 */
export async function startWatch(userId: string): Promise<void> {
  const ctx = await getCalendar(userId);
  if (!ctx) throw new Error('Brak połączenia z Google Calendar');

  const channelId = `gcal-${userId}-${Date.now()}`;
  const address = `${getBaseUrl()}/api/google-calendar/webhook`;

  const res = await ctx.calendar.events.watch({
    calendarId: ctx.calendarId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address,
      token: process.env.GOOGLE_WEBHOOK_TOKEN ?? undefined,
    },
  });

  // Zainicjuj syncToken (pełne listowanie → nextSyncToken).
  let syncToken: string | undefined;
  try {
    let pageToken: string | undefined;
    do {
      const list = await ctx.calendar.events.list({
        calendarId: ctx.calendarId,
        singleEvents: true,
        showDeleted: true,
        maxResults: 2500,
        pageToken,
      });
      pageToken = list.data.nextPageToken ?? undefined;
      if (list.data.nextSyncToken) syncToken = list.data.nextSyncToken;
    } while (pageToken);
  } catch {
    // brak syncTokenu — webhook zrobi pełną synchronizację
  }

  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      channelId,
      resourceId: res.data.resourceId ?? null,
      channelExpiration: res.data.expiration
        ? new Date(Number(res.data.expiration))
        : null,
      syncToken: syncToken ?? null,
    },
  });
}

/** Zatrzymuje kanał push (jeśli aktywny). */
export async function stopWatch(userId: string): Promise<void> {
  const conn = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  if (!conn?.channelId || !conn.resourceId) return;
  const authorized = await getAuthorizedClient(userId);
  if (!authorized) return;
  const calendar = google.calendar({ version: 'v3', auth: authorized.client });
  try {
    await calendar.channels.stop({
      requestBody: { id: conn.channelId, resourceId: conn.resourceId },
    });
  } catch {
    // ignoruj
  }
  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: { channelId: null, resourceId: null, channelExpiration: null },
  });
}

/**
 * Synchronizacja przyrostowa Google → aplikacja (wywoływana z webhooka).
 * Dla zmienionych eventów powiązanych ze zleceniami aktualizuje termin/status:
 *  - event usunięty/anulowany → zlecenie CANCELLED,
 *  - zmiana czasu startu → aktualizacja scheduledAt.
 */
export async function processIncrementalSync(channelId: string): Promise<void> {
  const conn = await prisma.googleCalendarConnection.findFirst({
    where: { channelId },
  });
  if (!conn) return;

  const ctx = await getCalendar(conn.userId);
  if (!ctx) return;

  async function listChanges(useSyncToken: boolean) {
    return ctx!.calendar.events.list({
      calendarId: ctx!.calendarId,
      singleEvents: true,
      showDeleted: true,
      ...(useSyncToken && conn!.syncToken
        ? { syncToken: conn!.syncToken }
        : { timeMin: new Date().toISOString() }),
    });
  }

  let data: calendar_v3.Schema$Events;
  try {
    data = (await listChanges(true)).data;
  } catch (err) {
    // 410 Gone → syncToken nieważny, robimy pełne listowanie.
    if ((err as { code?: number }).code === 410) {
      data = (await listChanges(false)).data;
    } else {
      throw err;
    }
  }

  for (const event of data.items ?? []) {
    const orderId = event.extendedProperties?.private?.appOrderId;
    if (!orderId) continue;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) continue;

    if (event.status === 'cancelled') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          googleCalendarEventId: null,
          googleSyncStatus: GoogleSyncStatus.SYNCED,
          googleSyncedAt: new Date(),
        },
      });
      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          note: 'Anulowano w Google Calendar',
        },
      });
      continue;
    }

    // Aktualizacja terminu, jeśli zmieniony w Google.
    const startIso = event.start?.dateTime;
    if (startIso) {
      const newStart = new Date(startIso);
      if (
        !order.scheduledAt ||
        order.scheduledAt.getTime() !== newStart.getTime()
      ) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            scheduledAt: newStart,
            googleSyncStatus: GoogleSyncStatus.SYNCED,
            googleSyncedAt: new Date(),
          },
        });
      }
    }
  }

  if (data.nextSyncToken) {
    await prisma.googleCalendarConnection.update({
      where: { userId: conn.userId },
      data: { syncToken: data.nextSyncToken },
    });
  }
}

/** Usuwa event Google powiązany ze zleceniem (przed usunięciem zlecenia). */
export async function deleteOrderEvent(
  order: Pick<
    Order,
    'googleCalendarEventId' | 'googleCalendarId' | 'assignedUserId'
  >,
  actingUserId: string,
): Promise<void> {
  if (!isGoogleConfigured() || !order.googleCalendarEventId) return;
  const ctx = await getCalendar(order.assignedUserId ?? actingUserId);
  if (!ctx) return;
  try {
    await withRetry(() =>
      ctx.calendar.events.delete({
        calendarId: order.googleCalendarId ?? ctx.calendarId,
        eventId: order.googleCalendarEventId!,
      }),
    );
  } catch {
    // Event mógł już nie istnieć — ignorujemy.
  }
}
