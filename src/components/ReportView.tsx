import React, { useMemo, useRef, useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  FileDown,
  Loader2,
  Share2,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Karyawan, KasbonRecord, CompanySettings, TransaksiKas } from '../types';
import { formatRupiah, formatAngka, formatTanggal, exportCsv } from '../utils/formatters';

interface ReportViewProps {
  karyawanList: Karyawan[];
  kasbonList: KasbonRecord[];
  company: CompanySettings;
  transaksiList?: TransaksiKas[];
}

export const ReportView: React.FC<ReportViewProps> = ({
  karyawanList,
  kasbonList,
  company,
  transaksiList = []
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);

  // Aggregate Metrics
  const summary = useMemo(() => {
    let totalGrossHarian = 0;
    let totalGajiPokok = 0;
    let totalLembur = 0;
    let totalPotonganKasbon = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    karyawanList.forEach((k) => {
      const isNonHarian = k.jenis_gaji !== 'Harian';
      const grossHarian = isNonHarian ? 0 : (k.gaji_per_hari || 0) * (k.hari_kerja || 0);
      const pokok = Number(k.gaji_pokok) || (isNonHarian ? (Number(k.gaji_per_hari) || 0) : 0);
      const lembur = Number(k.lembur_bonus) || 0;
      const kasbon = Number(k.potongan_kasbon) || 0;
      const net = k.total_gaji;

      totalGrossHarian += grossHarian;
      totalGajiPokok += pokok;
      totalLembur += lembur;
      totalPotonganKasbon += kasbon;
      totalNet += net;

      if (k.status === 'Bayar') {
        totalPaid += net;
        paidCount++;
      } else {
        totalPending += net;
        pendingCount++;
      }
    });

    const activeKasbonTotal = kasbonList
      .filter((k) => k.status === 'Belum Lunas')
      .reduce((sum, k) => sum + k.nominal, 0);

    // Cashflow summary & operational breakdown
    let kasMasuk = 0;
    let kasKeluar = 0;
    let biayaMaterial = 0;
    let biayaOperasional = 0;
    let biayaTakTerduga = 0;
    let countMaterial = 0;
    let countOperasional = 0;
    let countTakTerduga = 0;

    transaksiList.forEach((t) => {
      if (t.tipe === 'Masuk') {
        kasMasuk += t.nominal;
      } else {
        kasKeluar += t.nominal;
        if (t.kategori === 'Material') {
          biayaMaterial += t.nominal;
          countMaterial++;
        } else if (t.kategori === 'Operasional') {
          biayaOperasional += t.nominal;
          countOperasional++;
        } else if (t.kategori === 'Biaya Tak Terduga') {
          biayaTakTerduga += t.nominal;
          countTakTerduga++;
        }
      }
    });

    // Net cash balance including paid salaries
    const totalPengeluaranTotal = kasKeluar + totalPaid;
    const sisaSaldoProyek = kasMasuk - totalPengeluaranTotal;

    return {
      totalGrossHarian,
      totalGajiPokok,
      totalLembur,
      totalPotonganKasbon,
      totalNet,
      totalPaid,
      totalPending,
      paidCount,
      pendingCount,
      activeKasbonTotal,
      kasMasuk,
      kasKeluar,
      saldoKas: kasMasuk - kasKeluar,
      biayaMaterial,
      biayaOperasional,
      biayaTakTerduga,
      countMaterial,
      countOperasional,
      countTakTerduga,
      totalPengeluaranOperasional: kasKeluar,
      totalPengeluaranTotal,
      sisaSaldoProyek
    };
  }, [karyawanList, kasbonList, transaksiList]);

  // Breakdown by Job Role
  const roleBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalGaji: number }> = {};

    karyawanList.forEach((k) => {
      const role = k.pekerjaan || 'Lainnya';
      if (!map[role]) {
        map[role] = { count: 0, totalGaji: 0 };
      }
      map[role].count += 1;
      map[role].totalGaji += k.total_gaji;
    });

    return Object.entries(map).map(([role, data]) => ({
      role,
      count: data.count,
      totalGaji: data.totalGaji,
      percent: summary.totalNet > 0 ? (data.totalGaji / summary.totalNet) * 100 : 0
    })).sort((a, b) => b.totalGaji - a.totalGaji);
  }, [karyawanList, summary.totalNet]);

  // Print Browser Handler
  const handlePrintReport = () => {
    window.print();
  };

  // PDF Download & Mobile Share Generator
  const handleDownloadPdf = async (tryShare = false) => {
    if (!reportRef.current || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      setPdfStatusMessage('Mengonversi dokumen rekapitulasi ke format PDF...');

      const element = reportRef.current;
      
      // Temporarily ensure element has white background and good width for high quality capture
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      setPdfStatusMessage('Menyusun halaman dokumen PDF...');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Create landscape A4 PDF for optimal wide-table readability
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 8; // 8mm margins
      const usableWidth = pageWidth - margin * 2; // 281mm
      const usableHeight = pageHeight - margin * 2; // 194mm
      const printWidth = usableWidth;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      if (printHeight <= usableHeight) {
        // Fits within a single landscape sheet
        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
      } else {
        // Multi-page handling with clean slice
        let heightLeft = printHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
        heightLeft -= usableHeight;
        position -= usableHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
          heightLeft -= usableHeight;
          position -= usableHeight;
        }
      }

      const cleanProject = (company.namaProyek || 'Proyek').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanPeriode = (company.periodeGaji || 'Bulan').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Rekapitulasi_Bulanan_${cleanProject}_${cleanPeriode}.pdf`;

      let sharedSuccessfully = false;
      if (tryShare && typeof navigator !== 'undefined' && 'canShare' in navigator) {
        try {
          const blob = pdf.output('blob');
          const file = new File([blob], filename, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Rekapitulasi Bulanan - ${company.namaProyek}`,
              text: `Laporan Rekapitulasi Arus Kas & Penggajian ${company.namaPerusahaan} Periode ${company.periodeGaji}`
            });
            sharedSuccessfully = true;
          }
        } catch (shareErr) {
          console.warn('Share cancelled or not supported, falling back to direct download', shareErr);
        }
      }

      if (!sharedSuccessfully) {
        pdf.save(filename);
      }

      setPdfStatusMessage(`Dokumen ${filename} berhasil diunduh!`);
      setTimeout(() => {
        setPdfStatusMessage(null);
      }, 4000);
    } catch (error) {
      console.error('Gagal membuat PDF rekapitulasi:', error);
      setPdfStatusMessage('Gagal membuat PDF otomatis. Silakan gunakan tombol Cetak Rekap Resmi.');
      setTimeout(() => {
        setPdfStatusMessage(null);
      }, 4500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls (Hidden on Print) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Laporan Rekapitulasi Bulanan Proyek & Keuangan
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Laporan lengkap arus kas proyek dan perincian gaji karyawan yang sudah dibayarkan, siap diunduh ke PDF atau dicetak resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* PDF Download Button */}
          <button
            type="button"
            onClick={() => handleDownloadPdf(false)}
            disabled={isGeneratingPdf}
            title="Unduh laporan rekapitulasi bulanan ke file PDF rapi"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyiapkan PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Unduh Rekap PDF</span>
              </>
            )}
          </button>

          {/* Share on Mobile */}
          <button
            type="button"
            onClick={() => handleDownloadPdf(true)}
            disabled={isGeneratingPdf}
            title="Bagikan file PDF ke WhatsApp / Email"
            className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={() => exportCsv(karyawanList, `Rekap_Gaji_${company.namaProyek.replace(/\s+/g, '_')}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* PDF Generation Status Alert Banner */}
      {pdfStatusMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfStatusMessage}</span>
          </div>
        </div>
      )}

      {/* Main KPI Summary Cards (Hidden on Print) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 no-print">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Upah Bersih (Net)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatRupiah(summary.totalNet)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {karyawanList.length} orang pekerja terdaftar
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Gaji Telah Dibayar</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {formatRupiah(summary.totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {summary.paidCount} pekerja berstatus Lunas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Gaji Tertunda (Pending)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {formatRupiah(summary.totalPending)}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {summary.pendingCount} pekerja belum dibayar
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Potongan Kasbon</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {formatRupiah(summary.totalPotonganKasbon)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sisa pinjaman aktif: {formatRupiah(summary.activeKasbonTotal)}
          </div>
        </div>

      </div>

      {/* Arus Kas & Biaya Proyek (Material, Operasional, Tak Terduga) */}
      {transaksiList && transaksiList.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 no-print">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Ringkasan Keuangan Buku Kas Proyek</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pemasukan termin vs realisasi pengeluaran material, operasional, & biaya tak terduga.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Sisa Saldo Kas Lapangan</span>
              <span className={`text-base font-black font-mono ${summary.saldoKas >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatRupiah(summary.saldoKas)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <div className="text-[11px] font-semibold text-teal-800">Total Kas Masuk</div>
              <div className="text-base font-bold text-teal-900 mt-0.5 font-mono">{formatRupiah(summary.kasMasuk)}</div>
              <div className="text-[10px] text-teal-600">Termin & Kas Modal</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[11px] font-semibold text-amber-800">Biaya Material</div>
              <div className="text-base font-bold text-amber-900 mt-0.5 font-mono">{formatRupiah(summary.biayaMaterial)}</div>
              <div className="text-[10px] text-amber-600">Semen, pasir, bata, besi</div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="text-[11px] font-semibold text-indigo-800">Biaya Operasional</div>
              <div className="text-base font-bold text-indigo-900 mt-0.5 font-mono">{formatRupiah(summary.biayaOperasional)}</div>
              <div className="text-[10px] text-indigo-600">Makan/minum tukang, galon</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-[11px] font-semibold text-rose-800">Biaya Tak Terduga</div>
              <div className="text-base font-bold text-rose-900 mt-0.5 font-mono">{formatRupiah(summary.biayaTakTerduga)}</div>
              <div className="text-[10px] text-rose-600">Darurat & servis lapangan</div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown per Jabatan (Visual Bar Chart) - Hidden on Print */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 no-print">
        <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Distribusi Alokasi Biaya Upah Berdasarkan Posisi / Jabatan
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Proporsi pembagian biaya tenaga kerja pada proyek {company.namaProyek}.
        </p>

        <div className="space-y-3">
          {roleBreakdown.map((item) => (
            <div key={item.role} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  {item.role} <span className="text-slate-400 font-normal">({item.count} pekerja)</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatRupiah(item.totalGaji)}{' '}
                  <span className="text-[11px] text-slate-500 font-normal">
                    ({item.percent.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORMAL PRINTABLE REPORT SHEET (Captured for PDF and formatted beautifully for Print) */}
      <div 
        ref={reportRef}
        id="formal-recap-report-sheet"
        className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 print:border-none print:shadow-none print:p-0"
      >
        
        {/* Document Header Kop */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                {company.namaPerusahaan}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">
                REKAPITULASI BULANAN ARUS KAS & PENGGAJIAN KARYAWAN
              </p>
              <p className="text-xs text-slate-600">
                Divisi Proyek: <span className="font-semibold text-slate-900">{company.namaProyek}</span>
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div><b>Periode:</b> <span className="font-semibold">{company.periodeGaji}</span></div>
              <div><b>Penanggung Jawab:</b> {company.penanggungJawab}</div>
              <div><b>Tanggal Terbit:</b> {formatTanggal(new Date().toISOString().split('T')[0])}</div>
            </div>
          </div>
        </div>

        {/* Ringkasan Finansial Eksekutif & Total Gaji serta Operasional */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Kas Masuk (Termin Proyek)</span>
            <span className="text-base sm:text-lg font-black text-teal-800 font-mono block mt-1">
              {formatRupiah(summary.kasMasuk)}
            </span>
            <span className="text-[10px] text-teal-700 font-medium">Modal & Penerimaan Termin</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] text-amber-900 font-semibold block">Total Pengeluaran Operasional</span>
            <span className="text-base sm:text-lg font-black text-amber-800 font-mono block mt-1">
              {formatRupiah(summary.totalPengeluaranOperasional)}
            </span>
            <span className="text-[10px] text-amber-700">
              Material ({formatRupiah(summary.biayaMaterial)}) + Ops ({formatRupiah(summary.biayaOperasional)})
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[11px] text-indigo-900 font-semibold block">Total Gaji Dibayarkan (Lunas)</span>
            <span className="text-base sm:text-lg font-black text-indigo-800 font-mono block mt-1">
              {formatRupiah(summary.totalPaid)}
            </span>
            <span className="text-[10px] text-indigo-700">
              {summary.paidCount} pekerja lunas • Pending: {formatRupiah(summary.totalPending)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Sisa Saldo Kas Bersih Proyek</span>
            <span className={`text-base sm:text-lg font-black font-mono block mt-1 ${summary.sisaSaldoProyek >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatRupiah(summary.sisaSaldoProyek)}
            </span>
            <span className="text-[10px] text-slate-500">Kas Masuk - Beban Proyek</span>
          </div>
        </div>

        {/* GRAFIK ARUS KAS & ALOKASI PENGELUARAN PROYEK (Disertakan Langsung di Dokumen PDF) */}
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Grafik Arus Kas & Alokasi Keuangan Proyek</span>
              </h3>
              <p className="text-[10px] text-slate-500">
                Visualisasi komparasi kas masuk termin vs total realisasi pengeluaran operasional dan pembayaran gaji
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Beban Proyek:</span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {formatRupiah(summary.totalPengeluaranTotal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bagian 1: Grafik Batang Arus Kas Proyek */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-slate-700">
                Perbandingan Arus Kas Masuk vs Pengeluaran:
              </div>

              {/* Bar 1: Kas Masuk */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-teal-800">1. Total Kas Masuk (Termin/Modal)</span>
                  <span className="font-bold text-teal-900 font-mono">{formatRupiah(summary.kasMasuk)} (100%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-md h-3 overflow-hidden">
                  <div className="bg-teal-600 h-3 rounded-md w-full" />
                </div>
              </div>

              {/* Bar 2: Pengeluaran Operasional */}
              {(() => {
                const base = Math.max(summary.kasMasuk, summary.totalPengeluaranTotal, 1);
                const pctOps = Math.min(100, (summary.totalPengeluaranOperasional / base) * 100);
                const pctGaji = Math.min(100, (summary.totalPaid / base) * 100);
                const pctSaldo = Math.min(100, (Math.max(0, summary.sisaSaldoProyek) / base) * 100);

                return (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-amber-800">2. Total Pengeluaran Operasional</span>
                        <span className="font-bold text-amber-900 font-mono">
                          {formatRupiah(summary.totalPengeluaranOperasional)} ({pctOps.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-md h-3 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-3 rounded-md" 
                          style={{ width: `${Math.max(2, pctOps)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Bar 3: Gaji Terbayar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-indigo-800">3. Total Pengeluaran Gaji & Upah</span>
                        <span className="font-bold text-indigo-900 font-mono">
                          {formatRupiah(summary.totalPaid)} ({pctGaji.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-md h-3 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-3 rounded-md" 
                          style={{ width: `${Math.max(2, pctGaji)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Bar 4: Sisa Saldo Kas Bersih */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className={`font-semibold ${summary.sisaSaldoProyek >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                          4. Sisa Saldo Kas Lapangan ({summary.sisaSaldoProyek >= 0 ? 'Surplus' : 'Defisit'})
                        </span>
                        <span className={`font-bold font-mono ${summary.sisaSaldoProyek >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                          {formatRupiah(summary.sisaSaldoProyek)} ({pctSaldo.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-md h-3 overflow-hidden">
                        <div 
                          className={`${summary.sisaSaldoProyek >= 0 ? 'bg-emerald-600' : 'bg-rose-600'} h-3 rounded-md`} 
                          style={{ width: `${Math.max(2, pctSaldo)}%` }} 
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Bagian 2: Distribusi Alokasi Biaya Operasional & Gaji */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-slate-700">
                Rincian Biaya Operasional & Beban Proyek:
              </div>

              {/* Multi-segment Stacked Bar */}
              {(() => {
                const totalBeban = Math.max(summary.totalPengeluaranTotal, 1);
                const pMat = (summary.biayaMaterial / totalBeban) * 100;
                const pOps = (summary.biayaOperasional / totalBeban) * 100;
                const pDar = (summary.biayaTakTerduga / totalBeban) * 100;
                const pGaji = (summary.totalPaid / totalBeban) * 100;

                return (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 rounded-md h-3.5 flex overflow-hidden">
                      {pMat > 0 && (
                        <div 
                          className="bg-amber-500 h-full" 
                          style={{ width: `${pMat}%` }} 
                          title={`Material: ${pMat.toFixed(1)}%`}
                        />
                      )}
                      {pOps > 0 && (
                        <div 
                          className="bg-sky-500 h-full" 
                          style={{ width: `${pOps}%` }} 
                          title={`Operasional: ${pOps.toFixed(1)}%`}
                        />
                      )}
                      {pDar > 0 && (
                        <div 
                          className="bg-rose-500 h-full" 
                          style={{ width: `${pDar}%` }} 
                          title={`Tak Terduga: ${pDar.toFixed(1)}%`}
                        />
                      )}
                      {pGaji > 0 && (
                        <div 
                          className="bg-indigo-600 h-full" 
                          style={{ width: `${pGaji}%` }} 
                          title={`Gaji Terbayar: ${pGaji.toFixed(1)}%`}
                        />
                      )}
                    </div>

                    {/* Breakdown Detail Sub-Cards */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                        <div className="flex items-center gap-1 font-semibold text-amber-900">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Belanja Material ({pMat.toFixed(1)}%)</span>
                        </div>
                        <div className="text-xs font-bold font-mono text-amber-950 mt-0.5">
                          {formatRupiah(summary.biayaMaterial)}
                        </div>
                        <div className="text-amber-700 text-[9px]">{summary.countMaterial} transaksi belanja</div>
                      </div>

                      <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-200">
                        <div className="flex items-center gap-1 font-semibold text-sky-900">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span>Ops Lapangan ({pOps.toFixed(1)}%)</span>
                        </div>
                        <div className="text-xs font-bold font-mono text-sky-950 mt-0.5">
                          {formatRupiah(summary.biayaOperasional)}
                        </div>
                        <div className="text-sky-700 text-[9px]">{summary.countOperasional} transaksi konsumsi/alat</div>
                      </div>

                      <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-200">
                        <div className="flex items-center gap-1 font-semibold text-rose-900">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Biaya Tak Terduga ({pDar.toFixed(1)}%)</span>
                        </div>
                        <div className="text-xs font-bold font-mono text-rose-950 mt-0.5">
                          {formatRupiah(summary.biayaTakTerduga)}
                        </div>
                        <div className="text-rose-700 text-[9px]">{summary.countTakTerduga} transaksi darurat</div>
                      </div>

                      <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200">
                        <div className="flex items-center gap-1 font-semibold text-indigo-900">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span>Gaji Terbayar ({pGaji.toFixed(1)}%)</span>
                        </div>
                        <div className="text-xs font-bold font-mono text-indigo-950 mt-0.5">
                          {formatRupiah(summary.totalPaid)}
                        </div>
                        <div className="text-indigo-700 text-[9px]">{summary.paidCount} pekerja lunas</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Detailed Payroll Recap Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-y-2 border-slate-300 font-bold uppercase text-[10px] sm:text-[11px]">
                <th className="py-2.5 px-2">No</th>
                <th className="py-2.5 px-3">Nama Pekerja</th>
                <th className="py-2.5 px-2">Jabatan</th>
                <th className="py-2.5 px-2">Jenis Gaji</th>
                <th className="py-2.5 px-2 text-right">Upah Harian</th>
                <th className="py-2.5 px-2 text-center">Hari</th>
                <th className="py-2.5 px-2 text-right">Gaji Pokok</th>
                <th className="py-2.5 px-2 text-right">Lembur</th>
                <th className="py-2.5 px-2 text-right">Kasbon</th>
                <th className="py-2.5 px-3 text-right font-black">Total Net (Rp)</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-3 text-center print:table-cell">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {karyawanList.map((k, index) => {
                const isNonHarian = k.jenis_gaji !== 'Harian';
                const upahHarian = Number(k.gaji_per_hari) || 0;
                const hariKerja = Number(k.hari_kerja) || 0;
                const gajiPokok = Number(k.gaji_pokok) || (isNonHarian ? upahHarian : 0);
                
                return (
                  <tr key={k.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{index + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {k.nama} {k.kode ? `(${k.kode})` : ''}
                    </td>
                    <td className="py-2 px-2 text-slate-600">{k.pekerjaan}</td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                        {k.jenis_gaji}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[11px]">
                      {isNonHarian && gajiPokok > 0 ? '-' : formatAngka(upahHarian)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-800 text-[11px]">
                      {isNonHarian ? 'Tetap' : `${hariKerja} hr`}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[11px]">
                      {gajiPokok > 0 ? formatAngka(gajiPokok) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-purple-700 text-[11px]">
                      {k.lembur_bonus ? formatAngka(k.lembur_bonus) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-rose-600 text-[11px]">
                      {k.potongan_kasbon ? formatAngka(k.potongan_kasbon) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-950 text-[11px]">
                      {formatAngka(k.total_gaji)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                          k.status === 'Bayar'
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border border-amber-200'
                        }`}
                      >
                        {k.status === 'Bayar' ? 'Lunas' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center border-l border-slate-200 print:table-cell">
                      <div className="h-5 border-b border-dotted border-slate-300 w-16 mx-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
                <td colSpan={6} className="py-2.5 px-3 uppercase text-[10px] sm:text-[11px] text-right">
                  TOTAL REKAPITULASI KESELURUHAN:
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-[11px]">
                  {formatRupiah(summary.totalGajiPokok)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-purple-700 text-[11px]">
                  {formatRupiah(summary.totalLembur)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-rose-600 text-[11px]">
                  {formatRupiah(summary.totalPotonganKasbon)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-xs sm:text-sm text-slate-950">
                  {formatRupiah(summary.totalNet)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Ringkasan Status Pembayaran Gaji Footer */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 text-[11px] block">Gaji Sudah Terbayar (Lunas):</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">
                {formatRupiah(summary.totalPaid)} ({summary.paidCount} orang)
              </span>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 text-[11px] block">Gaji Belum Dibayar (Pending):</span>
              <span className="font-bold text-amber-700 font-mono text-sm">
                {formatRupiah(summary.totalPending)} ({summary.pendingCount} orang)
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Sisa Piutang Kasbon Pekerja Aktif:</span>
            <span className="font-bold text-rose-700 font-mono text-sm">
              {formatRupiah(summary.activeKasbonTotal)}
            </span>
          </div>
        </div>

        {/* Formal Signatures on Printable Document */}
        <div className="mt-8 pt-4 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
          <div>
            <p className="text-slate-500 mb-14">Dibuat Oleh (Mandor/PJ)</p>
            <p className="font-bold underline text-slate-900">{company.penanggungJawab}</p>
            <p className="text-[11px] text-slate-500">Penanggung Jawab Lapangan</p>
          </div>

          <div>
            <p className="text-slate-500 mb-14">Diperiksa (Bendahara)</p>
            <p className="font-bold underline text-slate-900">( ........................................ )</p>
            <p className="text-[11px] text-slate-500">Bagian Keuangan / Kasir</p>
          </div>

          <div>
            <p className="text-slate-500 mb-14">Disetujui Oleh (Owner Proyek)</p>
            <p className="font-bold underline text-slate-900">( ........................................ )</p>
            <p className="text-[11px] text-slate-500">Pimpinan / Pemilik Proyek</p>
          </div>
        </div>

      </div>

    </div>
  );
};
