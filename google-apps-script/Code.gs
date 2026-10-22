/**
 * Nearby Outlet Finder → Google Sheet
 * Menerima data kunjungan dari aplikasi dan menambahkannya sebagai baris baru di sheet "Kunjungan".
 * Cara pasang: lihat README bagian "Hasil kunjungan ke Google Sheet".
 */
const SHEET_NAME = 'Kunjungan';
const HEADERS = [
  'visit_id', 'waktu_kunjungan', 'dicatat_pada', 'salesman', 'hasil', 'tanggal_follow_up', 'catatan',
  'kode_outlet', 'nama_outlet', 'alamat', 'kelurahan', 'kecamatan', 'kota', 'rayon',
  'lat_outlet', 'lng_outlet', 'lat_sales', 'lng_sales', 'jarak_sales_ke_outlet_m', 'diterima_server',
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
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
    const sh = getSheet_();
    // Cegah dobel: visit_id yang sama tidak ditulis dua kali
    const last = sh.getLastRow();
    if (last > 1) {
      const found = sh.getRange(2, 1, last - 1, 1).createTextFinder(String(d.visit_id)).matchEntireCell(true).findNext();
      if (found) return out_({ ok: true, duplicate: true });
    }
    const tz = Session.getScriptTimeZone();
    const fmt = (iso) => (iso ? Utilities.formatDate(new Date(iso), tz, 'yyyy-MM-dd HH:mm') : '');
    const row = HEADERS.map((h) => {
      if (h === 'waktu_kunjungan' || h === 'dicatat_pada') return fmt(d[h]);
      if (h === 'diterima_server') return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
      return d[h] === undefined || d[h] === null ? '' : d[h];
    });
    sh.appendRow(row);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  getSheet_();
  return out_({ ok: true, info: 'Nearby Outlet Finder webhook aktif' });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
