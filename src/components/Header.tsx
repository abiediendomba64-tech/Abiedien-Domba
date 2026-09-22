import React, { useState } from 'react';
import { 
  Building2, 
  Download, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Briefcase,
  Database
} from 'lucide-react';
import { CompanySettings, GoogleSheetsConfig } from '../types';

interface HeaderProps {
  company: CompanySettings;
  onUpdateCompany: (company: CompanySettings) => void;
  sheetsConfig?: GoogleSheetsConfig;
  onOpenSheetsModal?: () => void;
  onOpenExportModal: () => void;
  onOpenAddModal: () => void;
  onQuickSync?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  company,
  onUpdateCompany,
  sheetsConfig,
  onOpenSheetsModal,
  onOpenExportModal,
  onOpenAddModal,
  onQuickSync,
  isSyncing = false
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempCompany, setTempCompany] = useState<CompanySettings>(company);

  const isConnectedToSheets = Boolean(sheetsConfig?.scriptUrl && sheetsConfig.scriptUrl.startsWith('http'));

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(tempCompany);
    setShowSettingsModal(false);
  };

  const handleDownloadBackup = () => {
    try {
      const backupData: Record<string, any> = {
        app: 'Sistem Manajemen Penggajian & Presensi Proyek',
        exportedAt: new Date().toISOString(),
        exportedFormatted: new Date().toLocaleString('id-ID'),
        localStorageData: {}
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const rawVal = localStorage.getItem(key);
          try {
            backupData.localStorageData[key] = rawVal ? JSON.parse(rawVal) : null;
          } catch {
            backupData.localStorageData[key] = rawVal;
          }
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cadangan_Data_Payroll_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengunduh cadangan:', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* Brand & Project Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {company.namaPerusahaan}
                </h1>
                <button
                  onClick={() => {
                    setTempCompany(company);
                    setShowSettingsModal(true);
                  }}
                  title="Edit Nama Usaha / Proyek"
                  className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  {company.namaProyek}
                </span>
                <span>•</span>
                <span className="text-slate-500">Periode: {company.periodeGaji}</span>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 100% Offline-First Badge */}
            <div 
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
              title="100% Offline-First: Data tersimpan aman di LocalStorage perangkat Anda tanpa perlu server atau internet"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Offline (LocalStorage)</span>
            </div>

            {/* Export / Backup button */}
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Cadangan & Ekspor</span>
              <span className="sm:hidden">Backup</span>
            </button>

            {/* Add Employee Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Karyawan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal (Nama Proyek / Perusahaan) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Pengaturan Identitas Proyek / Usaha
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nama dan penanggung jawab akan tercetak di slip gaji WhatsApp dan struk kwitansi resmi.
            </p>

            <form onSubmit={handleSaveCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Usaha
                </label>
                <input
                  type="text"
                  value={tempCompany.namaPerusahaan}
                  onChange={(e) => setTempCompany({ ...tempCompany, namaPerusahaan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Proyek / Cabang
                </label>
                <input
                  type="text"
                  value={tempCompany.namaProyek}
                  onChange={(e) => setTempCompany({ ...tempCompany, namaProyek: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penanggung Jawab / Mandor / Bendahara
                </label>
                <input
                  type="text"
                  value={tempCompany.penanggungJawab}
                  onChange={(e) => setTempCompany({ ...tempCompany, penanggungJawab: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode Gaji Saat Ini
                </label>
                <input
                  type="text"
                  value={tempCompany.periodeGaji}
                  onChange={(e) => setTempCompany({ ...tempCompany, periodeGaji: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Contoh: Periode 12 - 18 September 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standar Tarif Lembur per Jam (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={tempCompany.tarifLemburPerJam || 20000}
                  onChange={(e) => setTempCompany({ ...tempCompany, tarifLemburPerJam: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Digunakan untuk menghitung bonus lembur otomatis di menu Absensi.
                </p>
              </div>

              {/* Fitur Download Cadangan Data */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Cadangan Data Sistem (Backup Manual)
                </label>
                <button
                  type="button"
                  id="btn-download-cadangan-header-settings"
                  onClick={handleDownloadBackup}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Download Cadangan Data (Unduh seluruh isi LocalStorage ke dalam file JSON)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Cadangan Data (.JSON)</span>
                </button>
                <p className="text-[10px] text-slate-500">
                  Mengunduh seluruh isi LocalStorage (pekerja, absensi, kasbon, dan kas) ke file JSON agar aman tersimpan di komputer/HP Anda.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
