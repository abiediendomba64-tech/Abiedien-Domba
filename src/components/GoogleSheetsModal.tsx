import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Check, 
  Copy, 
  RefreshCw, 
  DownloadCloud, 
  UploadCloud, 
  HelpCircle, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { GoogleSheetsConfig, Karyawan } from '../types';
import { APPS_SCRIPT_TEMPLATE, fetchGoogleSheetData } from '../services/sheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
  onPullFromSheets: () => Promise<void>;
  onPushToSheets: () => Promise<void>;
  isSyncing: boolean;
  karyawanCount: number;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onPullFromSheets,
  onPushToSheets,
  isSyncing,
  karyawanCount
}) => {
  const [url, setUrl] = useState(config.scriptUrl);
  const [activeTab, setActiveTab] = useState<'config' | 'tutorial' | 'script'>('config');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      scriptUrl: url.trim(),
    });
    setTestResult({ status: 'idle' });
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ status: 'error', message: 'Masukkan URL Google Apps Script terlebih dahulu' });
      return;
    }

    setTestResult({ status: 'testing' });
    try {
      const data = await fetchGoogleSheetData(url.trim());
      setTestResult({ 
        status: 'success', 
        message: `Koneksi Berhasil! Terdeteksi ${data.length} baris data karyawan di Google Sheet Anda.` 
      });
      onSaveConfig({
        ...config,
        scriptUrl: url.trim(),
      });
    } catch (err: any) {
      setTestResult({ 
        status: 'error', 
        message: err.message || 'Gagal tersambung. Pastikan izin deployment Web App diatur ke "Anyone".' 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Integrasi Google Sheets & Apps Script
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  100% Gratis
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Gunakan Google Sheets sebagai database cloud tanpa biaya langganan bulanan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-4 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Sambungkan URL Web App
          </button>
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'tutorial'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Panduan Setup (4 Langkah)
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'script'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Kode Google Apps Script
          </button>
        </div>

        {/* TAB 1: CONFIG */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Web App Google Apps Script:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testResult.status === 'testing'}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shrink-0 transition-colors"
                  >
                    {testResult.status === 'testing' ? 'Menguji...' : 'Tes Koneksi'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dapatkan URL ini saat Anda melakukan <b>Deploy &gt; New deployment &gt; Web app</b> di Google Apps Script.
                </p>
              </div>

              {/* Test feedback */}
              {testResult.status === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Status Tersambung</span>
                    {testResult.message}
                  </div>
                </div>
              )}

              {testResult.status === 'error' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Gagal Tersambung</span>
                    {testResult.message}
                  </div>
                </div>
              )}

              {/* Sync Actions Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700">
                  Operasi Sinkronisasi Data ({karyawanCount} data di memori aplikasi)
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onPullFromSheets}
                    disabled={isSyncing || !url}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-left transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      <DownloadCloud className="w-4 h-4 text-emerald-600" />
                      <span>Tarik Data dari Sheet</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ambil dan timpa data lokal dengan isi terbaru dari Google Sheet.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={onPushToSheets}
                    disabled={isSyncing || !url}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-left transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      <UploadCloud className="w-4 h-4 text-blue-600" />
                      <span>Kirim Data ke Sheet</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kirim data lokal saat ini untuk disimpan ke Google Sheet.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('tutorial')}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Lihat Cara Buat Google Sheet Gratis
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: TUTORIAL */}
        {activeTab === 'tutorial' && (
          <div className="space-y-3.5 text-xs text-slate-700 max-h-[380px] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="font-bold text-blue-900 block mb-1">
                Kenapa Menggunakan Google Sheets?
              </span>
              Google Sheets memberi Anda penyimpanan database 15 GB gratis, bisa dibuka di HP Android lewat aplikasi Google Spreadsheet, dan bisa diedit bersama tim tanpa biaya server sama sekali.
            </div>

            <ol className="space-y-3 list-decimal list-inside font-medium">
              <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">Buat Google Sheet Baru:</span>
                <p className="text-slate-500 text-[11px] mt-0.5 ml-4">
                  Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-bold">sheets.new</a>, beri nama file <b>"PayrollDB"</b>. Beri nama sheet pertama: <b>karyawan</b>.
                </p>
              </li>

              <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">Beri Header di Baris 1:</span>
                <p className="text-slate-500 text-[11px] mt-0.5 ml-4 font-mono bg-white p-1 rounded border">
                  id, kode, nama, pekerjaan, jenis_gaji, gaji_per_hari, hari_kerja, total_gaji, tanggal, status, no_wa, catatan
                </p>
              </li>

              <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">Buka Apps Script:</span>
                <p className="text-slate-500 text-[11px] mt-0.5 ml-4">
                  Di Google Sheet, klik menu <b>Ekstensi &gt; Apps Script</b>. Hapus semua kode default dan ganti dengan kode dari Tab <b>"3. Kode Google Apps Script"</b> di atas.
                </p>
              </li>

              <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">Deploy sebagai Web App:</span>
                <p className="text-slate-500 text-[11px] mt-0.5 ml-4">
                  Klik tombol <b>Deploy &gt; New deployment</b>. Pilih jenis: <b>Web app</b>.<br/>
                  • Execute as: <b>Me</b><br/>
                  • Who has access: <b>Anyone</b><br/>
                  Klik <b>Deploy</b>, lalu salin URL yang muncul dan masukkan ke tab "1. Sambungkan URL".
                </p>
              </li>
            </ol>
          </div>
        )}

        {/* TAB 3: SCRIPT CODE */}
        {activeTab === 'script' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Kode Google Apps Script siap pakai (Mendukung GET, POST, PUT, DELETE):
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>

            <pre className="p-3 text-[11px] font-mono bg-slate-900 text-slate-100 rounded-xl overflow-x-auto max-h-[320px] leading-relaxed">
              {APPS_SCRIPT_TEMPLATE}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
