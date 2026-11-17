import type { Visit } from './types';

// Pilihan hasil kunjungan (menggantikan catatan bebas sebagai isian utama)
export const HASIL = ['Deal NOO', 'CB salesman', 'Tidak mau CB', 'Perlu follow-up'] as const;
export type Hasil = (typeof HASIL)[number];

export const ALASAN = [
  'Gang sempit',
  'Jalan buntu / akses sulit',
  'Harga tidak masuk / beli di agen',
  'Sudah ambil dari distributor lain',
  'Stok masih banyak',
  'Pemilik tidak ada / tidak bisa ditemui',
  'Toko tutup / pindah',
  'Lainnya',
] as const;

// Teks yang dikirim ke kolom "hasil" Google Sheet, mis. "Tidak mau CB: Gang sempit"
export function hasilText(v: Pick<Visit, 'visit_status' | 'hasil' | 'alasan'>): string {
  if (v.hasil) return v.hasil === 'Tidak mau CB' && v.alasan ? `${v.hasil}: ${v.alasan}` : v.hasil;
  return v.visit_status === 'followup' ? 'Perlu follow-up' : 'Sudah dikunjungi'; // kunjungan lama
}

// Kebalikan hasilText: membaca kolom "hasil" dari Google Sheet
export function parseHasil(text: string): { hasil: string; alasan: string } {
  const t = String(text || '').trim();
  for (const h of HASIL) {
    if (t === h) return { hasil: h, alasan: '' };
    if (t.startsWith(h + ':')) return { hasil: h, alasan: t.slice(h.length + 1).trim() };
  }
  if (/follow/i.test(t)) return { hasil: 'Perlu follow-up', alasan: '' };
  return { hasil: '', alasan: '' }; // "Sudah dikunjungi" (data lama, sebelum ada pilihan hasil)
}

export const hasilBadge: Record<string, string> = {
  'Deal NOO': 'bg-green-100 text-green-800',
  'CB salesman': 'bg-blue-100 text-blue-800',
  'Tidak mau CB': 'bg-red-100 text-red-700',
  'Perlu follow-up': 'bg-amber-100 text-amber-700',
};
