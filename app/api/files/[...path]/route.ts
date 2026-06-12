/**
 * Plik: app/api/files/[...path]/route.ts
 * Cel: Serwowanie przesłanych plików (zdjęcia/dokumenty) z katalogu uploadów.
 *      Wymaga zalogowania. Chroni przed path traversal (tylko nazwa pliku).
 * Zależności: node:fs/promises, lib/rbac, lib/uploads.
 */
import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { getUploadDir } from '@/lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  try {
    await requireAuth();

    // Zabezpieczenie: bierzemy wyłącznie nazwę pliku (bez ścieżek).
    const name = basename(params.path.join('/'));
    if (!name || name.includes('..')) {
      return NextResponse.json({ error: 'Błędna ścieżka' }, { status: 400 });
    }

    const filePath = join(getUploadDir(), name);
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    }

    const data = await readFile(filePath);
    const type =
      CONTENT_TYPES[extname(name).toLowerCase()] ?? 'application/octet-stream';

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
