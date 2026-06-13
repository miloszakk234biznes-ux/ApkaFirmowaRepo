/**
 * Plik: lib/fetcher.ts
 * Cel: Pomocniki HTTP po stronie klienta — `fetcher` dla SWR oraz `apiRequest`
 *      do mutacji (POST/PATCH/DELETE) z jednolitą obsługą błędów.
 * Zależności: brak (fetch).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues?: unknown,
  ) {
    super(message);
  }
}

/** Fetcher dla SWR — GET zwracający JSON. */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.error ?? 'Błąd pobierania',
      res.status,
      body.issues,
    );
  }
  return res.json();
}

/** Mutacja z ciałem JSON. Rzuca ApiError z komunikatem z API. */
export async function apiRequest<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      json.error ?? 'Operacja nie powiodła się',
      res.status,
      json.issues,
    );
  }
  return json as T;
}
