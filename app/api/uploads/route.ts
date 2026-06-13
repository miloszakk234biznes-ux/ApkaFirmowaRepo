/**
 * Plik: app/api/uploads/route.ts
 * Cel: Generyczny upload pliku (np. zdjęcie paragonu) — zapisuje plik i zwraca
 *      publiczny URL (serwowany przez /api/files). Wymaga zalogowania.
 * Zależności: lib/rbac, lib/uploads.
 */
import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { saveUploadedFile } from '@/lib/uploads';

export async function POST(req: Request) {
  try {
    await requireAuth();
    const file = (await req.formData()).get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
    }
    try {
      const saved = await saveUploadedFile(file);
      return NextResponse.json(saved, { status: 201 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Błąd zapisu pliku' },
        { status: 400 },
      );
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
