'use client';

import { memo, useMemo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { googleMapsDirUrl } from '@/lib/geo';
import { telHref, waHref, type Ahs } from '@/lib/ahs';

export const AHS_COLOR = '#7c3aed';

// Titik AHS digambar di canvas (ringan untuk ±1.900 titik); popup: alamat, telepon/WA, rute
function AhsLayer({ ahs }: { ahs: Ahs[] }) {
  const renderer = useMemo(() => L.canvas({ padding: 0.5, tolerance: 8 }), []);
  return (
    <>
      {ahs.map((a) => (
        <CircleMarker
          key={a.id}
          center={[a.latitude, a.longitude]}
          radius={6}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: AHS_COLOR, fillOpacity: 0.95 }}
          renderer={renderer}
        >
          <Popup offset={[0, -4]}>
            <div className="min-w-[190px] max-w-[250px]">
              <p className="text-sm font-bold leading-tight text-slate-900">{a.name}</p>
              <span className="mt-1 inline-block rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">AHS</span>
              <p className="mt-1 text-xs leading-snug text-slate-600">{a.address}</p>
              <p className="text-[11px] text-slate-500">{[a.kecamatan, a.city].filter(Boolean).join(', ')}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a href={googleMapsDirUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer"
                  className="nof-popup-btn rounded-lg bg-green-600 px-2 py-1.5 text-xs font-semibold">🧭 Navigasi</a>
                {a.phone && (
                  <>
                    <a href={telHref(a.phone)} className="nof-photo-link rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold">📞 Telepon</a>
                    <a href={waHref(a.phone)} target="_blank" rel="noopener noreferrer"
                      className="nof-photo-link rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold">WhatsApp</a>
                  </>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default memo(AhsLayer);
