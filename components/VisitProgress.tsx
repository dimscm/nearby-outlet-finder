'use client';

import { useMemo, useState } from 'react';
import type { Outlet, Visit } from '@/lib/types';

type Level = 'city' | 'kecamatan' | 'kelurahan' | 'rayon';
const LEVELS: { v: Level; label: string }[] = [
  { v: 'city', label: 'Kota' },
  { v: 'kecamatan', label: 'Kecamatan' },
  { v: 'kelurahan', label: 'Kelurahan' },
  { v: 'rayon', label: 'Rayon' },
];

interface Row {
  n: number;
  sudah: number;
  noo: number;
  cb: number;
  tidak: number;
  fu: number;
}
const blank = (): Row => ({ n: 0, sudah: 0, noo: 0, cb: 0, tidak: 0, fu: 0 });
const pct = (a: number, n: number) => (n ? Math.round((a / n) * 1000) / 10 : 0);

// Rangkuman progres kunjungan: seluruh Jabotabek + per kota/kecamatan/kelurahan/rayon
export default function VisitProgress({ outlets, visits }: { outlets: Outlet[]; visits: Visit[] }) {
  const [level, setLevel] = useState<Level>('kecamatan');
  const [kota, setKota] = useState('all');
  const [sort, setSort] = useState<'belum' | 'pct' | 'nama'>('belum');

  // kunjungan terakhir per outlet
  const last = useMemo(() => {
    const m = new Map<string, Visit>();
    for (const v of visits) {
      const cur = m.get(v.outlet_id);
      if (!cur || v.visit_time > cur.visit_time) m.set(v.outlet_id, v);
    }
    return m;
  }, [visits]);

  const active = useMemo(() => outlets.filter((o) => o.is_active), [outlets]);
  const cities = useMemo(() => Array.from(new Set(active.map((o) => o.city).filter(Boolean))).sort(), [active]);

  const { total, rows, alasan } = useMemo(() => {
    const scope = kota === 'all' ? active : active.filter((o) => o.city === kota);
    const groups = new Map<string, Row>();
    const total = blank();
    const alasan = new Map<string, number>();
    const add = (r: Row, o: Outlet) => {
      r.n++;
      const v = last.get(o.id);
      if (!v) return;
      r.sudah++;
      if (v.hasil === 'Deal NOO') r.noo++;
      else if (v.hasil === 'CB salesman') r.cb++;
      else if (v.hasil === 'Tidak mau CB') r.tidak++;
      else if (v.hasil === 'Perlu follow-up' || v.visit_status === 'followup') r.fu++;
    };
    for (const o of scope) {
      const key =
        level === 'kelurahan'
          ? `${o.kelurahan || '(tanpa kelurahan)'}, ${o.kecamatan || '-'}`
          : (o[level] as string) || '(kosong)';
      if (!groups.has(key)) groups.set(key, blank());
      add(groups.get(key)!, o);
      add(total, o);
      const v = last.get(o.id);
      if (v?.hasil === 'Tidak mau CB') alasan.set(v.alasan || 'Tidak diisi', (alasan.get(v.alasan || 'Tidak diisi') ?? 0) + 1);
    }
    const rows = Array.from(groups.entries()).sort((a, b) =>
      sort === 'nama'
        ? a[0].localeCompare(b[0], 'id')
        : sort === 'pct'
          ? pct(a[1].sudah, a[1].n) - pct(b[1].sudah, b[1].n) || b[1].n - a[1].n
          : b[1].n - b[1].sudah - (a[1].n - a[1].sudah)
    );
    return { total, rows, alasan: Array.from(alasan.entries()).sort((a, b) => b[1] - a[1]) };
  }, [active, last, level, kota, sort]);

  const sel = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs';
  const line = (name: string, r: Row, strong = false) => (
    <tr key={name} className={strong ? 'bg-blue-50 font-bold' : 'border-t border-slate-100'}>
      <td className="max-w-[120px] truncate py-1.5 pr-2 sm:max-w-[260px]" title={name}>{name}</td>
      <td className="px-2 text-right tabular-nums">{r.n.toLocaleString('id-ID')}</td>
      <td className="px-2 text-right tabular-nums text-green-700">{r.sudah.toLocaleString('id-ID')}</td>
      <td className="px-2 text-right tabular-nums text-red-600">{(r.n - r.sudah).toLocaleString('id-ID')}</td>
      <td className="px-2">
        <div className="flex items-center gap-1.5">
          <div className="hidden h-2 w-16 overflow-hidden rounded-full bg-slate-200 sm:block">
            <div className="h-full bg-green-500" style={{ width: `${pct(r.sudah, r.n)}%` }} />
          </div>
          <span className="tabular-nums">{pct(r.sudah, r.n)}%</span>
        </div>
      </td>
      <td className="px-2 text-right tabular-nums">{pct(r.n - r.sudah, r.n)}%</td>
    </tr>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Progres Kunjungan</h2>
          <p className="text-xs text-slate-500">
            {kota === 'all' ? 'Seluruh Jabotabek' : kota}: <b className="text-green-700">{pct(total.sudah, total.n)}% sudah</b> ·{' '}
            <b className="text-red-600">{pct(total.n - total.sudah, total.n)}% belum</b> didatangi (
            {total.sudah.toLocaleString('id-ID')} dari {total.n.toLocaleString('id-ID')} outlet)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={kota} onChange={(e) => setKota(e.target.value)} className={sel}>
            <option value="all">Seluruh Jabotabek</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className={sel}>
            {LEVELS.map((l) => (
              <option key={l.v} value={l.v}>Per {l.label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={sel}>
            <option value="belum">Belum didatangi terbanyak</option>
            <option value="pct">% didatangi terendah</option>
            <option value="nama">Nama A–Z</option>
          </select>
        </div>
      </div>

      <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-[11px] text-slate-500">
            <tr>
              <th className="py-2 pl-3 pr-2 text-left">{LEVELS.find((l) => l.v === level)?.label}</th>
              <th className="px-1 sm:px-2 text-right">Outlet</th>
              <th className="px-1 sm:px-2 text-right">Sudah</th>
              <th className="px-1 sm:px-2 text-right">Belum</th>
              <th className="px-1 sm:px-2 text-left">% sudah</th>
              <th className="px-1 sm:px-2 text-right">% belum</th>
            </tr>
          </thead>
          <tbody className="[&_td:first-child]:pl-3 [&_th:first-child]:pl-3">
            {line('Total', total, true)}
            {rows.map(([k, r]) => line(k, r))}
          </tbody>
        </table>
      </div>

      {alasan.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">Alasan Tidak Mau CB</p>
          <div className="space-y-1">
            {alasan.map(([a, n]) => (
              <div key={a} className="flex items-center gap-2 text-xs">
                <span className="w-56 shrink-0 truncate text-slate-600">{a}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-red-400" style={{ width: `${(n / alasan[0][1]) * 100}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
