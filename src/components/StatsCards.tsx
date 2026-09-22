import React from 'react';
import { Wallet, Clock, CheckCircle2, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { Karyawan } from '../types';
import { formatRupiah } from '../utils/formatters';

interface StatsCardsProps {
  karyawanList: Karyawan[];
  onFilterStatus?: (status: 'all' | 'Pending' | 'Bayar') => void;
  activeStatusFilter?: string;
  overdueKasbonCount?: number;
  onNavigateToKasbon?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  karyawanList,
  onFilterStatus,
  activeStatusFilter = 'all',
  overdueKasbonCount = 0,
  onNavigateToKasbon
}) => {
  const totalGajiSemua = karyawanList.reduce((acc, curr) => acc + (Number(curr.total_gaji) || 0), 0);
  
  const pendingList = karyawanList.filter((k) => k.status === 'Pending');
  const totalPending = pendingList.reduce((acc, curr) => acc + (Number(curr.total_gaji) || 0), 0);
  
  const bayarList = karyawanList.filter((k) => k.status === 'Bayar');
  const totalBayar = bayarList.reduce((acc, curr) => acc + (Number(curr.total_gaji) || 0), 0);

  const totalOrang = karyawanList.length;
  const avgGaji = totalOrang > 0 ? totalGajiSemua / totalOrang : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 no-print">
      
      {/* Total Gaji Keseluruhan */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('all')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'all' 
            ? 'border-slate-400 ring-2 ring-slate-200' 
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Anggaran Gaji
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {formatRupiah(totalGajiSemua)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{totalOrang} orang karyawan</span>
          <span>Rata-rata: {formatRupiah(avgGaji)}</span>
        </div>
      </div>

      {/* Belum Dibayar / Pending */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Pending')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'Pending' 
            ? 'border-amber-400 ring-2 ring-amber-200' 
            : 'border-slate-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Belum Dibayar (Pending)
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-amber-900 tracking-tight">
          {formatRupiah(totalPending)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-amber-700">
          <span>{pendingList.length} karyawan menanti bayar</span>
          <span className="font-semibold underline">Klik filter</span>
        </div>
      </div>

      {/* Sudah Dibayar / Lunas */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Bayar')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'Bayar' 
            ? 'border-emerald-400 ring-2 ring-emerald-200' 
            : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Sudah Dibayar (Lunas)
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">
          {formatRupiah(totalBayar)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-emerald-700">
          <span>{bayarList.length} karyawan lunas</span>
          <span className="font-semibold underline">Klik filter</span>
        </div>
      </div>

      {/* Rasio Penyelesaian */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Progres Pembayaran
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {totalGajiSemua > 0 ? Math.round((totalBayar / totalGajiSemua) * 100) : 0}%
        </div>
        <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${totalGajiSemua > 0 ? (totalBayar / totalGajiSemua) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Overdue Kasbon Quick Alert Strip */}
      {overdueKasbonCount > 0 && (
        <div 
          onClick={onNavigateToKasbon}
          className="col-span-1 sm:col-span-2 lg:col-span-4 bg-linear-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-300 hover:border-rose-400 rounded-xl p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 text-xs cursor-pointer shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-600 text-white shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="text-slate-800">
              <b className="text-rose-700">Perhatian Kasbon:</b> Terdapat <b className="text-rose-800 underline">{overdueKasbonCount} pinjaman kasbon</b> yang sudah berumur &gt;30 hari dan belum lunas.
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-rose-700 hover:text-rose-800">
            <span>Buka Kasbon & Tagih</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

    </div>
  );
};
