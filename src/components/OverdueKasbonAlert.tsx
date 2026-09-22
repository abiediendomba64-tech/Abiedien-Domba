import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  Wallet,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { KasbonRecord, Karyawan, CompanySettings } from '../types';
import { 
  formatRupiah, 
  formatTanggal, 
  calculateKasbonAge, 
  standardizePhone, 
  generateOverdueKasbonWhatsAppReminder 
} from '../utils/formatters';

interface OverdueKasbonAlertProps {
  overdueKasbonList: KasbonRecord[];
  karyawanList: Karyawan[];
  onNavigateToKasbon: () => void;
  company: CompanySettings;
}

export const OverdueKasbonAlert: React.FC<OverdueKasbonAlertProps> = ({
  overdueKasbonList,
  karyawanList,
  onNavigateToKasbon,
  company
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (overdueKasbonList.length === 0) return null;

  const totalNominalOverdue = overdueKasbonList.reduce(
    (acc, curr) => acc + (Number(curr.nominal) || 0), 
    0
  );

  const getKaryawan = (karyawanId: number | string) => {
    return karyawanList.find((k) => String(k.id) === String(karyawanId));
  };

  const handleSendWhatsApp = (kasbon: KasbonRecord) => {
    const k = getKaryawan(kasbon.karyawan_id);
    const nama = k?.nama || `Pekerja #${kasbon.karyawan_id}`;
    const days = calculateKasbonAge(kasbon.tanggal);
    const text = generateOverdueKasbonWhatsAppReminder(
      kasbon,
      nama,
      company.namaPerusahaan,
      company.penanggungJawab,
      days
    );
    const phone = k?.no_wa ? standardizePhone(k.no_wa) : '';
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` 
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="mb-6 bg-linear-to-r from-rose-50 via-amber-50/70 to-orange-50 rounded-2xl border-2 border-rose-300 p-4 sm:p-5 shadow-sm transition-all relative overflow-hidden no-print">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-200/40 rounded-full blur-2xl pointer-events-none" />

      {/* Main Alert Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-rose-100">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase">
                Peringatan Otomatis: Jatuh Tempo (&gt;30 Hari)
              </span>
              <span className="text-xs font-bold text-rose-900">
                {overdueKasbonList.length} Kasbon Perlu Tindak Lanjut Segera
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-snug">
              Total Tunggakan: <span className="text-rose-700 font-mono">{formatRupiah(totalNominalOverdue)}</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Terdapat pinjaman kasbon yang belum lunas dan telah berumur lebih dari 30 hari sejak tanggal peminjaman.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={onNavigateToKasbon}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Tindak Lanjuti di Tab Kasbon</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/80 hover:bg-white text-slate-600 rounded-xl border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title={isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian'}
          >
            {isExpanded ? (
              <>
                <span className="text-[11px] hidden sm:inline">Tutup</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span className="text-[11px] hidden sm:inline">Lihat Pekerja</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Overdue List */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-rose-200/80 grid grid-cols-1 md:grid-cols-2 gap-2.5 relative z-10">
          {overdueKasbonList.map((item) => {
            const k = getKaryawan(item.karyawan_id);
            const days = calculateKasbonAge(item.tanggal);

            return (
              <div
                key={item.id}
                className="bg-white/95 rounded-xl border border-rose-200 p-3 shadow-2xs flex items-center justify-between gap-3 hover:border-rose-400 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {k?.nama || `Pekerja #${item.karyawan_id}`}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold shrink-0">
                      Lewat {days} Hari
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-rose-700 font-mono">
                      {formatRupiah(item.nominal)}
                    </span>
                    <span>•</span>
                    <span>Tgl: {formatTanggal(item.tanggal)}</span>
                    {item.keperluan && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 truncate max-w-[140px] italic">
                          "{item.keperluan}"
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Follow-up Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSendWhatsApp(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title={`Kirim WA Peringatan ke ${k?.nama || 'Pekerja'}`}
                  >
                    <Send className="w-3 h-3" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
