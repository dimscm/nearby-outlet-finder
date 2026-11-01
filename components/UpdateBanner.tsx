'use client';

import { useEffect, useState } from 'react';

// Tab yang dibiarkan terbuka tetap menjalankan versi lama. Komponen ini mengecek /version.json
// (saat aplikasi dibuka kembali & tiap 5 menit) dan menampilkan tombol muat ulang bila ada versi baru.
export default function UpdateBanner() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID;
    if (!mine || mine === 'dev') return;
    const check = () =>
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/version.json?t=${Date.now()}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((v: { id?: string } | null) => {
          if (v?.id && v.id !== mine) setStale(true);
        })
        .catch(() => undefined);
    check();
    const onVis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(check, 5 * 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(t);
    };
  }, []);

  if (!stale) return null;
  return (
    <div className="fixed inset-x-0 top-12 z-[1200] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-b-xl bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
      <span>Ada versi baru aplikasi.</span>
      <button onClick={() => window.location.reload()} className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-blue-700">
        Muat ulang
      </button>
    </div>
  );
}
