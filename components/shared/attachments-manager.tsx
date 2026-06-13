/**
 * Plik: components/shared/attachments-manager.tsx
 * Cel: Uniwersalny menedżer załączników (zdjęcia + dokumenty) działający na
 *      dowolnym endpoincie `{endpoint}` zgodnym z API attachments (GET/POST/DELETE).
 *      Galeria zdjęć + lista dokumentów + upload + usuwanie.
 * Zależności: swr, lib/fetcher, components/ui/button, next/image.
 * Użycie: karta klienta (Etap 4); analogicznie dla zleceń.
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fetcher, ApiError } from '@/lib/fetcher';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}
interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
}

export function AttachmentsManager({ endpoint }: { endpoint: string }) {
  const { data, mutate } = useSWR<{ photos: Photo[]; documents: Document[] }>(
    endpoint,
    fetcher,
  );
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(endpoint, { method: 'POST', body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new ApiError(body.error ?? 'Błąd uploadu', res.status);
        }
      }
      toast.success('Plik przesłany');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd uploadu');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(type: 'photo' | 'document', attId: string) {
    try {
      await fetch(`${endpoint}?type=${type}&attId=${attId}`, {
        method: 'DELETE',
      });
      mutate();
    } catch {
      toast.error('Nie udało się usunąć');
    }
  }

  const photos = data?.photos ?? [];
  const documents = data?.documents ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Zdjęcia i dokumenty (JPG, PNG, PDF — maks. 8 MB)
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Dodaj plik
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 && documents.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Brak załączników.
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square">
              <Image
                src={p.url}
                alt={p.caption ?? 'Zdjęcie'}
                fill
                sizes="120px"
                unoptimized
                className="rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={() => remove('photo', p.id)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Usuń zdjęcie"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <ul className="space-y-1.5">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 hover:underline"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{d.fileName}</span>
              </a>
              <button
                type="button"
                onClick={() => remove('document', d.id)}
                aria-label="Usuń dokument"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
