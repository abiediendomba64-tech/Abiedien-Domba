import { Karyawan, CompanySettings } from '../types';
import { formatRupiah, standardizePhone, formatTanggal } from './formatters';

export type WATemplateType = 'resmi' | 'ringkas' | 'lapangan';

export function generateWhatsAppMessage(
  k: Karyawan,
  company: CompanySettings,
  template: WATemplateType = 'resmi'
): string {
  const tglFormatted = formatTanggal(k.tanggal);
  const totalRupiah = formatRupiah(k.total_gaji);
  const gajiHariRupiah = formatRupiah(k.gaji_per_hari);
  const isNonHarian = k.jenis_gaji !== 'Harian';
  const statusBadge = k.status === 'Bayar' 
    ? `✅ LUNAS / DIBAYAR (Tgl: ${tglFormatted})` 
    : `⏳ PENDING / BELUM DIBAYAR (Periode: ${tglFormatted})`;

  if (template === 'ringkas') {
    return (
`*SLIP GAJI - ${company.namaPerusahaan.toUpperCase()}*
Halo Sdr/i *${k.nama}* (${k.kode}),
Berikut ringkasan pembayaran Anda:
- Pekerjaan: ${k.pekerjaan}
- Sistem Upah: ${k.jenis_gaji} ${isNonHarian ? `(Nominal: ${gajiHariRupiah})` : `(${k.hari_kerja} hr x ${gajiHariRupiah})`}
${k.lembur_bonus ? `- Bonus/Lembur: ${formatRupiah(k.lembur_bonus)}\n` : ''}${k.potongan_kasbon ? `- Potongan/Kasbon: -${formatRupiah(k.potongan_kasbon)}\n` : ''}- *TOTAL DITERIMA*: *${totalRupiah}*
- Status: ${statusBadge}
- Periode: ${company.periodeGaji}

Terima kasih atas kerja sama dan dedikasi Anda!`
    ).trim();
  }

  if (template === 'lapangan') {
    return (
`🏗️ *SLIP UPAH KERJA LAPANGAN*
Proyek: *${company.namaProyek}*
Mandor/PJ: ${company.penanggungJawab}
----------------------------------------
Nama: *${k.nama}* [Kode: ${k.kode}]
Posisi: ${k.pekerjaan}
${isNonHarian ? `Sistem: ${k.jenis_gaji} (Nominal: ${gajiHariRupiah})` : `Hitungan: ${k.hari_kerja} hari x ${gajiHariRupiah}`}
${k.lembur_bonus ? `+ Tambahan/Lembur: ${formatRupiah(k.lembur_bonus)}\n` : ''}${k.potongan_kasbon ? `- Kasbon: ${formatRupiah(k.potongan_kasbon)}\n` : ''}----------------------------------------
💰 *TOTAL UPAH BERSIH*: *${totalRupiah}*
Status: ${statusBadge}
Tanggal Pembayaran: ${tglFormatted}
${k.catatan ? `Catatan: ${k.catatan}\n` : ''}
Harap periksa kembali uang yang diterima. Terima kasih!`
    ).trim();
  }

  // Default: Resmi / Lengkap
  return (
`📄 *SLIP GAJI RESMI KARYAWAN*
🏢 *${company.namaPerusahaan}*
📌 Periode: ${company.periodeGaji}
📅 Tanggal Periode: ${tglFormatted}
━━━━━━━━━━━━━━━━━━━━━━
👤 *DATA KARYAWAN*
• Nama: *${k.nama}*
• ID / Kode: *${k.kode}*
• Jabatan: ${k.pekerjaan}
• Sistem Upah: ${k.jenis_gaji}

📊 *RINCIAN PENDAPATAN*
${isNonHarian ? `• Nilai Pokok: ${gajiHariRupiah} (${k.jenis_gaji} - Di luar harian)
• Subtotal: ${formatRupiah(k.gaji_per_hari)}` : `• Upah Pokok: ${gajiHariRupiah} / hari
• Kehadiran: ${k.hari_kerja} hari kerja
• Subtotal: ${formatRupiah(k.gaji_per_hari * k.hari_kerja)}`}
${k.lembur_bonus ? `• Lembur / Bonus: ${formatRupiah(k.lembur_bonus)}\n` : ''}${k.potongan_kasbon ? `• Potongan / Kasbon: -${formatRupiah(k.potongan_kasbon)}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
💵 *TOTAL GAJI BERSIH*: *${totalRupiah}*
📌 Status Pembayaran: *${statusBadge}*
${k.catatan ? `📝 Catatan: ${k.catatan}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
_Dokumen ini diterbitkan secara digital oleh Sistem PayrollDB Pro._
Penanggung Jawab: *${company.penanggungJawab}*

Terima kasih atas dedikasi dan kerja sama Anda!`
  ).trim();
}

export function openWhatsApp(phone: string, text: string) {
  const cleanPhone = standardizePhone(phone);
  const encodedText = encodeURIComponent(text);
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}` 
    : `https://wa.me/?text=${encodedText}`;
  
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
