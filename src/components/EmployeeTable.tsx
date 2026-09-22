import React from 'react';
import { 
  MessageSquare, 
  Printer, 
  Edit3, 
  Trash2, 
  Phone, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Karyawan, StatusPembayaran } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';

interface EmployeeTableProps {
  karyawanList: Karyawan[];
  onToggleStatus: (id: number | string, currentStatus: StatusPembayaran) => void;
  onOpenWhatsApp: (karyawan: Karyawan) => void;
  onOpenPrintSlip: (karyawan: Karyawan) => void;
  onEdit: (karyawan: Karyawan) => void;
  onDelete: (id: number | string, nama: string) => void;
  onAddNew?: () => void;
  onSeedSample?: () => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  karyawanList,
  onToggleStatus,
  onOpenWhatsApp,
  onOpenPrintSlip,
  onEdit,
  onDelete,
  onAddNew,
  onSeedSample
}) => {
  if (karyawanList.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
          <Briefcase className="w-7 h-7" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
          Data Pekerja Masih Kosong (Mode Data Real)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
          Sistem bersih siap digunakan untuk operasional riil usaha/proyek Anda. Silakan mulai dengan menambahkan pekerja lapangan, atau muat data contoh simulasi jika ingin mencoba.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+ Tambah Pekerja Pertama</span>
            </button>
          )}

          {onSeedSample && (
            <button
              type="button"
              onClick={onSeedSample}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Muat Contoh Data Simulasi (13-19 Sep)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Get distinct avatar colors based on first letter or code
  const getBadgeColor = (kode: string) => {
    const char = (kode || 'A').toUpperCase().charCodeAt(0);
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-teal-100 text-teal-700 border-teal-200',
    ];
    return colors[char % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Desktop & Tablet Table (Hidden on small mobile screens) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Karyawan & Kode</th>
                <th className="py-3.5 px-4">Pekerjaan</th>
                <th className="py-3.5 px-3">Jenis Gaji</th>
                <th className="py-3.5 px-3 text-right">Upah Harian</th>
                <th className="py-3.5 px-2 text-center">Hari</th>
                <th className="py-3.5 px-3 text-right">Gaji Pokok</th>
                <th className="py-3.5 px-4 text-right">Total Gaji</th>
                <th className="py-3.5 px-4 text-center">Status & Tanggal</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {karyawanList.map((k) => (
                <tr 
                  key={k.id} 
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Karyawan & Kode */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${getBadgeColor(k.kode)}`}>
                        {k.kode || k.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {k.nama}
                          {k.no_wa && (
                            <span title={`WhatsApp: ${k.no_wa}`}>
                              <Phone className="w-3 h-3 text-emerald-600 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Kode: <span className="font-semibold text-slate-600">{k.kode}</span> • ID #{k.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pekerjaan */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{k.pekerjaan}</div>
                    {k.catatan && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={k.catatan}>
                        {k.catatan}
                      </div>
                    )}
                  </td>

                  {/* Jenis Gaji */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                      k.jenis_gaji === 'Bulanan' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : k.jenis_gaji === 'Per Tanggal'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold'
                        : k.jenis_gaji === 'Dana Talang'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {k.jenis_gaji}
                    </span>
                  </td>

                  {/* Upah Harian */}
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-600">
                    {formatRupiah(k.gaji_per_hari)}
                  </td>

                  {/* Hari Kerja */}
                  <td className="py-3.5 px-2 text-center">
                    {k.jenis_gaji === 'Harian' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {k.hari_kerja} hr
                      </span>
                    ) : k.jenis_gaji === 'Per Tanggal' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]" title="Dibayar per tanggal di luar harian">
                        Per Tgl
                      </span>
                    ) : k.jenis_gaji === 'Dana Talang' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]" title="Handle Dana Talang Proyek">
                        Talang
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                        Bulanan
                      </span>
                    )}
                  </td>

                  {/* Gaji Pokok */}
                  <td className="py-3.5 px-3 text-right font-mono font-medium">
                    {Number(k.gaji_pokok) > 0 ? (
                      <span className="text-emerald-700 font-bold">
                        {formatRupiah(k.gaji_pokok || 0)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Total Gaji */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-sm text-slate-900 font-mono">
                      {formatRupiah(k.total_gaji)}
                    </div>
                    {(Number(k.lembur_bonus) > 0 || Number(k.potongan_kasbon) > 0) && (
                      <div className="text-[10px] text-slate-400">
                        {Number(k.lembur_bonus) > 0 && `+${formatRupiah(Number(k.lembur_bonus))} `}
                        {Number(k.potongan_kasbon) > 0 && `-${formatRupiah(Number(k.potongan_kasbon))}`}
                      </div>
                    )}
                  </td>

                  {/* Status Switcher & Date */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => onToggleStatus(k.id, k.status)}
                        title="Klik untuk ubah status pembayaran"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                          k.status === 'Bayar'
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        {k.status === 'Bayar' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Bayar</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 whitespace-nowrap" title={`Tanggal Periode: ${k.tanggal}`}>
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{k.tanggal ? formatTanggal(k.tanggal) : '-'}</span>
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* WhatsApp Button */}
                      <button
                        onClick={() => onOpenWhatsApp(k)}
                        title="Kirim Slip Gaji via WhatsApp"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Print Voucher / Slip Button */}
                      <button
                        onClick={() => onOpenPrintSlip(k)}
                        title="Cetak Struk / Slip Kwitansi"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-colors border border-slate-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(k)}
                        title="Edit Data Karyawan"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors border border-blue-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(k.id, k.nama)}
                        title="Hapus Data Karyawan"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Optimized for phones & quick field thumb interactions) */}
      <div className="md:hidden space-y-3">
        {karyawanList.map((k) => (
          <div 
            key={k.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            {/* Top Row: Name, Code, and Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base border shrink-0 ${getBadgeColor(k.kode)}`}>
                  {k.kode || k.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base leading-tight">
                    {k.nama}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-slate-700">{k.pekerjaan}</span>
                    <span>•</span>
                    <span className="text-[11px]">Kode: {k.kode}</span>
                  </div>
                </div>
              </div>

              {/* Status Switcher & Date */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  onClick={() => onToggleStatus(k.id, k.status)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                    k.status === 'Bayar'
                      ? 'bg-emerald-600 text-white border-emerald-700 active:bg-emerald-700'
                      : 'bg-amber-100 text-amber-900 border-amber-300 active:bg-amber-200'
                  }`}
                >
                  {k.status === 'Bayar' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{k.status === 'Bayar' ? 'Lunas (Bayar)' : 'Pending'}</span>
                </button>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{k.tanggal ? formatTanggal(k.tanggal) : 'Periode Berjalan'}</span>
                </span>
              </div>
            </div>

            {/* Calculations Breakdown Box */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs border border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Upah Harian</span>
                  <span className="font-semibold text-slate-700">
                    {formatRupiah(k.gaji_per_hari)}/hr
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hari Kerja</span>
                  <span className="font-bold text-slate-800">
                    {k.jenis_gaji === 'Harian' 
                      ? `${k.hari_kerja} Hari Kerja` 
                      : `${k.jenis_gaji} (Non-Harian)`}
                  </span>
                </div>
                {Number(k.gaji_pokok) > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gaji Pokok</span>
                    <span className="font-bold text-emerald-700">
                      {formatRupiah(k.gaji_pokok || 0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Periode / Tgl:</span>
                </span>
                <span className="font-semibold text-slate-700">
                  {k.tanggal ? formatTanggal(k.tanggal) : '-'}
                </span>
              </div>

              <div className="pt-1.5 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-slate-500 font-medium">Total Gaji Bersih:</span>
                <span className="font-extrabold text-base text-slate-900 font-mono">
                  {formatRupiah(k.total_gaji)}
                </span>
              </div>
            </div>

            {/* Catatan if any */}
            {k.catatan && (
              <div className="text-xs text-slate-500 bg-amber-50/70 p-2 rounded-md border border-amber-100">
                <span className="font-semibold text-amber-800">Catatan:</span> {k.catatan}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => onOpenWhatsApp(k)}
                className="col-span-2 py-2 px-3 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim WA</span>
              </button>

              <button
                onClick={() => onOpenPrintSlip(k)}
                className="py-2 px-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-1 border border-slate-200"
                title="Cetak Struk"
              >
                <Printer className="w-4 h-4" />
                <span>Slip</span>
              </button>

              <div className="flex gap-1.5">
                <button
                  onClick={() => onEdit(k)}
                  className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 flex items-center justify-center"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(k.id, k.nama)}
                  className="flex-1 py-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center justify-center"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
