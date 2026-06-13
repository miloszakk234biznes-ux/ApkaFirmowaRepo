/**
 * Plik: app/(dashboard)/map/page.tsx
 * Cel: Mapa zleceń dnia z pinezkami i optymalizacją trasy (deeplink nawigacji).
 * Zależności: components/map/map-shell.
 */
import { MapShell } from '@/components/map/map-shell';

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mapa i trasy</h1>
        <p className="text-muted-foreground">
          Zlecenia dnia na mapie oraz nawigacja z optymalizacją kolejności wizyt.
        </p>
      </div>
      <MapShell />
    </div>
  );
}
