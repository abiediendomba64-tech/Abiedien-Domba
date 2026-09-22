import React, { useState } from 'react';
import { Search, SlidersHorizontal, CheckSquare, Square, ArrowUpDown } from 'lucide-react';
import { JenisGaji, StatusPembayaran } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  gajiFilter: string;
  onGajiFilterChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  onBulkUpdateStatus: (status: StatusPembayaran) => void;
  totalFiltered: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  gajiFilter,
  onGajiFilterChange,
  sortBy,
  onSortByChange,
  onBulkUpdateStatus,
  totalFiltered
}) => {
  const [bulkStatusTarget, setBulkStatusTarget] = useState<StatusPembayaran | null>(null);

  const handleConfirmBulk = () => {
    if (bulkStatusTarget) {
      onBulkUpdateStatus(bulkStatusTarget);
      setBulkStatusTarget(null);
    }
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-4 no-print space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama karyawan, kode, pekerjaan, atau no WA..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => onStatusFilterChange('Pending')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'Pending' ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-amber-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => onStatusFilterChange('Bayar')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'Bayar' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-emerald-700'
              }`}
            >
              Bayar
            </button>
          </div>

          {/* Jenis Gaji Filter */}
          <select
            value={gajiFilter}
            onChange={(e) => onGajiFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="all">Semua Jenis Gaji</option>
            <option value="Harian">Harian</option>
            <option value="Bulanan">Bulanan</option>
          </select>

          {/* Sort By */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="id-asc">Urutan Default (ID)</option>
              <option value="nama-asc">Nama (A - Z)</option>
              <option value="total-desc">Total Gaji (Tertinggi)</option>
              <option value="total-asc">Total Gaji (Terendah)</option>
              <option value="hari-desc">Hari Kerja (Terbanyak)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sub-bar with bulk actions and result count */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{totalFiltered}</span> karyawan
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Aksi Cepat:</span>
          <button
            type="button"
            onClick={() => setBulkStatusTarget('Bayar')}
            className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md font-medium border border-emerald-200 transition-colors cursor-pointer"
          >
            Tandai Semua Bayar
          </button>
          <button
            type="button"
            onClick={() => setBulkStatusTarget('Pending')}
            className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md font-medium border border-amber-200 transition-colors cursor-pointer"
          >
            Tandai Semua Pending
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkStatusTarget}
        title={bulkStatusTarget === 'Bayar' ? 'Tandai Semua Lunas / Bayar?' : 'Kembalikan Semua ke Pending?'}
        message={
          <div>
            Ubah status pembayaran <b className="text-slate-900 font-bold">{totalFiltered} karyawan</b> yang sedang tampil menjadi{' '}
            <span className={bulkStatusTarget === 'Bayar' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {bulkStatusTarget === 'Bayar' ? 'LUNAS (BAYAR)' : 'PENDING'}
            </span>?
          </div>
        }
        confirmText={bulkStatusTarget === 'Bayar' ? 'Ya, Tandai Lunas' : 'Ya, Kembalikan Pending'}
        cancelText="Batal"
        variant={bulkStatusTarget === 'Bayar' ? 'primary' : 'warning'}
        onConfirm={handleConfirmBulk}
        onCancel={() => setBulkStatusTarget(null)}
      />
    </div>
  );
};
