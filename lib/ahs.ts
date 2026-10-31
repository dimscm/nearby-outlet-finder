'use client';

import { useEffect, useState } from 'react';

// Lapisan AHS (Jakarta & Bekasi) — data terpisah dari outlet, hanya untuk ditampilkan di peta.
export interface Ahs {
  id: string;
  name: string;
  address: string;
  phone: string;
  kecamatan: string;
  city: string;
  latitude: number;
  longitude: number;
}

let cache: Promise<Ahs[]> | null = null;

export function useAhs(): Ahs[] {
  const [list, setList] = useState<Ahs[]>([]);
  useEffect(() => {
    cache ??= fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/ahs.json`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    let alive = true;
    cache.then((d) => alive && setList(Array.isArray(d) ? d : []));
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function waHref(phone: string): string {
  const n = phone.replace(/\D/g, '');
  return `https://wa.me/${n.startsWith('0') ? '62' + n.slice(1) : n}`;
}
