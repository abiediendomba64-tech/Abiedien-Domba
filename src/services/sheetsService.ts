import { Karyawan } from '../types';

export const APPS_SCRIPT_TEMPLATE = `// ============================================================
// Google Apps Script: REST API PayrollDB Pro (100% GRATIS)
// 1. Buat Google Sheet baru dengan nama "PayrollDB"
// 2. Beri nama Sheet pertama: "karyawan"
// 3. Masukkan Header di baris 1:
//    id | kode | nama | pekerjaan | jenis_gaji | gaji_per_hari | hari_kerja | total_gaji | tanggal | status | no_wa | catatan
// 4. Buka Ekstensi > Apps Script, paste kode ini, lalu Deploy > Web App.
// ============================================================

const SHEET_NAME = "karyawan";

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
}

function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON([]);
    }
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
    return responseJSON(rows);
  } catch (err) {
    return responseJSON({ error: err.message }, 500);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const method = String(body._method || "POST").toUpperCase();
    if (method === "PUT") return updateEmployee(body);
    if (method === "DELETE") return deleteEmployee(body);
    if (method !== "POST") return responseJSON({ success: false, error: "Method tidak didukung" }, 400);

    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const newId = data.length > 1 ? Number(data[data.length - 1][0]) + 1 : 1;
    const newRow = [
      body.id || newId,
      body.kode || "",
      body.nama || "",
      body.pekerjaan || "",
      body.jenis_gaji || "Harian",
      Number(body.gaji_per_hari) || 0,
      Number(body.hari_kerja) || 0,
      Number(body.total_gaji) || (Number(body.gaji_per_hari) * Number(body.hari_kerja)),
      body.tanggal || new Date().toISOString().split("T")[0],
      body.status || "Pending",
      body.no_wa || "",
      body.catatan || ""
    ];
    sheet.appendRow(newRow);
    return responseJSON({ success: true, operation: "created", id: body.id || newId });
  } catch (err) {
    return responseJSON({ success: false, error: err.message }, 500);
  }
}

function updateEmployee(body) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const id = body.id;
  const rowIndex = data.findIndex(r => String(r[0]) === String(id));
  if (rowIndex <= 0) return responseJSON({ success: false, error: "Data karyawan tidak ditemukan" }, 404);

  const updatedRow = [
    id, body.kode || "", body.nama || "", body.pekerjaan || "",
    body.jenis_gaji || "Harian", Number(body.gaji_per_hari) || 0,
    Number(body.hari_kerja) || 0, Number(body.total_gaji) || 0,
    body.tanggal || "", body.status || "Pending", body.no_wa || "", body.catatan || ""
  ];
  sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
  return responseJSON({ success: true, operation: "updated", id });
}

function deleteEmployee(body) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const id = body.id;
  const rowIndex = data.findIndex(r => String(r[0]) === String(id));
  if (rowIndex <= 0) return responseJSON({ success: false, error: "Data karyawan tidak ditemukan" }, 404);
  sheet.deleteRow(rowIndex + 1);
  return responseJSON({ success: true, operation: "deleted", id });
}

function doPut(e) {
  try {
    const sheet = getSheet();
    const body = JSON.parse(e.postData.contents);
    const id = body.id;
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const rowIndex = data.findIndex(r => String(r[0]) === String(id));
    if (rowIndex > 0) {
      const updatedRow = [
        id,
        body.kode,
        body.nama,
        body.pekerjaan,
        body.jenis_gaji,
        body.gaji_per_hari,
        body.hari_kerja,
        body.total_gaji,
        body.tanggal,
        body.status,
        body.no_wa,
        body.catatan || ""
      ];
      sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      return responseJSON({ success: true });
    } else {
      return responseJSON({ error: "Data karyawan tidak ditemukan" }, 404);
    }
  } catch (err) {
    return responseJSON({ error: err.message }, 500);
  }
}

function doDelete(e) {
  try {
    const sheet = getSheet();
    const body = JSON.parse(e.postData.contents);
    const id = body.id;
    const data = sheet.getDataRange().getValues();

    const rowIndex = data.findIndex(r => String(r[0]) === String(id));
    if (rowIndex > 0) {
      sheet.deleteRow(rowIndex + 1);
      return responseJSON({ success: true });
    } else {
      return responseJSON({ error: "Data tidak ditemukan" }, 404);
    }
  } catch (err) {
    return responseJSON({ error: err.message }, 500);
  }
}

function responseJSON(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export async function fetchGoogleSheetData(url: string): Promise<Karyawan[]> {
  if (!url || !url.startsWith('http')) {
    throw new Error('URL Google Apps Script tidak valid');
  }

  // Google Apps Script redirects with 302, fetch handles follow automatically
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data dari Google Sheets (${response.status})`);
  }

  const raw = await response.json();
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => ({
      id: item.id || idx + 1,
      kode: String(item.kode || ''),
      nama: String(item.nama || ''),
      pekerjaan: String(item.pekerjaan || item.jenis_pekerjaan || ''),
      jenis_gaji: item.jenis_gaji === 'Bulanan' ? 'Bulanan' : 'Harian',
      gaji_per_hari: Number(item.gaji_per_hari) || 0,
      hari_kerja: Number(item.hari_kerja) || 0,
      lembur_bonus: Number(item.lembur_bonus) || 0,
      potongan_kasbon: Number(item.potongan_kasbon) || 0,
      total_gaji: Number(item.total_gaji) || (Number(item.gaji_per_hari) * Number(item.hari_kerja)),
      tanggal: String(item.tanggal || item.tanggal_mulai || new Date().toISOString().split('T')[0]),
      status: item.status === 'Bayar' ? 'Bayar' : 'Pending',
      no_wa: String(item.no_wa || ''),
      catatan: String(item.catatan || ''),
    }));
  }
  return [];
}

export async function sendToGoogleSheet(url: string, action: 'POST' | 'PUT' | 'DELETE', payload: any) {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'URL Google Apps Script belum diisi' };
  }

  try {
    // Standard Google Apps Script deployment responds to POST reliably
    // Often with Apps Script, CORS preflights on PUT/DELETE can fail, so we send JSON payload via POST or standard methods
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Prevents CORS preflight issues in Google Apps Script
      },
      body: JSON.stringify({ ...payload, _method: action }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return { success: false, error: result?.error || `HTTP ${response.status}`, data: result };
    }
    if (!result || result.success !== true) {
      return { success: false, error: result?.error || 'Google Apps Script tidak mengonfirmasi operasi berhasil', data: result };
    }
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal terhubung ke Google Apps Script' };
  }
}
