/**
 * Plik: lib/uploads.ts
 * Cel: Zapis przesłanych plików (zdjęcia/dokumenty zleceń) do lokalnego katalogu
 *      `public/uploads`. Waliduje typ i rozmiar. Zwraca publiczny URL.
 * Zależności: node:fs/promises, node:crypto.
 *
 * Uwaga produkcyjna: na platformach z efemerycznym/ro systemem plików (np. Vercel)
 * należy podmienić tę warstwę na S3/Uploadthing. Dla Dockera/VPS wystarczy
 * zamontować wolumen na /app/public/uploads. Konfiguracja katalogu: UPLOAD_DIR.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export interface SavedFile {
  url: string;
  fileName: string;
  fileType: string;
  isImage: boolean;
}

/** Katalog docelowy (domyślnie public/uploads). */
function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'uploads');
}

/** Zapisuje plik z FormData i zwraca metadane + publiczny URL. */
export async function saveUploadedFile(file: File): Promise<SavedFile> {
  if (!ALLOWED.has(file.type)) {
    throw new Error(
      'Niedozwolony typ pliku (dozwolone: JPG, PNG, WEBP, GIF, PDF)',
    );
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Plik jest za duży (maks. 8 MB)');
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const ext =
    extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '');
  const safeName = `${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, safeName), bytes);

  return {
    // Serwowane przez uwierzytelniony route handler (patrz app/api/files/[...path]).
    url: `/api/files/${safeName}`,
    fileName: file.name,
    fileType: file.type,
    isImage: file.type.startsWith('image/'),
  };
}

/** Ścieżka katalogu uploadów (do odczytu przez route serwujący pliki). */
export function getUploadDir(): string {
  return uploadDir();
}
