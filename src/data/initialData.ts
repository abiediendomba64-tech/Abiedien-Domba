import { Karyawan, CompanySettings } from '../types';

export const INITIAL_KARYAWAN: Karyawan[] = [
  {
    id: 1,
    kode: 'E',
    nama: 'Eeng',
    pekerjaan: 'Buruh Lapangan',
    jenis_gaji: 'Harian',
    gaji_pokok: 0,
    gaji_per_hari: 120000,
    hari_kerja: 6,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 720000,
    tanggal: '2026-09-19',
    status: 'Pending',
    no_wa: '6281318575529',
    catatan: '6 hari kerja periode 13-19 Sep'
  },
  {
    id: 2,
    kode: 'R',
    nama: 'Rohman',
    pekerjaan: 'Buruh Lapangan',
    jenis_gaji: 'Harian',
    gaji_pokok: 0,
    gaji_per_hari: 120000,
    hari_kerja: 6,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 720000,
    tanggal: '2026-09-19',
    status: 'Pending',
    no_wa: '6281318575529',
    catatan: '6 hari kerja periode 13-19 Sep'
  },
  {
    id: 3,
    kode: 'A',
    nama: 'Abah',
    pekerjaan: 'Buruh Lapangan',
    jenis_gaji: 'Harian',
    gaji_pokok: 0,
    gaji_per_hari: 120000,
    hari_kerja: 0,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 0,
    tanggal: '2026-09-19',
    status: 'Pending',
    no_wa: '6281318575529',
    catatan: 'Belum masuk kerja periode ini'
  },
  {
    id: 4,
    kode: 'E',
    nama: 'eteh',
    pekerjaan: 'Buruh Lapangan',
    jenis_gaji: 'Harian',
    gaji_pokok: 0,
    gaji_per_hari: 50000,
    hari_kerja: 0,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 0,
    tanggal: '2026-09-19',
    status: 'Pending',
    no_wa: '',
    catatan: 'Belum masuk kerja periode ini'
  },
  {
    id: 5,
    kode: 'D',
    nama: 'Dafid',
    pekerjaan: 'Tenaga Khusus (Per Tanggal 16)',
    jenis_gaji: 'Per Tanggal',
    gaji_pokok: 1000000,
    gaji_per_hari: 0,
    hari_kerja: 0,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 1000000,
    tanggal: '2026-09-16',
    status: 'Bayar',
    no_wa: '6281318575529',
    catatan: 'Dibayar per tanggal 16 sebesar Rp 1.000.000 (di luar perhitungan harian)'
  },
  {
    id: 6,
    kode: 'O',
    nama: 'Ompong',
    pekerjaan: 'Tenaga Khusus (Per Tanggal 6)',
    jenis_gaji: 'Per Tanggal',
    gaji_pokok: 700000,
    gaji_per_hari: 0,
    hari_kerja: 0,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 700000,
    tanggal: '2026-09-06',
    status: 'Bayar',
    no_wa: '6281318575529',
    catatan: 'Dibayar per tanggal 6 sebesar Rp 700.000 di luar perhitungan harian'
  },
  {
    id: 7,
    kode: 'B',
    nama: 'Bayu',
    pekerjaan: 'Handle Dana Talang',
    jenis_gaji: 'Dana Talang',
    gaji_pokok: 3000000,
    gaji_per_hari: 0,
    hari_kerja: 0,
    lembur_bonus: 0,
    potongan_kasbon: 0,
    total_gaji: 3000000,
    tanggal: '2026-09-15',
    status: 'Bayar',
    no_wa: '6281318575529',
    catatan: 'Handle Dana Talang operasional proyek sebesar Rp 3.000.000'
  }
];

export const INITIAL_COMPANY: CompanySettings = {
  namaPerusahaan: 'PayrollDB Pro Mandiri',
  namaProyek: 'Proyek Konstruksi & Operasional',
  penanggungJawab: 'Abiedien Domba',
  periodeGaji: '13 Sep - 19 Sep 2026',
  tarifLemburPerJam: 20000,
  noWaDefault: '+6281318575529',
  periodeStartDate: '2026-09-13',
  periodeEndDate: '2026-09-19'
};

