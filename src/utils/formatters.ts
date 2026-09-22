import { Karyawan } from '../types';

export function formatRupiah(amount?: number): string {
  if (amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAngka(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatTanggal(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function standardizePhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62') && clean.length > 5) {
    clean = '62' + clean;
  }
  return clean;
}

export function terbilang(nominal: number): string {
  if (nominal === 0) return 'Nol Rupiah';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function bagi(n: number): string {
    if (n < 12) {
      return ' ' + satuan[Math.floor(n)];
    } else if (n < 20) {
      return bagi(n - 10) + ' Belas';
    } else if (n < 100) {
      return bagi(Math.floor(n / 10)) + ' Puluh' + bagi(n % 10);
    } else if (n < 200) {
      return ' Seratus' + bagi(n - 100);
    } else if (n < 1000) {
      return bagi(Math.floor(n / 100)) + ' Ratus' + bagi(n % 100);
    } else if (n < 2000) {
      return ' Seribu' + bagi(n - 1000);
    } else if (n < 1000000) {
      return bagi(Math.floor(n / 1000)) + ' Ribu' + bagi(n % 1000);
    } else if (n < 1000000000) {
      return bagi(Math.floor(n / 1000000)) + ' Juta' + bagi(n % 1000000);
    } else if (n < 1000000000000) {
      return bagi(Math.floor(n / 1000000000)) + ' Miliar' + bagi(n % 1000000000);
    }
    return '';
  }

  const hasil = bagi(Math.abs(nominal)).trim() + ' Rupiah';
  return nominal < 0 ? 'Minus ' + hasil : hasil;
}

export function exportCsv(
  targetOrFilename: Karyawan[] | string,
  filenameOrHeaders?: string | string[],
  customRows?: (string | number)[][]
) {
  let filename = 'export.csv';
  let headers: string[] = [];
  let rows: (string | number)[][] = [];

  if (Array.isArray(targetOrFilename)) {
    // Legacy / employee export
    filename = (filenameOrHeaders as string) || 'PayrollDB_Karyawan.csv';
    headers = [
      'id',
      'kode',
      'nama',
      'pekerjaan',
      'jenis_gaji',
      'gaji_per_hari',
      'hari_kerja',
      'lembur_bonus',
      'potongan_kasbon',
      'total_gaji',
      'tanggal',
      'status',
      'no_wa',
      'catatan'
    ];
    rows = targetOrFilename.map((k) => [
      k.id,
      `"${k.kode}"`,
      `"${k.nama.replace(/"/g, '""')}"`,
      `"${k.pekerjaan.replace(/"/g, '""')}"`,
      `"${k.jenis_gaji}"`,
      k.gaji_per_hari,
      k.hari_kerja,
      k.lembur_bonus || 0,
      k.potongan_kasbon || 0,
      k.total_gaji,
      `"${k.tanggal}"`,
      `"${k.status}"`,
      `"${k.no_wa || ''}"`,
      `"${(k.catatan || '').replace(/"/g, '""')}"`
    ]);
  } else {
    // Generic custom CSV export
    filename = targetOrFilename;
    headers = (filenameOrHeaders as string[]) || [];
    rows = customRows || [];
  }

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function calculateKasbonAge(tanggal: string, referenceDate?: string | Date): number {
  if (!tanggal) return 0;
  const kDate = new Date(tanggal + 'T00:00:00');
  if (isNaN(kDate.getTime())) return 0;
  
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - kDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function isKasbonOverdue(
  kasbon: { status: string; tanggal: string }, 
  thresholdDays: number = 30,
  referenceDate?: string | Date
): boolean {
  if (kasbon.status !== 'Belum Lunas') return false;
  const age = calculateKasbonAge(kasbon.tanggal, referenceDate);
  return age >= thresholdDays;
}

export function formatRupiahShort(value: number): string {
  if (value === 0) return 'Rp 0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  }
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

export function generateKasbonWhatsAppText(
  kasbon: { id: string; nominal: number; keperluan: string; tanggal: string; status: string },
  karyawanNama: string,
  companyNama: string,
  penanggungJawab: string
): string {
  return `*TANDA TERIMA KASBON / PINJAMAN KARYAWAN*
🏛️ *${companyNama}*
================================

Halo sdr/i *${karyawanNama}*,
Berikut rincian bukti kasbon / pinjaman kerja yang telah dicatat:

📅 *Tanggal*: ${formatTanggal(kasbon.tanggal)}
💰 *Nominal Kasbon*: *${formatRupiah(kasbon.nominal)}*
📝 *Keperluan*: ${kasbon.keperluan}
🏷️ *Status*: ${kasbon.status.toUpperCase()}

_Catatan:_
Nominal kasbon ini akan diperhitungkan atau dipotongkan otomatis pada slip pembayaran upah/gaji periode berikutnya sesuai kesepakatan bersama.

Tertanda,
*${penanggungJawab}*
Bendahara / Pimpinan Proyek
================================
_Disimpan otomatis via Payroll Pro_`;
}

export function generateOverdueKasbonWhatsAppReminder(
  kasbon: { id: string; nominal: number; keperluan: string; tanggal: string },
  karyawanNama: string,
  companyNama: string,
  penanggungJawab: string,
  daysOverdue: number
): string {
  return `*PEMBERITAHUAN JATUH TEMPO KASBON / PINJAMAN*
🏛️ *${companyNama}*
================================

Halo Sdr/i *${karyawanNama}*,
Kami menginformasikan bahwa catatan pinjaman/kasbon Anda:

📅 *Tanggal Pinjam*: ${formatTanggal(kasbon.tanggal)}
💰 *Nominal Pinjaman*: *${formatRupiah(kasbon.nominal)}*
📝 *Keperluan*: ${kasbon.keperluan}
⚠️ *Masa Pinjaman*: *${daysOverdue} Hari yang lalu* (>30 Hari / Jatuh Tempo)

Mohon koordinasi segera dengan pihak bendahara/mandor untuk konfirmasi pelunasan tunai atau rencana pemotongan langsung pada slip upah kerja periode terdekat.

Terima kasih atas kerja samanya.

Tertanda,
*${penanggungJawab}*
Manajemen Proyek & Keuangan
================================
_Sistem Notifikasi Otomatis Payroll Pro_`;
}


