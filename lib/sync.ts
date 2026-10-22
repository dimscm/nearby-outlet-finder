import { SHEET_WEBHOOK_URL } from './config';
import { haversineKm } from './geo';
import type { Outlet, Visit } from './types';

// Nama tab wilayah di Google Sheet, berdasarkan kota outlet
export function areaTab(city: string): string {
  const c = (city || '').toLowerCase();
  if (c.includes('jakarta timur')) return 'JAKTIM';
  if (c.includes('jakarta selatan')) return 'JAKSEL';
  if (c.includes('jakarta utara')) return 'JAKUT';
  if (c.includes('jakarta pusat')) return 'JAKPUS';
  if (c.includes('jakarta barat')) return 'JAKBAR';
  if (c.includes('bekasi')) return 'BEKASI';
  if (c.includes('bogor')) return 'BOGOR';
  if (c.includes('depok')) return 'DEPOK';
  if (c.includes('tangerang selatan')) return 'TANGSEL';
  if (c.includes('tangerang')) return 'TANGERANG';
  if (c.includes('karawang')) return 'KARAWANG';
  return 'LAINNYA';
}

export const syncEnabled = () => SHEET_WEBHOOK_URL.trim().length > 0;

// Kirim satu kunjungan ke Google Sheet. Apps Script membalas {"ok":true} bila baris tersimpan;
// selain itu dianggap gagal dan dicoba lagi nanti.
export async function sendVisit(v: Visit, o: Outlet | undefined): Promise<void> {
  const dist =
    o && v.sales_lat != null && v.sales_lng != null
      ? Math.round(haversineKm(v.sales_lat, v.sales_lng, o.latitude, o.longitude) * 1000)
      : '';
  const payload = {
    area: areaTab(o?.city ?? ''),
    visit_id: v.id,
    waktu_kunjungan: v.visit_time,
    dicatat_pada: v.created_at,
    salesman: v.sales_name,
    hasil: v.visit_status === 'followup' ? 'Perlu follow-up' : 'Sudah dikunjungi',
    tanggal_follow_up: v.follow_up_date,
    catatan: v.notes,
    kode_outlet: o?.outlet_code ?? '',
    nama_outlet: o?.name ?? '(outlet terhapus)',
    alamat: o?.address ?? '',
    kelurahan: o?.kelurahan ?? '',
    kecamatan: o?.kecamatan ?? '',
    kota: o?.city ?? '',
    rayon: o?.rayon ?? '',
    lat_outlet: o?.latitude ?? '',
    lng_outlet: o?.longitude ?? '',
    lat_sales: v.sales_lat ?? '',
    lng_sales: v.sales_lng ?? '',
    jarak_sales_ke_outlet_m: dist,
  };
  const res = await fetch(SHEET_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Gagal kirim (HTTP ${res.status})`);
}
