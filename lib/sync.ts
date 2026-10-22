import { SHEET_WEBHOOK_URL } from './config';
import { haversineKm } from './geo';
import type { Outlet, Visit } from './types';

export const syncEnabled = () => SHEET_WEBHOOK_URL.trim().length > 0;

// Kirim satu kunjungan ke Google Sheet. Apps Script tidak mengirim header CORS,
// jadi pakai mode no-cors (respons tidak bisa dibaca); gagal jaringan = lempar error.
export async function sendVisit(v: Visit, o: Outlet | undefined): Promise<void> {
  const dist =
    o && v.sales_lat != null && v.sales_lng != null
      ? Math.round(haversineKm(v.sales_lat, v.sales_lng, o.latitude, o.longitude) * 1000)
      : '';
  const payload = {
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
  await fetch(SHEET_WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}
