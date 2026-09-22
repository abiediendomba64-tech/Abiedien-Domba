import React, { useState, useMemo } from 'react';
import { 
  CircleDollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Layers, 
  Coffee, 
  Hammer, 
  Receipt,
  Building,
  CheckCircle2,
  X,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { TransaksiKas, KategoriKas, TipeKas, CompanySettings } from '../types';
import { formatRupiah, formatTanggal, exportCsv } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { CashflowMonthlyChart } from './CashflowMonthlyChart';

interface CashflowViewProps {
  transaksiList: TransaksiKas[];
  onSaveTransaksi: (transaksi: TransaksiKas) => void;
  onDeleteTransaksi: (id: string) => void;
  company: CompanySettings;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  transaksiList,
  onSaveTransaksi,
  onDeleteTransaksi,
  company
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipeFilter, setTipeFilter] = useState<'all' | TipeKas>('all');
  const [kategoriFilter, setKategoriFilter] = useState<'all' | KategoriKas>('all');

  // Modal State for Add / Edit Transaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TransaksiKas | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransaksiKas | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const todayStr = '2026-09-21';
  const [formTanggal, setFormTanggal] = useState(todayStr);
  const [formTipe, setFormTipe] = useState<TipeKas>('Keluar');
  const [formKategori, setFormKategori] = useState<KategoriKas>('Material');
  const [formNominal, setFormNominal] = useState<number>(0);
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formPihak, setFormPihak] = useState('');
  const [formNota, setFormNota] = useState('');
  const [formCatatan, setFormCatatan] = useState('');

  // Open modal for new transaction
  const handleOpenAdd = (defaultTipe: TipeKas = 'Keluar', defaultKategori: KategoriKas = 'Material') => {
    setEditingItem(null);
    setFormTanggal(todayStr);
    setFormTipe(defaultTipe);
    setFormKategori(defaultKategori);
    setFormNominal(0);
    setFormDeskripsi('');
    setFormPihak('');
    setFormNota('');
    setFormCatatan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing transaction
  const handleOpenEdit = (item: TransaksiKas) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormTipe(item.tipe);
    setFormKategori(item.kategori);
    setFormNominal(item.nominal);
    setFormDeskripsi(item.deskripsi);
    setFormPihak(item.pihak_terkait || '');
    setFormNota(item.nomor_nota || '');
    setFormCatatan(item.catatan || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNominal || formNominal <= 0) {
      setFormError('Masukkan nominal transaksi yang valid (lebih dari Rp 0).');
      return;
    }
    if (!formDeskripsi.trim()) {
      setFormError('Masukkan uraian atau deskripsi transaksi.');
      return;
    }

    const payload: TransaksiKas = {
      id: editingItem ? editingItem.id : `kas-${Date.now()}`,
      tanggal: formTanggal,
      tipe: formTipe,
      kategori: formKategori,
      nominal: Number(formNominal),
      deskripsi: formDeskripsi.trim(),
      pihak_terkait: formPihak.trim() || undefined,
      nomor_nota: formNota.trim() || undefined,
      catatan: formCatatan.trim() || undefined,
      created_at: editingItem?.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onSaveTransaksi(payload);
    setIsModalOpen(false);
  };

  // Calculations for financial dashboard
  const summary = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalMaterial = 0;
    let totalOperasional = 0;
    let totalTakTerduga = 0;
    let totalGaji = 0;
    let totalKasbon = 0;

    transaksiList.forEach((t) => {
      if (t.tipe === 'Masuk') {
        totalMasuk += t.nominal;
      } else {
        totalKeluar += t.nominal;
        if (t.kategori === 'Material') totalMaterial += t.nominal;
        else if (t.kategori === 'Operasional') totalOperasional += t.nominal;
        else if (t.kategori === 'Biaya Tak Terduga') totalTakTerduga += t.nominal;
        else if (t.kategori === 'Gaji & Upah') totalGaji += t.nominal;
        else if (t.kategori === 'Kasbon') totalKasbon += t.nominal;
      }
    });

    const saldoKas = totalMasuk - totalKeluar;
    return {
      totalMasuk,
      totalKeluar,
      saldoKas,
      totalMaterial,
      totalOperasional,
      totalTakTerduga,
      totalGaji,
      totalKasbon
    };
  }, [transaksiList]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transaksiList.filter((item) => {
      const matchSearch = 
        item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.pihak_terkait && item.pihak_terkait.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.nomor_nota && item.nomor_nota.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTipe = tipeFilter === 'all' || item.tipe === tipeFilter;
      const matchKategori = kategoriFilter === 'all' || item.kategori === kategoriFilter;

      return matchSearch && matchTipe && matchKategori;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [transaksiList, searchTerm, tipeFilter, kategoriFilter]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Uraian / Deskripsi', 'Pihak Terkait', 'No Nota', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Catatan'];
    const rows = filteredList.map((t) => [
      t.id,
      t.tanggal,
      t.tipe,
      t.kategori,
      `"${t.deskripsi.replace(/"/g, '""')}"`,
      `"${(t.pihak_terkait || '').replace(/"/g, '""')}"`,
      t.nomor_nota || '-',
      t.tipe === 'Masuk' ? t.nominal : 0,
      t.tipe === 'Keluar' ? t.nominal : 0,
      `"${(t.catatan || '').replace(/"/g, '""')}"`
    ]);
    exportCsv(`Buku_Kas_${company.namaProyek.replace(/\s+/g, '_')}_${todayStr}.csv`, headers, rows);
  };

  // Helper for category badge styling
  const getCategoryBadge = (kategori: KategoriKas) => {
    switch (kategori) {
      case 'Material':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Operasional':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Biaya Tak Terduga':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'Termin Owner':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
      case 'Modal Awal':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Dana Talang':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Gaji & Upah':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Kasbon':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CircleDollarSign className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Buku Kas Masuk & Keluar Proyek
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Pencatatan arus kas operasional, pembelian material, biaya konsumsi, serta pos dana tak terduga lapangan secara transparan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAdd('Masuk', 'Termin Owner')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>+ Kas Masuk (Termin/Modal)</span>
          </button>

          <button
            onClick={() => handleOpenAdd('Keluar', 'Material')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        
        {/* Card 1: Saldo Kas Bersih Lapangan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sisa Saldo Kas Lapangan</span>
            <span className={`p-1.5 rounded-lg ${summary.saldoKas >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              <CircleDollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 ${summary.saldoKas >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatRupiah(summary.saldoKas)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Uang Kas Riil Tersedia</span>
            <span className="font-semibold text-slate-600">{summary.saldoKas >= 0 ? 'Surplus Aman' : 'Defisit Kas'}</span>
          </div>
        </div>

        {/* Card 2: Total Kas Masuk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Kas Masuk (Pemasukan)</span>
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">
            {formatRupiah(summary.totalMasuk)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari Termin Owner & Kas Modal Awal
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Kas Keluar (Pengeluaran)</span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {formatRupiah(summary.totalKeluar)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Material, Operasional, Upah & Biaya Tak Terduga
          </div>
        </div>

      </div>

      {/* Expense Category Breakdown Strip */}
      <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Biaya Material</span>
          </div>
          <div className="text-base font-bold text-slate-900">{formatRupiah(summary.totalMaterial)}</div>
          <div className="text-[10px] text-slate-400">Semen, pasir, bata, besi, cat</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-indigo-800 font-semibold mb-1">
            <Coffee className="w-3.5 h-3.5 text-indigo-600" />
            <span>Operasional & Makan</span>
          </div>
          <div className="text-base font-bold text-slate-900">{formatRupiah(summary.totalOperasional)}</div>
          <div className="text-[10px] text-slate-400">Konsumsi tukang, galon, bensin</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-rose-800 font-semibold mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Biaya Tak Terduga</span>
          </div>
          <div className="text-base font-bold text-rose-700">{formatRupiah(summary.totalTakTerduga)}</div>
          <div className="text-[10px] text-slate-400">Sewa alat darurat, servis mesin</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-blue-800 font-semibold mb-1">
            <Hammer className="w-3.5 h-3.5 text-blue-600" />
            <span>Kasbon & Lainnya</span>
          </div>
          <div className="text-base font-bold text-slate-900">{formatRupiah(summary.totalKasbon + summary.totalGaji)}</div>
          <div className="text-[10px] text-slate-400">Kasbon terbayar & upah langsung</div>
        </div>
      </div>

      {/* Visualisasi Data: Recharts Grafik Batang Perbandingan Pemasukan vs Pengeluaran Bulanan */}
      <CashflowMonthlyChart transaksiList={transaksiList} />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari uraian, toko, nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Tipe Filter */}
          <select
            value={tipeFilter}
            onChange={(e) => setTipeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Semua Arus Kas</option>
            <option value="Masuk">Kas Masuk (Debit)</option>
            <option value="Keluar">Kas Keluar (Kredit)</option>
          </select>

          {/* Kategori Filter */}
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Semua Kategori</option>
            <option value="Material">Material Bangunan</option>
            <option value="Operasional">Operasional Lapangan</option>
            <option value="Biaya Tak Terduga">Biaya Tak Terduga</option>
            <option value="Termin Owner">Termin Owner</option>
            <option value="Modal Awal">Modal Awal</option>
            <option value="Dana Talang">Dana Talang (Bayu)</option>
            <option value="Kasbon">Kasbon Pekerja</option>
            <option value="Gaji & Upah">Gaji & Upah</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Export & Print Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cetak Buku Kas</span>
          </button>
        </div>
      </div>

      {/* Cashflow Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 min-w-[95px]">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-4 min-w-[200px]">Uraian & Keterangan</th>
                <th className="py-3 px-3">Pihak Terkait</th>
                <th className="py-3 px-3">No. Nota</th>
                <th className="py-3 px-3 text-right text-emerald-800 bg-emerald-50/40 min-w-[110px]">
                  Kas Masuk (Rp)
                </th>
                <th className="py-3 px-3 text-right text-rose-800 bg-rose-50/40 min-w-[110px]">
                  Kas Keluar (Rp)
                </th>
                <th className="py-3 px-3 text-center no-print">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada transaksi kas yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isMasuk = item.tipe === 'Masuk';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadge(item.kategori)}`}>
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{item.deskripsi}</div>
                        {item.catatan && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">{item.catatan}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {item.pihak_terkait || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {item.nomor_nota || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-teal-700 bg-emerald-50/20 whitespace-nowrap">
                        {isMasuk ? formatRupiah(item.nominal) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-700 bg-rose-50/20 whitespace-nowrap">
                        {!isMasuk ? formatRupiah(item.nominal) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center no-print whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Transaksi"
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

            {/* Total Footer Row */}
            <tfoot className="bg-slate-100/80 border-t-2 border-slate-200 font-bold text-xs">
              <tr>
                <td colSpan={6} className="py-3 px-4 text-right text-slate-700">
                  TOTAL ARUS KAS:
                </td>
                <td className="py-3 px-3 text-right text-teal-800 bg-emerald-100/40">
                  {formatRupiah(summary.totalMasuk)}
                </td>
                <td className="py-3 px-3 text-right text-rose-800 bg-rose-100/40">
                  {formatRupiah(summary.totalKeluar)}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY SIGNATURE SECTION */}
      <div className="hidden print:block mt-10 pt-6 border-t border-slate-300 text-xs">
        <div className="grid grid-cols-3 text-center gap-8">
          <div>
            <p className="text-slate-500 mb-16">Mandor / PJ Lapangan</p>
            <p className="font-bold underline text-slate-900">{company.penanggungJawab}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-16">Bendahara / Kasir Proyek</p>
            <p className="font-bold underline text-slate-900">( ........................................ )</p>
          </div>
          <div>
            <p className="text-slate-500 mb-16">Owner / Pemberi Kerja</p>
            <p className="font-bold underline text-slate-900">( ........................................ )</p>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT TRANSAKSI KAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                <span>{editingItem ? 'Edit Transaksi Kas' : 'Catat Transaksi Kas Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Tipe Transaksi */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFormTipe('Keluar');
                        if (formKategori === 'Termin Owner' || formKategori === 'Modal Awal') {
                          setFormKategori('Material');
                        }
                      }}
                      className={`py-1.5 rounded-md font-semibold text-center transition-all ${
                        formTipe === 'Keluar'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kas Keluar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTipe('Masuk');
                        setFormKategori('Termin Owner');
                      }}
                      className={`py-1.5 rounded-md font-semibold text-center transition-all ${
                        formTipe === 'Masuk'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kas Masuk
                    </button>
                  </div>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Transaksi</label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as KategoriKas)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  {formTipe === 'Masuk' ? (
                    <>
                      <option value="Termin Owner">Termin Owner / Pencairan Dana</option>
                      <option value="Modal Awal">Modal Awal / Kas Lapangan</option>
                      <option value="Dana Talang">Dana Talang (Penerimaan / Handle Dana Talang Proyek)</option>
                      <option value="Lainnya">Pemasukan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Material">Material Bangunan (Semen, Pasir, Besi, Cat, dll.)</option>
                      <option value="Operasional">Operasional Lapangan (Makan, Minum, Bensin, Galon)</option>
                      <option value="Biaya Tak Terduga">Biaya Tak Terduga (Sewa alat darurat, servis)</option>
                      <option value="Gaji & Upah">Gaji & Upah Tenaga Kerja</option>
                      <option value="Kasbon">Kasbon Karyawan</option>
                      <option value="Dana Talang">Dana Talang (Pengembalian / Pelunasan Dana Talang)</option>
                      <option value="Lainnya">Pengeluaran Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="Contoh: 1500000"
                  value={formNominal || ''}
                  onChange={(e) => setFormNominal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {formNominal > 0 && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Terbaca: {formatRupiah(formNominal)}
                  </p>
                )}
              </div>

              {/* Uraian / Deskripsi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian / Keterangan Pembelian</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Semen Padang 25 sak & Pasir 1 truk"
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Pihak Terkait & No Nota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Toko / Penerima / Pihak Terkait</label>
                  <input
                    type="text"
                    placeholder="Contoh: TB. Sinar Jaya Abadi"
                    value={formPihak}
                    onChange={(e) => setFormPihak(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Nota / Kwitansi</label>
                  <input
                    type="text"
                    placeholder="Contoh: NOTA-1082"
                    value={formNota}
                    onChange={(e) => setFormNota(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Internal (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Disetujui Mandor, nota asli di binder kas"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Transaksi Kas */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Transaksi Kas"
        message={
          deleteTarget ? (
            <div>
              Apakah Anda yakin ingin menghapus catatan transaksi <b className="text-slate-900 font-bold">"{deleteTarget.deskripsi}"</b> senilai <b className="text-rose-700 font-bold">{formatRupiah(deleteTarget.nominal)}</b>?
              <br />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Kategori: {deleteTarget.kategori} ({deleteTarget.tipe === 'Masuk' ? 'Kas Masuk' : 'Kas Keluar'}) - Tanggal: {formatTanggal(deleteTarget.tanggal)}
              </span>
            </div>
          ) : ''
        }
        confirmText="Ya, Hapus Transaksi"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteTransaksi(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
