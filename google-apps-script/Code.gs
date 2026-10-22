/**
 * Nearby Outlet Finder → Google Sheet
 * Setiap kunjungan ditulis ke:
 *   - tab "SEMUA"  : rekap seluruh kunjungan
 *   - tab wilayah  : JAKTIM, JAKSEL, JAKUT, JAKPUS, JAKBAR, BEKASI, BOGOR, DEPOK, TANGSEL, KARAWANG, ...
 * Tab dibuat otomatis saat kunjungan pertama dari wilayah itu masuk.
 */
const ALL_TAB = 'SEMUA';
const HEADERS = [
  'visit_id', 'waktu_kunjungan', 'dicatat_pada', 'salesman', 'hasil', 'tanggal_follow_up', 'catatan',
  'kode_outlet', 'nama_outlet', 'alamat', 'kelurahan', 'kecamatan', 'kota', 'wilayah', 'rayon',
  'lat_outlet', 'lng_outlet', 'lat_sales', 'lng_sales', 'jarak_sales_ke_outlet_m', 'diterima_server',
];

function getTab_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#dbeafe');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const area = String(d.area || 'LAINNYA').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 30) || 'LAINNYA';
    d.wilayah = area;
    const all = getTab_(ALL_TAB);

    // Cegah dobel: visit_id yang sama tidak ditulis dua kali
    const last = all.getLastRow();
    if (last > 1) {
      const found = all.getRange(2, 1, last - 1, 1).createTextFinder(String(d.visit_id)).matchEntireCell(true).findNext();
      if (found) return out_({ ok: true, duplicate: true });
    }

    const tz = Session.getScriptTimeZone();
    const fmt = (iso) => (iso ? Utilities.formatDate(new Date(iso), tz, 'yyyy-MM-dd HH:mm') : '');
    const row = HEADERS.map((h) => {
      if (h === 'waktu_kunjungan' || h === 'dicatat_pada') return fmt(d[h]);
      if (h === 'diterima_server') return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
      return d[h] === undefined || d[h] === null ? '' : d[h];
    });
    all.appendRow(row);
    getTab_(area).appendRow(row);
    return out_({ ok: true, tab: area });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  getTab_(ALL_TAB);
  return out_({ ok: true, info: 'Nearby Outlet Finder webhook aktif (per wilayah)' });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
