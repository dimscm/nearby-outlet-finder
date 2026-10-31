'use client';

import { useMemo } from 'react';
import { formatDistance, googleMapsDirUrl, haversineKm } from '@/lib/geo';
import { telHref, waHref, type Ahs } from '@/lib/ahs';

// Daftar AHS terdekat dari sebuah titik (outlet)
export default function NearestAhs({ lat, lng, ahs, n = 3 }: { lat: number; lng: number; ahs: Ahs[]; n?: number }) {
  const near = useMemo(
    () =>
      ahs
        .map((a) => ({ a, d: haversineKm(lat, lng, a.latitude, a.longitude) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, n),
    [lat, lng, ahs, n]
  );
  if (near.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg bg-violet-50 p-2">
      <p className="text-[11px] font-semibold text-violet-700">AHS terdekat</p>
      <ul className="mt-1 space-y-1.5">
        {near.map(({ a, d }) => (
          <li key={a.id} className="text-[11px] leading-snug text-slate-700">
            <b>{a.name}</b> <span className="text-slate-500">· {formatDistance(d)}</span>
            <span className="block text-slate-500">{a.address}</span>
            <span className="flex flex-wrap gap-x-2">
              <a className="nof-link" href={googleMapsDirUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer">Rute ↗</a>
              {a.phone && <a className="nof-link" href={telHref(a.phone)}>{a.phone}</a>}
              {a.phone && <a className="nof-link" href={waHref(a.phone)} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