// Seed 7-day attendance for 13 Sep - 19 Sep 2026
// Eeng (id 1) & Rohman (id 2) attend 6 days (Sen 14 s/d Sab 19). Min 13 is off (-).
// Abah, eteh, Dafid, Ompong are 0 days (-).
export const INITIAL_ABSENSI: { id: string; karyawan_id: number; tanggal: string; status: 'Hadir' | 'Setengah Hari' | 'Izin' | 'Sakit' | 'Alpa'; jam_lembur?: number; catatan?: string }[] = [
  // 2026-09-13 (Minggu) - All 0 / off
  { id: 'abs-1-13', karyawan_id: 1, tanggal: '2026-09-13', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-2-13', karyawan_id: 2, tanggal: '2026-09-13', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-3-13', karyawan_id: 3, tanggal: '2026-09-13', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-13', karyawan_id: 4, tanggal: '2026-09-13', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-13', karyawan_id: 5, tanggal: '2026-09-13', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-13', karyawan_id: 6, tanggal: '2026-09-13', status: 'Alpa', jam_lembur: 0 },

  // 2026-09-14 (Senin) - Eeng & Rohman 1
  { id: 'abs-1-14', karyawan_id: 1, tanggal: '2026-09-14', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-2-14', karyawan_id: 2, tanggal: '2026-09-14', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-3-14', karyawan_id: 3, tanggal: '2026-09-14', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-14', karyawan_id: 4, tanggal: '2026-09-14', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-14', karyawan_id: 5, tanggal: '2026-09-14', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-14', karyawan_id: 6, tanggal: '2026-09-14', status: 'Alpa', jam_lembur: 0 },

  // 2026-09-15 (Selasa) - Eeng & Rohman 1
  { id: 'abs-1-15', karyawan_id: 1, tanggal: '2026-09-15', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-2-15', karyawan_id: 2, tanggal: '2026-09-15', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-3-15', karyawan_id: 3, tanggal: '2026-09-15', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-15', karyawan_id: 4, tanggal: '2026-09-15', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-15', karyawan_id: 5, tanggal: '2026-09-15', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-15', karyawan_id: 6, tanggal: '2026-09-15', status: 'Alpa', jam_lembur: 0 },

  // 2026-09-16 (Rabu) - Eeng & Rohman 1
  { id: 'abs-1-16', karyawan_id: 1, tanggal: '2026-09-16', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-2-16', karyawan_id: 2, tanggal: '2026-09-16', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-3-16', karyawan_id: 3, tanggal: '2026-09-16', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-16', karyawan_id: 4, tanggal: '2026-09-16', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-16', karyawan_id: 5, tanggal: '2026-09-16', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-16', karyawan_id: 6, tanggal: '2026-09-16', status: 'Alpa', jam_lembur: 0 },

  // 2026-09-17 (Kamis) - Eeng & Rohman 1
  { id: 'abs-1-17', karyawan_id: 1, tanggal: '2026-09-17', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-2-17', karyawan_id: 2, tanggal: '2026-09-17', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-3-17', karyawan_id: 3, tanggal: '2026-09-17', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-17', karyawan_id: 4, tanggal: '2026-09-17', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-17', karyawan_id: 5, tanggal: '2026-09-17', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-17', karyawan_id: 6, tanggal: '2026-09-17', status: 'Alpa', jam_lembur: 0 },

  // 2026-09-18 (Jumat) - Eeng & Rohman 1
  { id: 'abs-1-18', karyawan_id: 1, tanggal: '2026-09-18', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-2-18', karyawan_id: 2, tanggal: '2026-09-18', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-3-18', karyawan_id: 3, tanggal: '2026-09-18', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-18', karyawan_id: 4, tanggal: '2026-09-18', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-18', karyawan_id: 5, tanggal: '2026-09-18', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-18', karyawan_id: 6, tanggal: '2026-09-18', status: 'Alpa', jam_lembur: 0 },

  // 2026-09-19 (Sabtu) - Eeng & Rohman 1
  { id: 'abs-1-19', karyawan_id: 1, tanggal: '2026-09-19', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-2-19', karyawan_id: 2, tanggal: '2026-09-19', status: 'Hadir', jam_lembur: 0 },
  { id: 'abs-3-19', karyawan_id: 3, tanggal: '2026-09-19', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-4-19', karyawan_id: 4, tanggal: '2026-09-19', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-5-19', karyawan_id: 5, tanggal: '2026-09-19', status: 'Alpa', jam_lembur: 0 },
  { id: 'abs-6-19', karyawan_id: 6, tanggal: '2026-09-19', status: 'Alpa', jam_lembur: 0 }
];

export const INITIAL_KASBON = [
  {
    id: 'ksb-4',
    karyawan_id: 3, // Abah
    tanggal: '2026-08-10',
    nominal: 250000,
    keperluan: 'Biaya tambal ban & sparepart motor darurat',
    status: 'Belum Lunas' as const,
    keterangan: 'Pinjaman bulan lalu - telah melewati batas waktu (>30 hari)'
  },
  {
    id: 'ksb-5',
    karyawan_id: 2, // Rohman
    tanggal: '2026-07-22',
    nominal: 150000,
    keperluan: 'Keperluan mendesak keluarga di kampung',
    status: 'Belum Lunas' as const,
    keterangan: 'Pinjaman lama - segera tindaklanjuti pelunasan (>30 hari)'
  },
  {
    id: 'ksb-1',
    karyawan_id: 1,
    tanggal: '2026-09-18',
    nominal: 100000,
    keperluan: 'Kebutuhan obat & susu anak',
    status: 'Belum Lunas' as const,
    keterangan: 'Rencana potong di gaji minggu ini'
  },
  {
    id: 'ksb-2',
    karyawan_id: 2,
    tanggal: '2026-09-19',
    nominal: 50000,
    keperluan: 'Beli bensin motor mogok',
    status: 'Belum Lunas' as const,
    keterangan: 'Disetujui mandor'
  },
  {
    id: 'ksb-3',
    karyawan_id: 3,
    tanggal: '2026-09-10',
    nominal: 150000,
    keperluan: 'Tambahan bekal pulang kampung',
    status: 'Lunas' as const,
    tanggal_lunas: '2026-09-17',
    keterangan: 'Sudah dibayar cash langsung'
  }
];

export const INITIAL_TRANSAKSI_KAS = [
  // --- BULAN JULI 2026 ---
  {
    id: 'kas-jul-1',
    tanggal: '2026-07-05',
    tipe: 'Masuk' as const,
    kategori: 'Modal Awal' as const,
    nominal: 5000000,
    deskripsi: 'Modal Awal Kas Lapangan Proyek Tahap 1',
    pihak_terkait: 'Bendahara Proyek',
    nomor_nota: 'KAS-07/001',
    catatan: 'Dana kas awal lapangan',
    created_at: '2026-07-05 09:00'
  },
  {
    id: 'kas-jul-2',
    tanggal: '2026-07-12',
    tipe: 'Masuk' as const,
    kategori: 'Termin Owner' as const,
    nominal: 12000000,
    deskripsi: 'Pencairan Termin Pertama (DP Proyek 20%) dari Owner',
    pihak_terkait: 'Bpk. H. Rahmat (Owner)',
    nomor_nota: 'TRM-07/001',
    catatan: 'Transfer rekening operasional',
    created_at: '2026-07-12 10:00'
  },
  {
    id: 'kas-jul-3',
    tanggal: '2026-07-15',
    tipe: 'Keluar' as const,
    kategori: 'Material' as const,
    nominal: 7800000,
    deskripsi: 'Batu Kali, Pasir Pasang 2 Truk, Semen 50 Sak untuk Pondasi',
    pihak_terkait: 'TB. Sinar Jaya Abadi',
    nomor_nota: 'INV-7102',
    catatan: 'Pondasi tapak awal',
    created_at: '2026-07-15 14:00'
  },
  {
    id: 'kas-jul-4',
    tanggal: '2026-07-20',
    tipe: 'Keluar' as const,
    kategori: 'Operasional' as const,
    nominal: 1250000,
    deskripsi: 'Konsumsi Tukang, Air Galon, Pembersihan Lahan & Keamanan',
    pihak_terkait: 'Warung Bu Sri & Karang Taruna',
    nomor_nota: 'NOTA-07-1',
    catatan: 'Biaya operasional lapangan Juli',
    created_at: '2026-07-20 16:30'
  },
  {
    id: 'kas-jul-5',
    tanggal: '2026-07-28',
    tipe: 'Keluar' as const,
    kategori: 'Gaji & Upah' as const,
    nominal: 3400000,
    deskripsi: 'Upah Tenaga Kerja Borongan Penggalian & Pondasi',
    pihak_terkait: 'Mandor Lapangan',
    nomor_nota: 'UPH-07/01',
    catatan: 'Gaji tukang periode akhir Juli',
    created_at: '2026-07-28 17:00'
  },

  // --- BULAN AGUSTUS 2026 ---
  {
    id: 'kas-agt-1',
    tanggal: '2026-08-08',
    tipe: 'Masuk' as const,
    kategori: 'Termin Owner' as const,
    nominal: 18000000,
    deskripsi: 'Pencairan Termin Tahap 1.5 (Progres Struktur 35%)',
    pihak_terkait: 'Bpk. H. Rahmat (Owner)',
    nomor_nota: 'TRM-08/001',
    catatan: 'Pencairan progres kolom & balok beton',
    created_at: '2026-08-08 11:00'
  },
  {
    id: 'kas-agt-2',
    tanggal: '2026-08-14',
    tipe: 'Keluar' as const,
    kategori: 'Material' as const,
    nominal: 9600000,
    deskripsi: 'Besi Beton Ulir 12mm & 10mm, Kawat Bendrat, Triplek Cor 9mm',
    pihak_terkait: 'Distributor Besi Baja Perkasa',
    nomor_nota: 'INV-8831',
    catatan: 'Bahan cor lantai 1 & kolom praktis',
    created_at: '2026-08-14 13:30'
  },
  {
    id: 'kas-agt-3',
    tanggal: '2026-08-18',
    tipe: 'Keluar' as const,
    kategori: 'Operasional' as const,
    nominal: 1450000,
    deskripsi: 'Sewa Stamper Kuda Pemadat Tanah & Konsumsi Lembur Tukang',
    pihak_terkait: 'Rental Alat Bangunan Jaya',
    nomor_nota: 'OPR-08/18',
    catatan: 'Lembur pengecoran',
    created_at: '2026-08-18 18:00'
  },
  {
    id: 'kas-agt-4',
    tanggal: '2026-08-25',
    tipe: 'Keluar' as const,
    kategori: 'Biaya Tak Terduga' as const,
    nominal: 750000,
    deskripsi: 'Perbaikan Instalasi Listrik Kerja & Pompa Air Celup Rusak',
    pihak_terkait: 'Servis Listrik Tehnik',
    nomor_nota: 'NOTA-082',
    catatan: 'Pompa terendam lumpur',
    created_at: '2026-08-25 15:00'
  },
  {
    id: 'kas-agt-5',
    tanggal: '2026-08-30',
    tipe: 'Keluar' as const,
    kategori: 'Gaji & Upah' as const,
    nominal: 4100000,
    deskripsi: 'Upah Tukang & Kenek Periode Agustus Akhir',
    pihak_terkait: 'Tim Tukang',
    nomor_nota: 'UPH-08/02',
    catatan: 'Lunas',
    created_at: '2026-08-30 17:00'
  },

  // --- BULAN SEPTEMBER 2026 ---
  {
    id: 'kas-talang-1',
    tanggal: '2026-09-15',
    tipe: 'Masuk' as const,
    kategori: 'Dana Talang' as const,
    nominal: 3000000,
    deskripsi: 'Dana Talang Operasional Proyek Dihandle oleh Bayu',
    pihak_terkait: 'Bayu (Handle Dana Talang)',
    nomor_nota: 'TLG-09/001',
    catatan: 'Dana talang operasional proyek Rp 3.000.000 dihandle oleh Bayu',
    created_at: '2026-09-15 08:00'
  },
  {
    id: 'kas-1',
    tanggal: '2026-09-15',
    tipe: 'Masuk' as const,
    kategori: 'Termin Owner' as const,
    nominal: 15000000,
    deskripsi: 'Pencairan Dana Termin Tahap 2 dari Owner Proyek',
    pihak_terkait: 'Bpk. H. Rahmat (Owner)',
    nomor_nota: 'TRM-09/002',
    catatan: 'Transfer via BCA',
    created_at: '2026-09-15 08:30'
  },
  {
    id: 'kas-2',
    tanggal: '2026-09-15',
    tipe: 'Masuk' as const,
    kategori: 'Modal Awal' as const,
    nominal: 3000000,
    deskripsi: 'Kas Awal Lapangan / Petty Cash Mandor',
    pihak_terkait: 'Bendahara Proyek',
    nomor_nota: 'KAS-09/001',
    catatan: 'Tunai dipegang mandor',
    created_at: '2026-09-15 09:00'
  },
  {
    id: 'kas-3',
    tanggal: '2026-09-16',
    tipe: 'Keluar' as const,
    kategori: 'Material' as const,
    nominal: 4250000,
    deskripsi: 'Pembelian Semen Padang 40 sak, Pasir Cor 1 truk, & Paku',
    pihak_terkait: 'TB. Sinar Jaya Abadi',
    nomor_nota: 'INV-78219',
    catatan: 'Lunas dibayar tunai',
    created_at: '2026-09-16 11:15'
  },
  {
    id: 'kas-4',
    tanggal: '2026-09-17',
    tipe: 'Keluar' as const,
    kategori: 'Operasional' as const,
    nominal: 480000,
    deskripsi: 'Konsumsi Makan Siang Tukang, Galon Air Mineral, & Kopi (3 Hari)',
    pihak_terkait: 'Warung Bu Sri',
    nomor_nota: 'NOTA-014',
    catatan: 'Konsumsi rutin lapangan',
    created_at: '2026-09-17 13:00'
  },
  {
    id: 'kas-5',
    tanggal: '2026-09-18',
    tipe: 'Keluar' as const,
    kategori: 'Biaya Tak Terduga' as const,
    nominal: 350000,
    deskripsi: 'Sewa Mesin Molen Tambahan Mendadak & Tambal Ban Mobil Pick Up',
    pihak_terkait: 'Rental Alat Bangunan Jaya',
    nomor_nota: 'RENT-092',
    catatan: 'Pengecoran lantai 2 butuh cepat',
    created_at: '2026-09-18 15:45'
  },
  {
    id: 'kas-6',
    tanggal: '2026-09-19',
    tipe: 'Keluar' as const,
    kategori: 'Biaya Tak Terduga' as const,
    nominal: 180000,
    deskripsi: 'Beli Terpal Biru A3 (4x6m) Darurat Hujan Deras Lindungi Semen',
    pihak_terkait: 'Toko Plastik Terpal Utama',
    nomor_nota: 'NOTA-332',
    catatan: 'Material semen terselamatkan dari hujan lebat',
    created_at: '2026-09-19 16:30'
  },
  {
    id: 'kas-7',
    tanggal: '2026-09-19',
    tipe: 'Keluar' as const,
    kategori: 'Kasbon' as const,
    nominal: 150000,
    deskripsi: 'Kasbon Tunai Tukang Abah & Eeng',
    pihak_terkait: 'Abah & Eeng',
    nomor_nota: 'KSB-09/19',
    catatan: 'Dicatat di buku kasbon juga',
    created_at: '2026-09-19 17:00'
  }
];

// Audit log starts empty. Audit entries must represent actions actually performed
// in the current browser/session; demo history must never be presented as real audit evidence.
export const INITIAL_AUDIT_LOG: any[] = [];
