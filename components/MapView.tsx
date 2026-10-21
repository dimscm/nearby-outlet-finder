'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { statusDot, VisitStatus } from '@/lib/visits';

export interface MapOutlet {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: VisitStatus;
}

interface Props {
  userLoc: { lat: number; lng: number } | null;
  outlets: MapOutlet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  heightClass?: string;
}

function dotIcon(color: string, highlight: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid ${highlight ? '#0f172a' : '#ffffff'};box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 8px rgba(37,99,235,.22)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FlyToSelected({
  outlets,
  selectedId,
}: {
  outlets: MapOutlet[];
  selectedId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const o = outlets.find((x) => x.id === selectedId);
    if (o) map.flyTo([o.latitude, o.longitude], Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [selectedId, outlets, map]);
  return null;
}

// Basemap OpenStreetMap — outlet yang dirender HANYA data internal database.
export default function MapView({
  userLoc,
  outlets,
  selectedId,
  onSelect,
  heightClass = 'h-[52vh]',
}: Props) {
  const center: [number, number] = userLoc ? [userLoc.lat, userLoc.lng] : [-6.2, 106.85];
  return (
    <MapContainer
      center={center}
      zoom={userLoc ? 14 : 11}
      scrollWheelZoom
      className={`${heightClass} w-full rounded-xl border border-slate-200`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={USER_ICON} />}
      {outlets.map((o) => (
        <Marker
          key={o.id}
          position={[o.latitude, o.longitude]}
          icon={dotIcon(statusDot[o.status], o.id === selectedId)}
          eventHandlers={{ click: () => onSelect(o.id) }}
        />
      ))}
      <FlyToSelected outlets={outlets} selectedId={selectedId} />
    </MapContainer>
  );
}
