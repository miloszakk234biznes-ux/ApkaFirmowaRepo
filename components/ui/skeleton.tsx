/**
 * Plik: components/ui/skeleton.tsx
 * Cel: Skeleton loader (shadcn/ui) — stany ładowania zamiast blokujących spinnerów.
 * Zależności: lib/utils.
 */
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
