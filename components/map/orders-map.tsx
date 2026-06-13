/**
 * Plik: components/map/orders-map.tsx
 * Cel: Mapa zleceń dnia (Google Maps JS API) — pinezki adresów, klik → szczegóły
 *      zlecenia, deeplink „Otwórz trasę w Google Maps" (z optymalizacją kolejności).
 *      Działa, gdy ustawiono NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; bez klucza pokazuje
 *      listę adresów + sam deeplink nawigacji.
 * Zależności: Google Maps JS API (ładowane dynamicznie), components/ui/*.
 */
'use client';

import * as React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { escapeHtml } from '@/lib/sanitize';
import type { OrderListItem } from '@/types';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Globalna promesa ładowania skryptu (jednorazowo).
let mapsPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as unknown as { google?: unknown }).google)
    return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=geometry`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Nie udało się załadować Google Maps'));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

/** Buduje deeplink nawigacji Google Maps z optymalizacją kolejności przystanków. */
export function buildRouteDeeplink(addresses: string[]): string | null {
  const stops = addresses.filter(Boolean);
  if (stops.length === 0) return null;
  const destination = encodeURIComponent(stops[stops.length - 1]!);
  const waypoints =
    stops.length > 1
      ? `&waypoints=optimize:true|${stops
          .slice(0, -1)
          .map(encodeURIComponent)
          .join('|')}`
      : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${waypoints}`;
}

export function OrdersMap({ orders }: { orders: OrderListItem[] }) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const withAddress = orders.filter((o) => o.address);
  const deeplink = buildRouteDeeplink(withAddress.map((o) => o.address!));

  React.useEffect(() => {
    if (!MAPS_KEY || !mapRef.current || withAddress.length === 0) return;
    let cancelled = false;

    loadMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const g = (window as any).google;
        const map = new g.maps.Map(mapRef.current, {
          zoom: 11,
          center: { lat: 52.231, lng: 21.006 }, // Warszawa (domyślnie)
          mapTypeControl: false,
          streetViewControl: false,
        });
        const geocoder = new g.maps.Geocoder();
        const bounds = new g.maps.LatLngBounds();

        withAddress.forEach((o) => {
          geocoder.geocode(
            { address: o.address },
            (results: any, status: string) => {
              if (status === 'OK' && results[0]) {
                const pos = results[0].geometry.location;
                const marker = new g.maps.Marker({
                  map,
                  position: pos,
                  title: o.title,
                });
                const info = new g.maps.InfoWindow({
                  content: `<div style="font-size:13px"><b>${escapeHtml(o.title)}</b><br/>${escapeHtml(o.address ?? '')}<br/><a href="/orders/${encodeURIComponent(o.id)}">Szczegóły</a></div>`,
                });
                marker.addListener('click', () => info.open(map, marker));
                bounds.extend(pos);
                map.fitBounds(bounds);
              }
            },
          );
        });
      })
      .catch((e) => setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [withAddress]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {withAddress.length} zleceń z adresem
        </p>
        {deeplink && (
          <Button asChild>
            <a href={deeplink} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4" /> Otwórz trasę w Google Maps
            </a>
          </Button>
        )}
      </div>

      {MAPS_KEY ? (
        <div
          ref={mapRef}
          className="h-[420px] w-full rounded-lg border bg-muted"
        />
      ) : (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Mapa interaktywna wymaga klucza{' '}
          <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>. Przycisk „Otwórz trasę"
          działa bez klucza. Lista przystanków poniżej.
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Lista przystanków (kolejność wizyt) */}
      <ol className="space-y-1">
        {withAddress.map((o, i) => (
          <li
            key={o.id}
            className="flex items-center gap-3 rounded-md border p-2 text-sm"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <a href={`/orders/${o.id}`} className="font-medium hover:underline">
              {o.title}
            </a>
            <span className="truncate text-muted-foreground">{o.address}</span>
          </li>
        ))}
        {withAddress.length === 0 && (
          <li className="rounded-md border p-4 text-center text-muted-foreground">
            Brak zleceń z adresem w tym dniu.
          </li>
        )}
      </ol>
    </div>
  );
}
