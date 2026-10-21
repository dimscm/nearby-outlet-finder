'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Outlet } from '@/lib/types';

// Memuat seed-outlets.json (data hasil parsing file Excel asli) hanya sekali
// saat database localStorage masih kosong.
export default function SeedLoader() {
  const seeded = useStore((s) => s.seeded);
  const outlets = useStore((s) => s.outlets);
  const setOutlets = useStore((s) => s.setOutlets);
  const markSeeded = useStore((s) => s.markSeeded);

  useEffect(() => {
    if (seeded) return;
    if (outlets.length > 0) {
      markSeeded();
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/seed-outlets.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('seed tidak ditemukan'))))
      .then((data: Outlet[]) => setOutlets(Array.isArray(data) ? data : []))
      .catch(() => markSeeded());
  }, [seeded, outlets.length, setOutlets, markSeeded]);

  return null;
}
