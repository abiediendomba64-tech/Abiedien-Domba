export type JenisGaji = 'Harian' | 'Bulanan' | 'Per Tanggal' | 'Dana Talang';
export type StatusPembayaran = 'Pending' | 'Bayar';
export type StatusKehadiran = 'Hadir' | 'Setengah Hari' | 'Izin' | 'Sakit' | 'Alpa';
export type StatusKasbon = 'Belum Lunas' | 'Lunas' | 'Dipotong Gaji';
export type ActiveTab = 'penggajian' | 'absensi' | 'kasbon' | 'keuangan' | 'laporan' | 'audit';

export type TipeKas = 'Masuk' | 'Keluar';
export type KategoriKas = 
  | 'Material' 
  | 'Operasional' 
  | 'Biaya Tak Terduga' 
  | 'Gaji & Upah' 
  | 'Kasbon' 
  | 'Termin Owner' 
  | 'Modal Awal' 
  | 'Dana Talang'
  | 'Lainnya';

export interface Karyawan {
  id: number | string;
  kode: string;
  nama: string;
  pekerjaan: string;
  jenis_gaji: JenisGaji;
  gaji_pokok?: number; // Gaji Pokok tetap / bulanan terpisah dari upah harian
  gaji_per_hari: number; // Tarif Upah Harian (Rp/hari)
  hari_kerja: number;
  lembur_bonus?: number;
  potongan_kasbon?: number;
  total_gaji: number;
  tanggal: string;
  status: StatusPembayaran;
  no_wa: string;
  catatan?: string;
  updated_at?: string;
}

export interface AbsensiRecord {
  id: string;
  karyawan_id: number | string;
  tanggal: string; // YYYY-MM-DD
  status: StatusKehadiran;
  jam_lembur?: number;
  catatan?: string;
}

export interface KasbonRecord {
  id: string;
  karyawan_id: number | string;
  tanggal: string; // YYYY-MM-DD
  nominal: number;
  keperluan: string;
  status: StatusKasbon;
  tanggal_lunas?: string;
  keterangan?: string;
}

export interface TransaksiKas {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tipe: TipeKas;
  kategori: KategoriKas;
  nominal: number;
  deskripsi: string;
  pihak_terkait?: string; // Penerima atau Penyetor
  nomor_nota?: string;
  catatan?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target?: string;
  details: string;
}

export interface CompanySettings {
  namaPerusahaan: string;
  namaProyek: string;
  penanggungJawab: string;
  periodeGaji: string;
  tarifLemburPerJam?: number;
  noWaDefault?: string;
  periodeStartDate?: string;
  periodeEndDate?: string;
}

export interface GoogleSheetsConfig {
  scriptUrl: string;
  autoSync: boolean;
  lastSync?: string;
}


