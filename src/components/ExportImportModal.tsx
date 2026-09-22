import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, RotateCcw, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Karyawan } from '../types';
import { exportCsv } from '../utils/formatters';
import { INITIAL_KARYAWAN } from '../data/initialData';
import { ConfirmModal } from './ConfirmModal';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  karyawanList: Karyawan[];
  onImportData: (data: Karyawan[]) => void;
  onResetToDefault: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  karyawanList,
  onImportData,
  onResetToDefault
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    exportCsv(karyawanList, `PayrollDB_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(karyawanList, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PayrollDB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setStatusMsg({ type: 'success', text: 'File cadangan JSON berhasil diunduh.' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onImportData(parsed);
            setStatusMsg({ type: 'success', text: `Berhasil mengimpor ${parsed.length} data karyawan!` });
            setTimeout(() => {
              onClose();
            }, 1200);
          } else {
            setStatusMsg({ type: 'error', text: 'Format file JSON tidak valid. Harus berupa daftar data array karyawan.' });
          }
        } else {
          setStatusMsg({ type: 'error', text: 'Silakan unggah file backup berformat .json.' });
        }
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Gagal membaca file: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ekspor, Impor & Cadangan Data
            </h3>
            <p className="text-xs text-slate-500">
              Kelola data payroll agar tersimpan aman di komputer atau HP Anda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-4 pt-4">
          
          {/* Export Options */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              1. Unduh Data (Ekspor)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportCsv}
                className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Unduh CSV / Excel</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format tabel untuk Microsoft Excel atau Google Sheets.
                </p>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Cadangan JSON</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Salinan backup lengkap untuk dipulihkan nanti.
                </p>
              </button>
            </div>
          </div>

          {/* Import Option */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block">
              2. Pulihkan dari File Cadangan (Impor)
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Pilih File Backup (.json)</span>
              </div>
              <span className="text-[11px] text-slate-400">Pilih file...</span>
            </button>
          </div>

          {/* Reset to Default Sample Data */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block">
              3. Data Contoh Awal
            </span>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>Kembalikan ke Contoh Data Bawaan</span>
            </button>
          </div>

        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Kembalikan ke Data Bawaan?"
        message={
          <div>
            Reset seluruh data karyawan ke contoh bawaan awal (Abah, Eeng, Rohman, Eteh, Dafid, Ompong)?
            <br />
            <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
              Perhatian: Data perubahan atau karyawan baru yang Anda masukkan saat ini akan ditimpa!
            </span>
          </div>
        }
        confirmText="Ya, Reset Data"
        cancelText="Batal"
        variant="warning"
        onConfirm={() => {
          onResetToDefault();
          setShowResetConfirm(false);
          onClose();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
