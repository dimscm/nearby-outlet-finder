'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Outlet } from '@/lib/types';

// Memuat seed-outlets.json (data hasil parsing file Excel asli) hanya sekali
// saat database localStorage masih kosong.
let ahsSeed: Promise<Outlet[]> | null = null;
function loadAhsSeed(): Promise<Outlet[]> {
  ahsSeed ??= fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/seed-ahs.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((d) => (Array.isArray(d) ? d : []))
    .catch(() => {
      ahsSeed = null; // coba lagi lain kali
      return [];
    });
  return ahsSeed;
}

export default function SeedLoader() {
  const seeded = useStore((s) => s.seeded);
  const outlets = useStore((s) => s.outlets);
  const setOutlets = useStore((s) => s.setOutlets);
  const markSeeded = useStore((s) => s.markSeeded);

  // Pengguna lama: outlet seed di localStorage belum punya kecamatan/kelurahan → lengkapi dari seed terbaru
  useEffect(() => {
    if (!useStore.getState().seeded) return;
    const missing = useStore.getState().outlets.some((o) => o.id.startsWith('o-') && !o.kecamatan);
    if (!missing) return;
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/seed-outlets.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('seed tidak ditemukan'))))
      .then((data: Outlet[]) => {
        const byId = new Map(data.map((d) => [d.id, d]));
        const cur = useStore.getState().outlets;
        setOutlets(
          cur.map((o) => {
            const d = byId.get(o.id);
            if (!d || o.kecamatan) return o;
            return { ...o, kecamatan: d.kecamatan, kelurahan: o.kelurahan || d.kelurahan, city: d.city || o.city };
          })
        );
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded]);

  // Data baru: AHS Jakarta & Bekasi (public/seed-ahs.json). Dicek setiap kali daftar outlet berubah:
  // bila ada AHS yang hilang (mis. tertimpa tab lain yang masih versi lama), ditambahkan lagi.
  // Outlet lama & riwayat kunjungan tidak diubah.
  useEffect(() => {
    const cur = useStore.getState();
    if (!cur.seeded || cur.outlets.length === 0) return;
    loadAhsSeed().then((data) => {
      const st = useStore.getState();
      const have = new Set(st.outlets.map((o) => o.id));
      const missing = data.filter((o) => !have.has(o.id));
      if (missing.length) st.setOutlets([...st.outlets, ...missing]);
      if (!st.ahsSeeded) st.markAhsSeeded();
    });
  }, [seeded, outlets.length]);

  useEffect(() => {
    // Baca state asli dari store (bukan nilai render pertama, yang saat hydration Next.js masih kosong).
    // Tanpa ini, setiap buka halaman data tersimpan ditimpa ulang dengan seed bawaan.
    const cur = useStore.getState();
    if (seeded || cur.seeded) return;
    if (outlets.length > 0 || cur.outlets.length > 0) {
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
