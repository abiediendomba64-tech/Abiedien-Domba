import React, { useState } from 'react';
import { 
  ShieldCheck, 
  History, 
  Settings, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload,
  Search, 
  UserCheck, 
  Phone, 
  Calendar, 
  Building2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Save,
  Sparkles,
  Database
} from 'lucide-react';
import { AuditLog, CompanySettings } from '../types';
import { exportCsv, formatRupiah } from '../utils/formatters';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
  company: CompanySettings;
  onUpdateCompany: (company: CompanySettings) => void;
  onClearAllMockData: () => void;
  onResetToDefault: () => void;
  onClearAbsensiOnly: () => void;
  onClearKasOnly: () => void;
  onLoadDetail1319Sep?: () => void;
  onLogAudit?: (action: string, target: string, details: string) => void;
  onRestoreSuccess?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  auditLogs,
  company,
  onUpdateCompany,
  onClearAllMockData,
  onResetToDefault,
  onClearAbsensiOnly,
  onClearKasOnly,
  onLoadDetail1319Sep,
  onLogAudit,
  onRestoreSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempCompany, setTempCompany] = useState<CompanySettings>(company);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Sync tempCompany if prop company changes
  React.useEffect(() => {
    setTempCompany(company);
  }, [company]);

  // Download all LocalStorage contents as JSON file
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
            backupData.localStorageData[key] = rawVal ? JSON.parse(rawVal) : rawVal;
          } catch {
            backupData.localStorageData[key] = rawVal;
          }
        }
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `Cadangan_PayrollDB_LocalStorage_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupError(null);
      setBackupNotice('Cadangan data berhasil diunduh ke file JSON!');
      setTimeout(() => setBackupNotice(null), 5000);

      if (onLogAudit) {
        onLogAudit('Download Cadangan Data', 'LocalStorage Backup', 'Berhasil mengunduh seluruh isi LocalStorage ke dalam file JSON');
      }
    } catch (err) {
      console.error('Gagal mengunduh cadangan:', err);
      setBackupError('Gagal mengunduh cadangan data. Pastikan izin download aktif pada browser.');
    }
  };

  // Restore LocalStorage from uploaded JSON backup file
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const store = parsed.localStorageData || parsed.localStorage || parsed;

        let count = 0;
        Object.keys(store).forEach((key) => {
          const val = typeof store[key] === 'string' ? store[key] : JSON.stringify(store[key]);
          localStorage.setItem(key, val);
          count++;
        });

        setBackupNotice(`Berhasil memulihkan ${count} kunci data dari file cadangan! Memuat ulang data...`);
        if (onRestoreSuccess) {
          setTimeout(() => {
            onRestoreSuccess();
          }, 800);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      } catch (err) {
        console.error('File backup tidak valid:', err);
        setBackupError('Format file cadangan JSON tidak valid atau berkas rusak.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(tempCompany);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.actor.toLowerCase().includes(term) ||
      (log.target && log.target.toLowerCase().includes(term)) ||
      log.details.toLowerCase().includes(term)
    );
  });

  const handleExportLogs = () => {
    const headers = ['ID', 'Waktu', 'Pelaku / User', 'Aksi', 'Target Objek', 'Rincian Perubahan'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.target || '-').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    exportCsv(`Audit_Log_Sistem_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Audit Sistem & Pengaturan Data Lapangan
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Rekam jejak perubahan data, konfigurasi kontak WhatsApp default, serta alat pembersih data mock untuk menginput data riil lapangan.
          </p>
          {backupNotice && (
            <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{backupNotice}</span>
            </div>
          )}
          {backupError && (
            <div className="mt-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{backupError}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Cadangan Data Button (Unduh Seluruh LocalStorage ke JSON) */}
          <button
            id="btn-download-cadangan-top"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Download Cadangan Data (Unduh seluruh isi LocalStorage ke dalam file JSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Cadangan Data</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Cadangan Data, Pengaturan Proyek & Kontak WhatsApp */}
        <div className="lg:col-span-1 space-y-5">

          {/* KOTAK FITUR UTAMA: DOWNLOAD CADANGAN DATA LOCALSTORAGE */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Download Cadangan Data</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                JSON Backup
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unduh seluruh isi <b>LocalStorage</b> (Daftar Pekerja, Presensi 13-19 Sep, Kasbon, Pembukuan Kas & Konfigurasi) ke dalam format file JSON agar data Anda selalu aman dan dapat disimpan secara manual di perangkat Anda.
            </p>

            <div className="space-y-2 pt-1">
              <button
                id="btn-download-cadangan-panel"
                onClick={handleDownloadBackup}
                className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Cadangan Data</span>
              </button>

              <label className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Pulihkan dari File Cadangan (JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Inti Proyek</span>
              </h3>
              {isSavedNotice && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Tersimpan
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Default / Admin
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tempCompany.noWaDefault || '+6281318575529'}
                    onChange={(e) => setTempCompany({ ...tempCompany, noWaDefault: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                    placeholder="+62 813-1857-5529"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Nomor utama pengirim slip & tanda terima kasbon.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Proyek / Kegiatan
                </label>
                <input
                  type="text"
                  value={tempCompany.namaProyek}
                  onChange={(e) => setTempCompany({ ...tempCompany, namaProyek: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Badan Usaha / Kontraktor
                </label>
                <input
                  type="text"
                  value={tempCompany.namaPerusahaan}
                  onChange={(e) => setTempCompany({ ...tempCompany, namaPerusahaan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandor / Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={tempCompany.penanggungJawab}
                  onChange={(e) => setTempCompany({ ...tempCompany, penanggungJawab: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Periode Gaji & Absensi
                </label>
                <input
                  type="text"
                  value={tempCompany.periodeGaji}
                  onChange={(e) => setTempCompany({ ...tempCompany, periodeGaji: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif Lembur per Jam (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={tempCompany.tarifLemburPerJam || 20000}
                  onChange={(e) => setTempCompany({ ...tempCompany, tarifLemburPerJam: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </form>
          </div>

          {/* Data Reset & Anti-Mock Controls */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Manajemen Data Riil Lapangan</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika Anda ingin langsung menggunakan aplikasi ini untuk proyek nyata tanpa data dummy, Anda dapat membersihkannya di bawah ini:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <button
                onClick={onClearAbsensiOnly}
                className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-left flex items-center justify-between transition-colors"
              >
                <span>Bersihkan Absensi Dummy</span>
                <span className="text-[10px] text-slate-400">Nol-kan Presensi</span>
              </button>

              <button
                onClick={onClearKasOnly}
                className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-left flex items-center justify-between transition-colors"
              >
                <span>Bersihkan Buku Kas Dummy</span>
                <span className="text-[10px] text-slate-400">Kosongkan Kas</span>
              </button>

              <button
                onClick={onClearAllMockData}
                className="w-full py-2 px-3 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl font-semibold text-left flex items-center justify-between transition-colors"
              >
                <span>Kosongkan Seluruh Data Mock</span>
                <span className="text-[10px] text-rose-500">Mulai dari Nol</span>
              </button>

              <button
                onClick={onResetToDefault}
                className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-left flex items-center justify-between transition-colors text-[11px]"
              >
                <span>Isi Ulang Data Contoh Demo</span>
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Riwayat Audit Trail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-600" />
                  <span>Log Riwayat Audit & Keamanan Transaksi</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Semua aktivitas perubahan slip gaji, centang absensi, dan transaksi kas tercatat otomatis.
                </p>
              </div>

              {/* Search Log */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari aksi / user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3 min-w-[130px]">Waktu</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Pelaku</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Rincian Transaksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Tidak ada catatan log yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {log.actor}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {log.target && (
                            <div className="font-semibold text-slate-900 text-xs">{log.target}</div>
                          )}
                          <div className="text-[11px] text-slate-500 mt-0.5">{log.details}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
              Total {filteredLogs.length} riwayat aktivitas tercatat dalam sistem.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
