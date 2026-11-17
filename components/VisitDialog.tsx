'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { uid, nowIso, toLocalInputValue } from '@/lib/id';
import type { Outlet, Visit } from '@/lib/types';
import { ALASAN, HASIL } from '@/lib/hasil';

interface Props {
  open: boolean;
  outlet: Outlet | null;
  defaultSales: string;
  onClose: () => void;
  onSave: (visit: Visit) => void;
}

const HASIL_ON: Record<string, string> = {
  'Deal NOO': 'border-green-600 bg-green-600 text-white',
  'CB salesman': 'border-blue-600 bg-blue-600 text-white',
  'Tidak mau CB': 'border-red-600 bg-red-600 text-white',
  'Perlu follow-up': 'border-amber-500 bg-amber-500 text-white',
};

export default function VisitDialog({ open, outlet, defaultSales, onClose, onSave }: Props) {
  const [sales, setSales] = useState(defaultSales);
  const [time, setTime] = useState(toLocalInputValue());
  const [hasil, setHasil] = useState('');
  const [alasan, setAlasan] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [err, setErr] = useState('');

  // Setiap membuka form untuk outlet lain: isi ulang nama sales & waktu sekarang
  useEffect(() => {
    if (!open) return;
    setSales(defaultSales);
    setTime(toLocalInputValue());
    setHasil('');
    setAlasan('');
    setNotes('');
    setFollowUp('');
    setErr('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, outlet?.id]);

  if (!outlet) return null;

  const status: 'sudah' | 'followup' = hasil === 'Perlu follow-up' ? 'followup' : 'sudah';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!outlet) return;
    if (sales.trim().length < 2) {
      setErr('Nama sales wajib diisi.');
      return;
    }
    if (!hasil) {
      setErr('Pilih hasil kunjungan.');
      return;
    }
    if (hasil === 'Tidak mau CB' && !alasan) {
      setErr('Pilih alasan tidak mau CB.');
      return;
    }
    if (hasil === 'Tidak mau CB' && alasan === 'Lainnya' && notes.trim().length < 3) {
      setErr('Alasan "Lainnya": tulis alasannya di catatan.');
      return;
    }
    if (status === 'followup' && !followUp) {
      setErr('Tanggal follow-up wajib diisi untuk Perlu follow-up.');
      return;
    }
    setErr('');
    const local = new Date(time);
    onSave({
      id: uid(),
      outlet_id: outlet.id,
      sales_name: sales.trim(),
      visit_time: local.toISOString(),
      visit_status: status,
      notes: notes.trim(),
      follow_up_date: status === 'followup' ? followUp : '',
      hasil,
      alasan: hasil === 'Tidak mau CB' ? alasan : '',
      created_at: nowIso(),
    });
    setNotes('');
    setFollowUp('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Catat Visit — ${outlet.name}`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nama Sales</label>
          <input
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nama salesman"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Waktu Kunjungan</label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Hasil Kunjungan</label>
          <div className="grid grid-cols-2 gap-2">
            {HASIL.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHasil(h);
                  setErr('');
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  hasil === h ? HASIL_ON[h] : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        {hasil === 'Tidak mau CB' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Alasan Tidak Mau CB</label>
            <select
              value={alasan}
              onChange={(e) => {
                setAlasan(e.target.value);
                setErr('');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— pilih alasan —</option>
              {ALASAN.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
        )}
        {status === 'followup' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tanggal Follow-up</label>
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {hasil === 'Tidak mau CB' && alasan === 'Lainnya' ? 'Tulis alasannya' : 'Catatan tambahan (opsional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="mis. minta dihubungi minggu depan"
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">
          Simpan Kunjungan
        </button>
      </form>
    </Modal>
  );
}
