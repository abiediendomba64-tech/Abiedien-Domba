import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileDown, 
  CheckCircle2, 
  Loader2, 
  Smartphone,
  Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Karyawan, CompanySettings } from '../types';
import { formatRupiah, formatTanggal, terbilang } from '../utils/formatters';

interface SlipPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  karyawan: Karyawan | null;
  company: CompanySettings;
}

export const SlipPrintModal: React.FC<SlipPrintModalProps> = ({
  isOpen,
  onClose,
  karyawan,
  company
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);

  if (!isOpen || !karyawan) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async (tryShare = false) => {
    if (!slipRef.current || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      setPdfStatusMessage('Mengonversi slip menjadi dokumen PDF...');

      // Render slip container to high-res canvas (scale: 2 for sharp vector-like text)
      const element = slipRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      setPdfStatusMessage('Menyusun tata letak PDF...');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 10; // 10mm margins
      const printWidth = pageWidth - margin * 2; // 190mm
      const printHeight = (canvas.height * printWidth) / canvas.width;

      if (printHeight <= pageHeight - margin * 2) {
        // Fits on single A4 sheet
        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
      } else {
        // Multi-page splitting if slip has very long notes or tables
        let heightLeft = printHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - printHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
          heightLeft -= pageHeight;
        }
      }

      const cleanName = (karyawan.nama || 'Karyawan').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanPeriode = (company.periodeGaji || 'Periode').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Slip_Gaji_${cleanName}_${cleanPeriode}.pdf`;

      // If user requested share and device supports sharing files (e.g. mobile Safari / Chrome)
      let sharedSuccessfully = false;
      if (tryShare && typeof navigator !== 'undefined' && 'canShare' in navigator) {
        try {
          const blob = pdf.output('blob');
          const file = new File([blob], filename, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Slip Gaji ${karyawan.nama}`,
              text: `Slip Gaji Resmi ${karyawan.nama} - ${company.namaPerusahaan}`
            });
            sharedSuccessfully = true;
          }
        } catch (shareError) {
          console.warn('Share modal cancelled or not supported, falling back to direct download', shareError);
        }
      }

      // If not shared via native mobile share dialog, trigger direct PDF download
      if (!sharedSuccessfully) {
        pdf.save(filename);
      }

      setPdfStatusMessage(`Slip berhasil disimpan sebagai ${filename}!`);
      setTimeout(() => {
        setPdfStatusMessage(null);
      }, 4000);
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      setPdfStatusMessage('Gagal membuat PDF otomatis. Silakan gunakan tombol Cetak.');
      setTimeout(() => {
        setPdfStatusMessage(null);
      }, 4500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isNonHarian = karyawan.jenis_gaji !== 'Harian';
  const gajiPokok = Number(karyawan.gaji_pokok) || 0;
  const subtotalHarian = isNonHarian && gajiPokok > 0 && !karyawan.gaji_per_hari
    ? 0
    : (Number(karyawan.gaji_per_hari) || 0) * (Number(karyawan.hari_kerja) || (isNonHarian ? 1 : 0));
  const subtotalPokok = isNonHarian && !karyawan.hari_kerja && !gajiPokok
    ? (Number(karyawan.gaji_per_hari) || Number(karyawan.total_gaji) || 0)
    : subtotalHarian;
  const lembur = Number(karyawan.lembur_bonus) || 0;
  const potongan = Number(karyawan.potongan_kasbon) || 0;
  const total = Number(karyawan.total_gaji) || 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Toolbar (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 gap-2 no-print shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              PDF
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                Slip Gaji Resmi #{karyawan.id}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {karyawan.nama} • {company.namaPerusahaan}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Mobile-Friendly Save PDF Button */}
            <button
              type="button"
              onClick={() => handleDownloadPdf(false)}
              disabled={isGeneratingPdf}
              title="Unduh file PDF langsung ke HP/Komputer"
              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Simpan PDF (HP)</span>
                </>
              )}
            </button>

            {/* Print button (desktop printer) */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              title="Buka dialog Cetak / Print"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback / Status Alert for Mobile User */}
        {pdfStatusMessage && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 no-print shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfStatusMessage}</span>
            </div>
          </div>
        )}

        {/* Mobile Quick Action Banner */}
        <div className="bg-slate-50/90 px-4 py-2 border-b border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between no-print shrink-0 sm:hidden">
          <span className="flex items-center gap-1.5 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Format A4 siap simpan ke memori HP</span>
          </span>
          <button
            type="button"
            onClick={() => handleDownloadPdf(true)}
            disabled={isGeneratingPdf}
            className="text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            <span>Bagikan / Kirim</span>
          </button>
        </div>

        {/* The Printable Slip Body with responsive container */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-100/50">
          
          <div 
            ref={slipRef}
            id="slip-printable-content"
            className="p-6 sm:p-8 slip-container bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200 max-w-xl mx-auto"
          >
            
            {/* Header Kop */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                    {company.namaPerusahaan}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Proyek / Divisi: {company.namaProyek}
                  </p>
                  <p className="text-xs text-slate-500">
                    Periode Penggajian: <span className="font-semibold text-slate-800">{company.periodeGaji}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 font-mono text-[11px] font-bold rounded-md">
                    SLIP #{String(karyawan.id).padStart(4, '0')}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tanggal Periode: {formatTanggal(karyawan.tanggal)}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    karyawan.status === 'Bayar' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {karyawan.status === 'Bayar' ? 'LUNAS / SUDAH DIBAYAR' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 mb-5">
              <div>
                <span className="text-slate-500 block text-[11px]">Nama Karyawan:</span>
                <span className="font-bold text-slate-900 text-sm">{karyawan.nama}</span>
                <span className="text-slate-500 ml-1.5 font-semibold">({karyawan.kode})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Jenis Pekerjaan / Jabatan:</span>
                <span className="font-semibold text-slate-800 text-sm">{karyawan.pekerjaan}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sistem Upah:</span>
                <span className="font-semibold text-slate-800">{karyawan.jenis_gaji}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nomor WhatsApp:</span>
                <span className="font-semibold text-slate-800 font-mono">{karyawan.no_wa || '-'}</span>
              </div>
            </div>

            {/* Table Breakdown */}
            <table className="w-full text-xs border border-slate-200 mb-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2 px-3 text-left">Deskripsi Komponen Upah</th>
                  <th className="py-2 px-3 text-center">Volume / Hari</th>
                  <th className="py-2 px-3 text-right">Tarif Satuan</th>
                  <th className="py-2 px-3 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Upah Harian jika ada */}
                {((Number(karyawan.gaji_per_hari) > 0 && Number(karyawan.hari_kerja) > 0) || (!gajiPokok && !isNonHarian)) && (
                  <tr>
                    <td className="py-2.5 px-3 font-medium">
                      Upah Harian Kerja ({karyawan.jenis_gaji})
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {karyawan.hari_kerja} Hari
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(karyawan.gaji_per_hari)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatRupiah(subtotalHarian)}</td>
                  </tr>
                )}
                {/* Gaji Pokok jika ada */}
                {gajiPokok > 0 && (
                  <tr>
                    <td className="py-2.5 px-3 font-medium">
                      Gaji Pokok ({karyawan.jenis_gaji})
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      1 Periode
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(gajiPokok)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">{formatRupiah(gajiPokok)}</td>
                  </tr>
                )}
                {/* Non-harian tanpa gaji pokok */}
                {isNonHarian && !gajiPokok && (
                  <tr>
                    <td className="py-2.5 px-3 font-medium">
                      Hak Upah Tetap ({karyawan.jenis_gaji})
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      Non-Harian
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(subtotalPokok)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatRupiah(subtotalPokok)}</td>
                  </tr>
                )}
                {lembur > 0 && (
                  <tr className="text-emerald-800 bg-emerald-50/40">
                    <td className="py-2 px-3 font-medium">Tambahan Lembur / Bonus Khusus</td>
                    <td className="py-2 px-3 text-center">-</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">+{formatRupiah(lembur)}</td>
                  </tr>
                )}
                {potongan > 0 && (
                  <tr className="text-rose-800 bg-rose-50/40">
                    <td className="py-2 px-3 font-medium">Potongan / Pinjaman Kasbon</td>
                    <td className="py-2 px-3 text-center">-</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">-{formatRupiah(potongan)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs sm:text-sm">
                  <td colSpan={3} className="py-2.5 px-3 uppercase tracking-wider text-[11px] sm:text-xs">
                    Total Gaji Bersih Diterima (Take Home Pay)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm sm:text-base">
                    {formatRupiah(total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Terbilang Box */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-5 text-xs">
              <span className="text-slate-500 font-medium block text-[11px] mb-0.5">Terbilang:</span>
              <span className="font-bold text-slate-800 italic">
                "{terbilang(total)}"
              </span>
            </div>

            {/* Catatan if exists */}
            {karyawan.catatan && (
              <div className="text-xs text-slate-600 mb-5">
                <span className="font-semibold text-slate-800">Keterangan: </span>
                {karyawan.catatan}
              </div>
            )}

            {/* Signature Sign-offs */}
            <div className="grid grid-cols-2 gap-6 text-xs pt-3 text-center">
              <div>
                <p className="text-slate-500 mb-12">Tanda Tangan Penerima Upah,</p>
                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[140px]">
                  ( {karyawan.nama} )
                </p>
              </div>

              <div>
                <p className="text-slate-500 mb-12">Bendahara / Penanggung Jawab,</p>
                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[140px]">
                  ( {company.penanggungJawab} )
                </p>
              </div>
            </div>

            {/* Printable Footer */}
            <div className="mt-6 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
              Dicetak secara resmi melalui PayrollDB Pro • Sistem Penggajian Mandiri
            </div>

          </div>

        </div>

        {/* Modal Bottom Footer on Mobile */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex sm:hidden items-center justify-between gap-2 no-print shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={() => handleDownloadPdf(false)}
            disabled={isGeneratingPdf}
            className="flex-1 py-2.5 px-4 text-xs font-bold bg-emerald-600 active:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Simpan PDF ke HP</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

