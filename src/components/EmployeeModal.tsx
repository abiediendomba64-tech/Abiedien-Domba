import React, { useState, useEffect } from 'react';
import { X, Calculator, UserCheck, AlertCircle, Phone, DollarSign, Calendar } from 'lucide-react';
import { Karyawan, JenisGaji, StatusPembayaran } from '../types';
import { formatRupiah, standardizePhone } from '../utils/formatters';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (karyawan: Omit<Karyawan, 'id'> & { id?: number | string }) => void;
  initialData?: Karyawan | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [jenisGaji, setJenisGaji] = useState<JenisGaji>('Harian');
  const [gajiPokok, setGajiPokok] = useState<number>(0);
  const [gajiPerHari, setGajiPerHari] = useState<number>(120000);
  const [hariKerja, setHariKerja] = useState<number>(0);
  const [lemburBonus, setLemburBonus] = useState<number>(0);
  const [potonganKasbon, setPotonganKasbon] = useState<number>(0);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StatusPembayaran>('Pending');
  const [noWa, setNoWa] = useState('');
  const [catatan, setCatatan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize form with initialData when opened
  useEffect(() => {
    setFormError(null);
    if (initialData) {
      setKode(initialData.kode || '');
      setNama(initialData.nama || '');
      setPekerjaan(initialData.pekerjaan || '');
      setJenisGaji(initialData.jenis_gaji || 'Harian');
      setGajiPokok(initialData.gaji_pokok || 0);
      setGajiPerHari(initialData.gaji_per_hari || 0);
      setHariKerja(initialData.hari_kerja || 0);
      setLemburBonus(initialData.lembur_bonus || 0);
      setPotonganKasbon(initialData.potongan_kasbon || 0);
      setTanggal(initialData.tanggal || new Date().toISOString().split('T')[0]);
      setStatus(initialData.status || 'Pending');
      setNoWa(initialData.no_wa || '');
      setCatatan(initialData.catatan || '');
    } else {
      // Default new employee values
      setKode('');
      setNama('');
      setPekerjaan('');
      setJenisGaji('Harian');
      setGajiPokok(0);
      setGajiPerHari(120000);
      setHariKerja(0);
      setLemburBonus(0);
      setPotonganKasbon(0);
      setTanggal(new Date().toISOString().split('T')[0]);
      setStatus('Pending');
      setNoWa('');
      setCatatan('');
    }
  }, [initialData, isOpen]);

  // Auto-fill kode when nama changes if kode is still empty
  const handleNamaChange = (val: string) => {
    setNama(val);
    if (!initialData && !kode && val.trim().length > 0) {
      setKode(val.trim().charAt(0).toUpperCase());
    }
  };

  // Live calculation of total gaji: kombinasi (hari kerja * upah harian) + gaji pokok + lembur - kasbon
  const isNonHarian = jenisGaji === 'Per Tanggal' || jenisGaji === 'Bulanan' || jenisGaji === 'Dana Talang';
  const subtotalHarian = (Number(gajiPerHari) || 0) * (Number(hariKerja) || 0);
  const nominalGajiPokok = Number(gajiPokok) || 0;
  
  // Base earnings combines (hari kerja * upah harian) + gaji pokok
  const baseEarnings = isNonHarian
    ? (nominalGajiPokok > 0 ? nominalGajiPokok + subtotalHarian : (Number(gajiPerHari) || 0))
    : (subtotalHarian + nominalGajiPokok);
    
  const calculatedTotal = Math.max(0, baseEarnings + (Number(lemburBonus) || 0) - (Number(potonganKasbon) || 0));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setFormError('Nama karyawan wajib diisi');
      return;
    }

    onSave({
      id: initialData ? initialData.id : undefined,
      kode: kode.trim().toUpperCase() || nama.trim().charAt(0).toUpperCase(),
      nama: nama.trim(),
      pekerjaan: pekerjaan.trim() || 'Staf / Lapangan',
      jenis_gaji: jenisGaji,
      gaji_pokok: nominalGajiPokok,
      gaji_per_hari: Number(gajiPerHari) || 0,
      hari_kerja: Number(hariKerja) || 0,
      lembur_bonus: Number(lemburBonus) || 0,
      potongan_kasbon: Number(potonganKasbon) || 0,
      total_gaji: calculatedTotal,
      tanggal,
      status,
      no_wa: standardizePhone(noWa),
      catatan: catatan.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Isi rincian upah dan pekerjaan. Total gaji akan dihitung otomatis secara realtime.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            {/* Kode */}
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode / Inisial *
              </label>
              <input
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="A / E / R"
                maxLength={4}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-center uppercase"
                required
              />
            </div>

            {/* Nama */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Karyawan *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => handleNamaChange(e.target.value)}
                placeholder="Contoh: Abah / Eeng / Rohman"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pekerjaan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Pekerjaan / Posisi *
              </label>
              <input
                type="text"
                value={pekerjaan}
                onChange={(e) => setPekerjaan(e.target.value)}
                placeholder="Tukang Senior / Tukang Kayu / Kenek / Helper"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Jenis Gaji */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sistem Upah / Gaji *
              </label>
              <select
                value={jenisGaji}
                onChange={(e) => setJenisGaji(e.target.value as JenisGaji)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="Harian">Harian (Dihitung per hari kerja)</option>
                <option value="Per Tanggal">Per Tanggal (Contoh: Dafid Tgl 16 / Ompong Tgl 6 di luar harian)</option>
                <option value="Dana Talang">Dana Talang (Contoh: Bayu Handle Dana Talang Proyek)</option>
                <option value="Bulanan">Bulanan (Gaji tetap bulanan / periode)</option>
              </select>
            </div>
          </div>

          {/* Upah, Gaji Pokok & Hari Kerja */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* 1. Upah Harian */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upah Harian (Rp/Hari) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={gajiPerHari}
                  onChange={(e) => setGajiPerHari(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {formatRupiah(gajiPerHari)}/hari
              </span>
            </div>

            {/* 2. Hari Kerja */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isNonHarian ? 'Hari Kerja (Opsional)' : 'Jumlah Hari Kerja *'}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hariKerja}
                onChange={(e) => setHariKerja(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-center"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block text-center font-medium">
                Subtotal Harian: {formatRupiah(subtotalHarian)}
              </span>
            </div>

            {/* 3. Gaji Pokok (Terpisah dari Upah Harian) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Gaji Pokok (Rp)</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1 rounded-sm">Terpisah</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={gajiPokok}
                  onChange={(e) => setGajiPokok(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                {formatRupiah(nominalGajiPokok)}
              </span>
            </div>

            {isNonHarian && (
              <div className="col-span-1 sm:col-span-3 text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                💡 <span className="font-semibold">Aturan Khusus {jenisGaji}:</span> Mendukung kombinasi Gaji Pokok tetap + Upah Harian presensi jika ada.
              </div>
            )}

            {/* Lembur / Bonus Tambahan */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lembur / Bonus (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">+</span>
                <input
                  type="number"
                  min="0"
                  value={lemburBonus}
                  onChange={(e) => setLemburBonus(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                />
              </div>
            </div>

            {/* Potongan / Kasbon */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Potongan / Kasbon (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-600">-</span>
                <input
                  type="number"
                  min="0"
                  value={potonganKasbon}
                  onChange={(e) => setPotonganKasbon(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

          {/* Automatic Total Calculation Box */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-emerald-900 block">
                  Total Gaji Bersih (Kombinasi Otomatis):
                </span>
                <span className="text-[11px] text-emerald-700">
                  ({hariKerja} hr × {formatRupiah(gajiPerHari)}) {nominalGajiPokok > 0 && `+ Pokok ${formatRupiah(nominalGajiPokok)}`} {lemburBonus > 0 && `+ Lembur ${formatRupiah(lemburBonus)}`} {potonganKasbon > 0 && `- Kasbon ${formatRupiah(potonganKasbon)}`}
                </span>
              </div>
            </div>
            <div className="text-lg font-extrabold text-emerald-900 font-mono shrink-0 pl-2">
              {formatRupiah(calculatedTotal)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tanggal Periode / Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran / Periode *
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Status Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPembayaran)}
                className={`w-full px-3 py-2 text-sm font-bold border rounded-lg focus:outline-hidden ${
                  status === 'Bayar' 
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                    : 'border-amber-500 text-amber-800 bg-amber-50/50'
                }`}
              >
                <option value="Pending">⏳ Pending (Belum Dibayar)</option>
                <option value="Bayar">✅ Bayar (Lunas / Ditransfer)</option>
              </select>
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Nomor WhatsApp Karyawan (Untuk Slip Otomatis)</span>
              <span className="text-[10px] text-slate-400">Contoh: 081318575529 atau 62813...</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                placeholder="6281318575529"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pekerjaan / Memo (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Pekerjaan renovasi atap, borongan kusen, atau catatan kasbon"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
            >
              {initialData ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
