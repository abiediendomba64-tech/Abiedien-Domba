import React, { useState, useMemo } from 'react';
import { 
  WalletCards, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Send, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Karyawan, KasbonRecord, StatusKasbon, CompanySettings } from '../types';
import { 
  formatRupiah, 
  formatTanggal, 
  standardizePhone, 
  generateKasbonWhatsAppText,
  calculateKasbonAge,
  isKasbonOverdue,
  generateOverdueKasbonWhatsAppReminder
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface KasbonViewProps {
  karyawanList: Karyawan[];
  kasbonList: KasbonRecord[];
  onSaveKasbon: (record: KasbonRecord) => void;
  onDeleteKasbon: (id: string) => void;
  onApplyKasbonToPayroll: (applied: { id: number | string; potongan_kasbon: number }[]) => void;
  company: CompanySettings;
}

export const KasbonView: React.FC<KasbonViewProps> = ({
  karyawanList,
  kasbonList,
  onSaveKasbon,
  onDeleteKasbon,
  onApplyKasbonToPayroll,
  company
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKasbon, setEditingKasbon] = useState<KasbonRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KasbonRecord | null>(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for Add/Edit Modal
  const [formKaryawanId, setFormKaryawanId] = useState<number | string>(karyawanList[0]?.id || '');
  const [formTanggal, setFormTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNominal, setFormNominal] = useState<number>(50000);
  const [formKeperluan, setFormKeperluan] = useState<string>('');
  const [formStatus, setFormStatus] = useState<StatusKasbon>('Belum Lunas');
  const [formKeterangan, setFormKeterangan] = useState<string>('');

  const openAddModal = () => {
    setEditingKasbon(null);
    setFormKaryawanId(karyawanList[0]?.id || '');
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormNominal(50000);
    setFormKeperluan('');
    setFormStatus('Belum Lunas');
    setFormKeterangan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: KasbonRecord) => {
    setEditingKasbon(item);
    setFormKaryawanId(item.karyawan_id);
    setFormTanggal(item.tanggal);
    setFormNominal(item.nominal);
    setFormKeperluan(item.keperluan);
    setFormStatus(item.status);
    setFormKeterangan(item.keterangan || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKaryawanId) {
      setFormError('Pilih karyawan terlebih dahulu.');
      return;
    }
    if (formNominal <= 0) {
      setFormError('Nominal kasbon harus lebih dari Rp 0.');
      return;
    }

    const newRecord: KasbonRecord = {
      id: editingKasbon ? editingKasbon.id : `ksb-${Date.now()}`,
      karyawan_id: formKaryawanId,
      tanggal: formTanggal,
      nominal: Number(formNominal),
      keperluan: formKeperluan || 'Keperluan pribadi',
      status: formStatus,
      keterangan: formKeterangan
    };

    onSaveKasbon(newRecord);
    setIsModalOpen(false);
  };

  // Filtered Kasbon Records
  const filteredKasbon = useMemo(() => {
    let result = [...kasbonList];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((k) => {
        const emp = karyawanList.find((e) => String(e.id) === String(k.karyawan_id));
        const empName = emp ? emp.nama.toLowerCase() : '';
        return (
          empName.includes(term) ||
          k.keperluan.toLowerCase().includes(term) ||
          (k.keterangan && k.keterangan.toLowerCase().includes(term))
        );
      });
    }

    if (statusFilter === 'segera_ditagih' || statusFilter === 'overdue') {
      result = result.filter((k) => isKasbonOverdue(k, 30));
    } else if (statusFilter !== 'all') {
      result = result.filter((k) => k.status === statusFilter);
    }

    // Sort newest date first
    return result.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [kasbonList, karyawanList, searchTerm, statusFilter]);

  // Statistics
  const overdueKasbonList = useMemo(() => {
    return kasbonList.filter((k) => isKasbonOverdue(k, 30));
  }, [kasbonList]);
  const countOverdue = overdueKasbonList.length;
  const totalOverdueNominal = useMemo(() => {
    return overdueKasbonList.reduce((sum, k) => sum + Number(k.nominal || 0), 0);
  }, [overdueKasbonList]);

  const totalUnpaid = useMemo(() => {
    return kasbonList
      .filter((k) => k.status === 'Belum Lunas')
      .reduce((sum, k) => sum + Number(k.nominal || 0), 0);
  }, [kasbonList]);

  const totalDeductedOrPaid = useMemo(() => {
    return kasbonList
      .filter((k) => k.status === 'Lunas' || k.status === 'Dipotong Gaji')
      .reduce((sum, k) => sum + Number(k.nominal || 0), 0);
  }, [kasbonList]);

  const countUnpaid = useMemo(() => {
    return kasbonList.filter((k) => k.status === 'Belum Lunas').length;
  }, [kasbonList]);

  const countDipotong = useMemo(() => {
    return kasbonList.filter((k) => k.status === 'Dipotong Gaji').length;
  }, [kasbonList]);

  const countLunas = useMemo(() => {
    return kasbonList.filter((k) => k.status === 'Lunas').length;
  }, [kasbonList]);

  // Apply Kasbon to payroll
  const handleApplyToPayroll = () => {
    // For each employee, sum their 'Belum Lunas' kasbon
    const employeeUnpaidMap: Record<string, number> = {};
    kasbonList
      .filter((k) => k.status === 'Belum Lunas')
      .forEach((k) => {
        const idStr = String(k.karyawan_id);
        employeeUnpaidMap[idStr] = (employeeUnpaidMap[idStr] || 0) + Number(k.nominal || 0);
      });

    const updates = karyawanList.map((k) => ({
      id: k.id,
      potongan_kasbon: employeeUnpaidMap[String(k.id)] || 0
    }));

    onApplyKasbonToPayroll(updates);
    setShowApplyConfirm(false);
  };

  const handleApplyToPayrollClick = () => {
    setShowApplyConfirm(true);
  };

  // WhatsApp Sender for Kasbon receipt
  const sendKasbonWhatsApp = (kasbon: KasbonRecord) => {
    const employee = karyawanList.find((e) => String(e.id) === String(kasbon.karyawan_id));
    if (!employee) return;

    const messageText = generateKasbonWhatsAppText(
      kasbon,
      employee.nama,
      company.namaPerusahaan,
      company.penanggungJawab
    );

    const cleanPhone = standardizePhone(employee.no_wa);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    window.open(waUrl, '_blank');
  };

  const sendOverdueWhatsApp = (kasbon: KasbonRecord) => {
    const employee = karyawanList.find((e) => String(e.id) === String(kasbon.karyawan_id));
    if (!employee) return;

    const days = calculateKasbonAge(kasbon.tanggal);
    const messageText = generateOverdueKasbonWhatsAppReminder(
      kasbon,
      employee.nama,
      company.namaPerusahaan,
      company.penanggungJawab,
      days
    );

    const cleanPhone = standardizePhone(employee.no_wa);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    window.open(waUrl, '_blank');
  };

  const copyKasbonText = (kasbon: KasbonRecord) => {
    const employee = karyawanList.find((e) => String(e.id) === String(kasbon.karyawan_id));
    if (!employee) return;

    const messageText = generateKasbonWhatsAppText(
      kasbon,
      employee.nama,
      company.namaPerusahaan,
      company.penanggungJawab
    );

    navigator.clipboard.writeText(messageText);
    setCopiedId(kasbon.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Primary Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
              <WalletCards className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Manajemen Kasbon & Pinjaman Karyawan
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Catat pinjaman kerja, kirim tanda terima WhatsApp, dan potongkan otomatis pada saat pencairan gaji.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleApplyToPayrollClick}
            title="Potongkan otomatis kasbon aktif ke slip gaji"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Terapkan ke Slip Gaji</span>
            <span className="sm:hidden">Potong Gaji</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Kasbon Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Kasbon Belum Lunas (Aktif) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Kasbon Belum Lunas (Aktif)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatRupiah(totalUnpaid)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {countUnpaid} transaksi menanti pelunasan
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Kasbon Segera Ditagih (>30 Hari) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'segera_ditagih' || statusFilter === 'overdue' ? 'all' : 'segera_ditagih')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            statusFilter === 'segera_ditagih' || statusFilter === 'overdue'
              ? 'bg-rose-100/90 border-rose-500 ring-3 ring-rose-200'
              : countOverdue > 0 
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-100 hover:border-rose-400' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-rose-800">Segera Ditagih (&gt;30 Hari)</span>
              {countOverdue > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              )}
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
              {formatRupiah(totalOverdueNominal)}
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5 font-medium flex items-center gap-1">
              <span>{countOverdue} kasbon jatuh tempo</span>
              <span className="font-bold underline">
                ({statusFilter === 'segera_ditagih' || statusFilter === 'overdue' ? 'Sedang Difilter' : 'Klik Filter Cepat'})
              </span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
            countOverdue > 0 ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Kasbon Lunas / Selesai */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Kasbon Lunas / Selesai</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {formatRupiah(totalDeductedOrPaid)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Sudah dipotong atau dilunasi
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Transaksi Kasbon */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Transaksi Kasbon</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {kasbonList.length} Catatan
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Periode {company.periodeGaji}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <WalletCards className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Quick Filter Bar & Search Toolbar */}
      <div className="space-y-2.5">
        {/* Quick Filter Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter Cepat:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua ({kasbonList.length})
          </button>

          {/* Dedicated Quick Filter: Segera Ditagih */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'segera_ditagih' || statusFilter === 'overdue' ? 'all' : 'segera_ditagih')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'segera_ditagih' || statusFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                : countOverdue > 0
                ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${statusFilter === 'segera_ditagih' || statusFilter === 'overdue' ? 'text-white' : 'text-rose-600'}`} />
            <span>Segera Ditagih (&gt;30 Hari)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
              statusFilter === 'segera_ditagih' || statusFilter === 'overdue'
                ? 'bg-white text-rose-700'
                : 'bg-rose-600 text-white'
            }`}>
              {countOverdue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Belum Lunas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Belum Lunas'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Belum Lunas ({countUnpaid})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Dipotong Gaji')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Dipotong Gaji'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Dipotong Gaji ({countDipotong})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Lunas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Lunas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Lunas ({countLunas})
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari karyawan atau keperluan kasbon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Status ({kasbonList.length})</option>
              <option value="segera_ditagih">🚨 Segera Ditagih (&gt;30 Hari) ({countOverdue})</option>
              <option value="Belum Lunas">Belum Lunas ({countUnpaid})</option>
              <option value="Dipotong Gaji">Dipotong Gaji ({countDipotong})</option>
              <option value="Lunas">Lunas ({countLunas})</option>
            </select>
          </div>
        </div>

        {/* Active Filter Banner when 'Segera Ditagih' is filtered */}
        {(statusFilter === 'segera_ditagih' || statusFilter === 'overdue') && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Menampilkan <b>{filteredKasbon.length} kasbon Belum Lunas</b> yang telah melewati batas 30 hari (<b>Segera Ditagih</b>).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer ml-2 text-xs"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Table of Kasbon */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Tanggal & Masa</th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Keperluan / Alasan</th>
                <th className="py-3 px-4 text-right">Nominal Kasbon</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi & Bukti WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKasbon.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data kasbon yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredKasbon.map((item) => {
                  const employee = karyawanList.find((k) => String(k.id) === String(item.karyawan_id));
                  const isUnpaid = item.status === 'Belum Lunas';
                  const isOverdue = isKasbonOverdue(item, 30);
                  const age = calculateKasbonAge(item.tanggal);

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        isOverdue 
                          ? 'bg-rose-50/95 hover:bg-rose-100/90 border-l-4 border-l-rose-600 shadow-xs ring-1 ring-rose-200/80' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* Tanggal & Masa */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {formatTanggal(item.tanggal)}
                        </div>
                        {isOverdue ? (
                          <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-[10px] shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>SEGERA DITAGIH • Lewat {age} Hari</span>
                          </div>
                        ) : isUnpaid ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Masa pinjam: {age} hari
                          </div>
                        ) : null}
                      </td>

                      {/* Karyawan */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {employee?.nama || 'Karyawan Dihapus'}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {employee?.pekerjaan} • {employee?.no_wa ? `WA: ${employee.no_wa}` : 'Tanpa No WA'}
                        </div>
                      </td>

                      {/* Keperluan */}
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="font-medium text-slate-800">{item.keperluan}</div>
                        {item.keterangan && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">
                            {item.keterangan}
                          </div>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-bold text-sm ${isOverdue ? 'text-rose-700' : 'text-slate-900'}`}>
                          {formatRupiah(item.nominal)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {isOverdue ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-xs">
                                <AlertTriangle className="w-3 h-3" />
                                Segera Ditagih
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                                Belum Lunas ({age} hari)
                              </span>
                            </>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                item.status === 'Belum Lunas'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : item.status === 'Dipotong Gaji'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action & WA */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send WhatsApp reminder for overdue */}
                          {isOverdue ? (
                            <button
                              onClick={() => sendOverdueWhatsApp(item)}
                              title={`Kirim Peringatan Segera Ditagih (${age} hari) via WhatsApp`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors font-bold text-xs shadow-xs cursor-pointer"
                            >
                              <Send className="w-3 h-3 text-white" />
                              <span>Tagih WA</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => sendKasbonWhatsApp(item)}
                              title="Kirim Tanda Terima Kasbon via WhatsApp"
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Copy Text */}
                          <button
                            onClick={() => copyKasbonText(item)}
                            title="Salin Teks Bukti Kasbon"
                            className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => {
                              const nextStatus: StatusKasbon = 
                                item.status === 'Belum Lunas' ? 'Lunas' : 'Belum Lunas';
                              onSaveKasbon({ ...item, status: nextStatus });
                            }}
                            title={`Ubah status menjadi: ${isUnpaid ? 'Lunas' : 'Belum Lunas'}`}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors border cursor-pointer ${
                              isUnpaid
                                ? 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {isUnpaid ? 'Set Lunas' : 'Batalkan'}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Kasbon"
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus Kasbon"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Kasbon */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <WalletCards className="w-5 h-5 text-rose-600" />
              {editingKasbon ? 'Edit Catatan Kasbon' : 'Catat Kasbon / Pinjaman Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Pinjaman yang dicatat di sini dapat dipotongkan langsung pada pembayaran upah/gaji karyawan.
            </p>

            {formError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Karyawan
                </label>
                <select
                  value={formKaryawanId}
                  onChange={(e) => setFormKaryawanId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                >
                  {karyawanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({k.pekerjaan}) - {k.jenis_gaji}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Kasbon
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={formNominal}
                    onChange={(e) => setFormNominal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keperluan / Alasan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Beli obat keluarga, bensin motor, dsb."
                  value={formKeperluan}
                  onChange={(e) => setFormKeperluan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Pembayaran Kasbon
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusKasbon)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="Belum Lunas">Belum Lunas (Masih Berjalan)</option>
                  <option value="Dipotong Gaji">Dipotong Gaji (Otomatis saat penggajian)</option>
                  <option value="Lunas">Lunas (Sudah dibayar kembali)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan persetujuan mandor atau tanggal pelunasan..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors"
                >
                  {editingKasbon ? 'Simpan Perubahan' : 'Catat Kasbon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Kasbon */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Catatan Kasbon"
        message={
          deleteTarget ? (
            <div>
              Apakah Anda yakin ingin menghapus catatan kasbon sebesar{' '}
              <b className="text-rose-700 font-bold">{formatRupiah(deleteTarget.nominal)}</b> untuk pekerja{' '}
              <b className="text-slate-900 font-bold">
                {karyawanList.find((k) => String(k.id) === String(deleteTarget.karyawan_id))?.nama || 'Pekerja'}
              </b>?
              <br />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Keperluan: {deleteTarget.keperluan} ({formatTanggal(deleteTarget.tanggal)})
              </span>
            </div>
          ) : ''
        }
        confirmText="Ya, Hapus Kasbon"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteKasbon(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation Modal: Apply Kasbon to Payroll */}
      <ConfirmModal
        isOpen={showApplyConfirm}
        title="Terapkan Kasbon ke Slip Gaji?"
        message={
          <div>
            Terapkan total kasbon aktif (<b className="text-emerald-700">{formatRupiah(totalUnpaid)}</b>) sebagai potongan kasbon pada slip gaji karyawan?
            <br />
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              Nominal potongan kasbon di tabel penggajian akan disesuaikan otomatis dengan akumulasi pinjaman berjalan masing-masing karyawan.
            </span>
          </div>
        }
        confirmText="Ya, Terapkan"
        cancelText="Batal"
        variant="warning"
        onConfirm={handleApplyToPayroll}
        onCancel={() => setShowApplyConfirm(false)}
      />

    </div>
  );
};
