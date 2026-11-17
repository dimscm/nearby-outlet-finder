'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { hasilBadge } from '@/lib/hasil';
import type { Visit } from '@/lib/types';
import VisitProgress, { type Level } from '@/components/VisitProgress';

const AREA_LS = 'nof-dash-area';
interface Area {
  kota: string;
  kec: string;
  kel: string;
}
const NONE: Area = { kota: '', kec: '', kel: '' };
const pct = (a: number, n: number) => (n ? Math.round((a / n) * 1000) / 10 : 0);
const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id'));

export default function DashboardPage() {
  const outlets = useStore((s) => s.outlets);
  const visits = useStore((s) => s.visits);

  // Filter wilayah: dipakai semua isi dashboard, diingat per perangkat
  const [area, setAreaState] = useState<Area>(NONE);
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(AREA_LS) || 'null');
      if (a && typeof a === 'object') setAreaState({ ...NONE, ...a });
    } catch {
      /* abaikan */
    }
  }, []);
  const setArea = (a: Area) => {
    setAreaState(a);
    try {
      localStorage.setItem(AREA_LS, JSON.stringify(a));
    } catch {
      /* abaikan */
    }
  };

  const active = useMemo(() => outlets.filter((o) => o.is_active), [outlets]);
  const kotaOpts = useMemo(() => uniq(active.map((o) => o.city)), [active]);
  const kecOpts = useMemo(() => uniq(active.filter((o) => o.city === area.kota).map((o) => o.kecamatan)), [active, area.kota]);
  const kelOpts = useMemo(
    () => uniq(active.filter((o) => o.city === area.kota && o.kecamatan === area.kec).map((o) => o.kelurahan)),
    [active, area.kota, area.kec]
  );

  const scope = useMemo(
    () =>
      active.filter(
        (o) =>
          (!area.kota || o.city === area.kota) &&
          (!area.kec || o.kecamatan === area.kec) &&
          (!area.kel || o.kelurahan === area.kel)
      ),
    [active, area]
  );
  const scopeIds = useMemo(() => new Set(scope.map((o) => o.id)), [scope]);
  const byId = useMemo(() => new Map(outlets.map((o) => [o.id, o])), [outlets]);

  // kunjungan terakhir per outlet
  const last = useMemo(() => {
    const m = new Map<string, Visit>();
    for (const v of visits) {
      const cur = m.get(v.outlet_id);
      if (!cur || v.visit_time > cur.visit_time) m.set(v.outlet_id, v);
    }
    return m;
  }, [visits]);

  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD waktu lokal
  const stats = useMemo(() => {
    const sudah = scope.filter((o) => last.has(o.id)).length;
    return {
      total: scope.length,
      sudah,
      belum: scope.length - sudah,
      followup: scope.filter((o) => last.get(o.id)?.visit_status === 'followup').length,
      today: visits.filter((v) => scopeIds.has(v.outlet_id) && new Date(v.visit_time).toLocaleDateString('sv-SE') === today).length,
    };
  }, [scope, scopeIds, last, visits, today]);

  const followupList = useMemo(
    () =>
      scope
        .filter((o) => last.get(o.id)?.visit_status === 'followup')
        .map((o) => ({ o, v: last.get(o.id)! }))
        .sort((a, b) => (a.v.follow_up_date ?? '').localeCompare(b.v.follow_up_date ?? '')),
    [scope, last]
  );
  const todayList = useMemo(
    () =>
      visits
        .filter((v) => scopeIds.has(v.outlet_id) && new Date(v.visit_time).toLocaleDateString('sv-SE') === today)
        .sort((a, b) => b.visit_time.localeCompare(a.visit_time)),
    [visits, scopeIds, today]
  );
  const belumList = useMemo(() => (area.kel ? scope.filter((o) => !last.has(o.id)) : []), [area.kel, scope, last]);

  // tabel turun satu tingkat dari wilayah yang dipilih
  const level: Level = !area.kota ? 'city' : !area.kec ? 'kecamatan' : 'kelurahan';
  const areaName = area.kel || area.kec || area.kota || 'Seluruh Jabotabek';
  const drill = (v: string) => {
    if (!area.kota) setArea({ kota: v, kec: '', kel: '' });
    else if (!area.kec) setArea({ ...area, kec: v, kel: '' });
    else setArea({ ...area, kel: v });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cards = [
    { label: 'Total Outlet', value: stats.total.toLocaleString('id-ID'), sub: areaName, color: 'bg-slate-800', wide: true },
    { label: 'Sudah Didatangi', value: stats.sudah.toLocaleString('id-ID'), sub: `${pct(stats.sudah, stats.total)}%`, color: 'bg-green-600' },
    { label: 'Belum Didatangi', value: stats.belum.toLocaleString('id-ID'), sub: `${pct(stats.belum, stats.total)}%`, color: 'bg-red-600' },
    { label: 'Dikunjungi Hari Ini', value: stats.today.toLocaleString('id-ID'), sub: 'kunjungan', color: 'bg-blue-600' },
    { label: 'Perlu Follow-up', value: stats.followup.toLocaleString('id-ID'), sub: 'outlet', color: 'bg-amber-500' },
  ];
  const sel = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400';

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-bold text-slate-900">Dashboard Sales</h1>
        {(area.kota || area.kec || area.kel) && (
          <button onClick={() => setArea(NONE)} className="text-xs font-semibold text-blue-600">
            Reset wilayah
          </button>
        )}
      </div>

      {/* Filter wilayah */}
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3">
        <select value={area.kota} onChange={(e) => setArea({ kota: e.target.value, kec: '', kel: '' })} className={sel}>
          <option value="">Seluruh Jabotabek</option>
          {kotaOpts.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select value={area.kec} disabled={!area.kota} onChange={(e) => setArea({ ...area, kec: e.target.value, kel: '' })} className={sel}>
          <option value="">{area.kota ? 'Semua kecamatan' : 'Pilih kota dulu'}</option>
          {kecOpts.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select value={area.kel} disabled={!area.kec} onChange={(e) => setArea({ ...area, kel: e.target.value })} className={sel}>
          <option value="">{area.kec ? 'Semua kelurahan' : 'Pilih kecamatan dulu'}</option>
          {kelOpts.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        {(area.kota || area.kec) && (
          <p className="text-[11px] text-slate-500 sm:col-span-3">
            <button className="font-semibold text-blue-600" onClick={() => setArea(NONE)}>Jabotabek</button>
            {area.kota && (
              <>
                {' › '}
                <button className="font-semibold text-blue-600" onClick={() => setArea({ kota: area.kota, kec: '', kel: '' })}>
                  {area.kota}
                </button>
              </>
            )}
            {area.kec && (
              <>
                {' › '}
                <button className="font-semibold text-blue-600" onClick={() => setArea({ ...area, kel: '' })}>
                  {area.kec}
                </button>
              </>
            )}
            {area.kel && <> › {area.kel}</>}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-3 text-white ${c.color} ${c.wide ? 'col-span-2 lg:col-span-1' : ''}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-[11px] leading-tight opacity-90">
              {c.label}
              <span className="block truncate font-semibold opacity-90">{c.sub}</span>
            </p>
          </div>
        ))}
      </div>

      {!area.kel ? (
        <VisitProgress scope={scope} last={last} level={level} areaName={areaName} onDrill={drill} />
      ) : (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Belum Didatangi di {area.kel} ({belumList.length})
          </h2>
          <div className="space-y-2">
            {belumList.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {o.is_new && <span className="nof-new mr-1">NEW</span>}
                  {o.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{o.address || o.category}</p>
              </div>
            ))}
            {belumList.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                Semua outlet di kelurahan ini sudah didatangi. 🎉
              </p>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Perlu Follow-up ({followupList.length})</h2>
          <div className="space-y-2">
            {followupList.map(({ o, v }) => (
              <div key={o.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{o.name}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Perlu follow-up</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  📌 Follow-up: <b>{v.follow_up_date || '-'}</b> · Kunjungan terakhir: {new Date(v.visit_time).toLocaleString('id-ID')} —{' '}
                  {v.sales_name}
                </p>
              </div>
            ))}
            {followupList.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                Tidak ada outlet yang perlu follow-up. 🎉
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Kunjungan Hari Ini ({todayList.length})</h2>
          <div className="space-y-2">
            {todayList.map((v) => (
              <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{byId.get(v.outlet_id)?.name ?? '(outlet terhapus)'}</p>
                  {v.hasil && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${hasilBadge[v.hasil] ?? ''}`}>{v.hasil}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {new Date(v.visit_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {v.sales_name}
                  {v.alasan && ` · ${v.alasan}`}
                  {v.notes && ` · ${v.notes}`}
                </p>
              </div>
            ))}
            {todayList.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                Belum ada kunjungan hari ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
