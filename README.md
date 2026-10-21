# Nearby Outlet Finder 📍

Aplikasi web untuk tim sales: menemukan, memetakan, dan mengelola outlet di sekitar posisi GPS
pengguna — dengan peta interaktif OpenStreetMap, pencarian radius (Haversine), visit management,
import/export Excel-CSV, dan dashboard statistik.

## Fitur

| Fitur | Keterangan |
|---|---|
| **GPS** | Tombol "Gunakan Lokasi Saya" (Geolocation API), indikator akurasi, refresh, penanganan izin ditolak/GPS mati, plus input koordinat manual |
| **Peta interaktif** | Leaflet + OpenStreetMap, marker berwarna per status kunjungan (merah=belum, hijau=sudah, kuning=follow-up), klik marker → detail outlet, tombol navigasi Google Maps |
| **Pencarian radius** | 500 m / 1 / 3 / 5 / 10 km / custom, jarak Haversine, diurutkan terdekat → terjauh |
| **Filter** | Status kunjungan, rayon, salesman, kategori, teks (nama/alamat/kode) |
| **Database outlet** | Tambah / edit / hapus (dengan konfirmasi), cari, filter, validasi koordinat, deteksi duplikat |
| **Import Excel/CSV** | SheetJS + PapaParse, pemetaan kolom otomatis dari header, preview, hitung data valid/bermasalah/duplikat, konfirmasi sebelum simpan |
| **Export CSV** | Satu klik, semua kolom data model |
| **Visit management** | Status belum/sudah/follow-up, catatan kunjungan (waktu, sales, hasil, tanggal follow-up), riwayat tersimpan |
| **Dashboard** | Total outlet, aktif, di sekitar ≤5 km, belum dikunjungi, dikunjungi hari ini, perlu follow-up — semua dihitung dari data aktual |

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```


```

Lint & type check:

```bash
npm run lint
npm run typecheck
```

## Struktur

```
app/
  page.tsx          # Halaman Peta (GPS, radius, daftar outlet, detail, catat visit)
  outlets/page.tsx  # Database outlet (CRUD, import/export)
  visits/page.tsx   # Riwayat kunjungan
  dashboard/page.tsx# Statistik
components/         # MapView, VisitDialog, OutletForm, ImportDialog, Modal, SeedLoader
lib/
  store.ts          # Zustand + persist localStorage (data tidak hilang saat refresh)
  geo.ts            # Haversine, format jarak, validasi koordinat
  importUtils.ts    # Parsing XLSX/CSV + pemetaan kolom + validasi Zod + deteksi duplikat
  types.ts          # Outlet, Visit, UserLocation
  csv.ts            # Export CSV
public/seed-outlets.json  # Seed dari 3 file Excel asli (1.025 outlet unik)
supabase/schema.sql       # Skema opsional: tabel + RLS + indeks spasial PostGIS
```

## Data & sumber

- Seed `public/seed-outlets.json` berasal dari parsing tiga file Excel program AHS/DSA yang
  diunggah pengguna (BALINA AGUNG PERKASA). Duplikat digabung, koordinat di luar wilayah
  Indonesia dibuang — **tidak ada data lokasi yang dikarang**.
- Basemap: OpenStreetMap (hormati tile usage policy; jangan membebani server publik).
- Data toko pada peta hanyalah outlet internal database — bukan semua toko di OSM.

## Persistensi & multi-user (opsional)

Secara default data tersimpan di **localStorage** browser (persist saat refresh, offline, tanpa
server). Untuk multi-user, jalankan `supabase/schema.sql` di SQL Editor Supabase, isi
`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local` (lihat
`.env.example`), lalu arahkan `lib/store.ts` ke adapter Supabase. **Jangan pernah menaruh
service_role key / secret key di frontend.** Aplikasi meminta izin lokasi eksplisit dan hanya
menggunakan koordinat untuk fitur pencarian radius.

## Verifikasi perhitungan jarak

Jarak memakai rumus Haversine (radius bumi 6371 km). Verifikasi cepat: outlet pada koordinat yang
sama dengan pengguna harus menampilkan **0 m**; geser 0,01° lintang ≈ 1,11 km.
