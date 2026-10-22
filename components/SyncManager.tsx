'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { sendVisit, syncEnabled } from '@/lib/sync';

// Mengirim kunjungan yang belum terkirim ke Google Sheet: saat aplikasi dibuka,
// saat ada kunjungan baru, dan saat koneksi kembali online.
export default function SyncManager() {
  const visits = useStore((s) => s.visits);
  const running = useRef(false);

  async function flush() {
    if (!syncEnabled() || running.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    running.current = true;
    try {
      const { visits: vs, outlets, markVisitSynced } = useStore.getState();
      const byId = new Map(outlets.map((o) => [o.id, o]));
      for (const v of vs.filter((x) => !x.synced)) {
        try {
          await sendVisit(v, byId.get(v.outlet_id));
          markVisitSynced(v.id);
        } catch {
          break; // jaringan bermasalah — coba lagi nanti
        }
      }
    } finally {
      running.current = false;
    }
  }

  useEffect(() => {
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits.length]);

  useEffect(() => {
    const on = () => flush();
    window.addEventListener('online', on);
    const t = setInterval(on, 60_000);
    return () => {
      window.removeEventListener('online', on);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
