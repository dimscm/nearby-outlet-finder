'use client';

import { useMemo, useState } from 'react';
import type { Outlet, Visit } from '@/lib/types';

export type Level = 'city' | 'kecamatan' | 'kelurahan';
const LABEL: Record<Level, string> = { city: 'Kota', kecamatan: 'Kecamatan', kelurahan: 'Kelurahan' };

interface Row {
  n: number;
  sudah: number;
}
const pct = (a: number, n: number) => (n ? Math.round((a / n) * 1000) / 10 : 0);

interface Props {
  scope: Outlet[]; // outlet aktif di wilayah yang sedang dipilih
  last: Map<string, Visit>; // kunjungan terakhir per outlet
  level: Level; // tingkat rincian tabel (otomatis dari filter wilayah)
  areaName: string;
  onDrill?: (value: string) => void; // ketuk baris → masuk ke wilayah itu
}

// Tabel progres kunjungan untuk wilayah terpilih, dirinci satu tingkat di bawahnya
export default function VisitProgress({ scope, last, level, areaName, onDrill }: Props) {
  const [sort, setSort] = useState<'belum' | 'pct' | 'nama'>('belum');

  const { total, rows, alasan } = useMemo(() => {
    const groups = new Map<string, Row>();
    const total: Row = { n: 0, sudah: 0 };
    const alasan = new Map<string, number>();
    for (const o of scope) {
      const key = (o[level] as string) || '(tanpa ' + LABEL[level].toLowerCase() + ')';
      const g = groups.get(key) ?? { n: 0, sudah: 0 };
      groups.set(key, g);
      g.n++;
      total.n++;
      const v = last.get(o.id);
      if (v) {
        g.sudah++;
        total.sudah++;
        if (v.hasil === 'Tidak mau CB') alasan.set(v.alasan || 'Tidak diisi', (alasan.get(v.alasan || 'Tidak diisi') ?? 0) + 1);
      }
    }
    const rows = Array.from(groups.entries()).sort((a, b) =>
      sort === 'nama'
        ? a[0].localeCompare(b[0], 'id')
        : sort === 'pct'
          ? pct(a[1].sudah, a[1].n) - pct(b[1].sudah, b[1].n) || b[1].n - a[1].n
          : b[1].n - b[1].sudah - (a[1].n - a[1].sudah)
    );
    return { total, rows, alasan: Array.from(alasan.entries()).sort((a, b) => b[1] - a[1]) };
  }, [scope, last, level, sort]);

  const cell = 'px-1 text-right tabular-nums sm:px-2';
  const line = (name: string, r: Row, strong = false, drill = false) => (
    <tr
      key={name}
      onClick={drill && onDrill ? () => onDrill(name) : undefined}
      className={strong ? 'bg-blue-50 font-bold' : `border-t border-slate-100 ${drill && onDrill ? 'cursor-pointer active:bg-slate-100 hover:bg-slate-50' : ''}`}
    >
      <td className="max-w-[120px] truncate py-2 pl-3 pr-1 sm:max-w-[260px] sm:pr-2" title={name}>
        {name}
        {drill && onDrill && <span className="ml-1 text-slate-400">›</span>}
      </td>
      <td className={cell}>{r.n.toLocaleString('id-ID')}</td>
      <td className={`${cell} text-green-700`}>{r.sudah.toLocaleString('id-ID')}</td>
      <td className={`${cell} text-red-600`}>{(r.n - r.sudah).toLocaleString('id-ID')}</td>
      <td className="px-1 sm:px-2">
        <div className="flex items-center gap-1.5">
          <div className="hidden h-2 w-16 overflow-hidden rounded-full bg-slate-200 sm:block">
            <div className="h-full bg-green-500" style={{ width: `${pct(r.sudah, r.n)}%` }} />
          </div>
          <span className="tabular-nums">{pct(r.sudah, r.n)}%</span>
        </div>
      </td>
      <td className={`${cell} pr-3`}>{pct(r.n - r.sudah, r.n)}%</td>
    </tr>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Progres Kunjungan per {LABEL[level]}</h2>
          <p className="text-xs text-slate-500">
            {areaName}: <b className="text-green-700">{pct(total.sudah, total.n)}% sudah</b> ·{' '}
            <b className="text-red-600">{pct(total.n - total.sudah, total.n)}% belum</b> didatangi
            {onDrill ? ' · ketuk baris untuk melihat rinciannya' : ''}
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
        >
          <option value="belum">Belum didatangi terbanyak</option>
          <option value="pct">% didatangi terendah</option>
          <option value="nama">Nama A–Z</option>
        </select>
      </div>

      <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-[11px] text-slate-500">
            <tr>
              <th className="py-2 pl-3 pr-1 text-left">{LABEL[level]}</th>
              <th className="px-1 text-right sm:px-2">Outlet</th>
              <th className="px-1 text-right sm:px-2">Sudah</th>
              <th className="px-1 text-right sm:px-2">Belum</th>
              <th className="px-1 text-left sm:px-2">% sudah</th>
              <th className="px-1 pr-3 text-right sm:px-2">% belum</th>
            </tr>
          </thead>
          <tbody>
            {line('Total', total, true)}
            {rows.map(([k, r]) => line(k, r, false, true))}
          </tbody>
        </table>
      </div>

      {alasan.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">Alasan Tidak Mau CB</p>
          <div className="space-y-1">
            {alasan.map(([a, n]) => (
              <div key={a} className="flex items-center gap-2 text-xs">
                <span className="w-44 shrink-0 truncate text-slate-600 sm:w-56">{a}</span>
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
