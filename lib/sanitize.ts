/**
 * Plik: lib/sanitize.ts
 * Cel: Bezpieczne przetwarzanie treści — sanityzacja HTML (DOMPurify) dla pól
 *      rich text oraz escapowanie tekstu wstawianego do HTML (np. InfoWindow map).
 * Zależności: isomorphic-dompurify.
 */
import DOMPurify from 'isomorphic-dompurify';

/** Sanityzuje HTML, pozostawiając tylko bezpieczne tagi formatowania. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/** Escapuje znaki specjalne HTML (bezpieczne wstawianie tekstu do szablonu). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
