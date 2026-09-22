import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  FileSpreadsheet, 
  UserPlus, 
  Download, 
  Plus, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  Karyawan, 
  CompanySettings, 
  GoogleSheetsConfig, 
  StatusPembayaran, 
  ActiveTab, 
  AbsensiRecord, 
  KasbonRecord,
  TransaksiKas,
  AuditLog
} from './types';
import { 
  INITIAL_KARYAWAN, 
  INITIAL_COMPANY, 
  INITIAL_ABSENSI, 
  INITIAL_KASBON,
  INITIAL_TRANSAKSI_KAS,
  INITIAL_AUDIT_LOG
} from './data/initialData';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { EmployeeTable } from './components/EmployeeTable';
import { AttendanceView } from './components/AttendanceView';
import { KasbonView } from './components/KasbonView';
import { ReportView } from './components/ReportView';
import { CashflowView } from './components/CashflowView';
import { AuditLogView } from './components/AuditLogView';
import { EmployeeModal } from './components/EmployeeModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SlipPrintModal } from './components/SlipPrintModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AbsensiDetailSection } from './components/AbsensiDetailSection';
import { OverdueKasbonAlert } from './components/OverdueKasbonAlert';
import { fetchGoogleSheetData, sendToGoogleSheet } from './services/sheetsService';
import { isKasbonOverdue } from './utils/formatters';

export default function App() {
  // 1. Persistent State Initialization (LocalStorage)
  // Default to clean empty arrays [] so operators begin with real data (no placeholder/mock data).
  // Sample data can be loaded anytime with 1-click if simulation is needed.
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>(() => {
    try {
      const saved = localStorage.getItem('payroll_karyawan_data');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage karyawan', e);
    }
    return [];
  });

  const [company, setCompany] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem('payroll_company_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading localStorage company', e);
    }
    return INITIAL_COMPANY;
  });

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    try {
      const saved = localStorage.getItem('payroll_sheets_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading localStorage sheets config', e);
    }
    return { scriptUrl: '', autoSync: false };
  });

  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>(() => {
    try {
      const saved = localStorage.getItem('payroll_absensi_data');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage absensi', e);
    }
    return [];
  });

  const [kasbonList, setKasbonList] = useState<KasbonRecord[]>(() => {
    try {
      const saved = localStorage.getItem('payroll_kasbon_data');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage kasbon', e);
    }
    return [];
  });

  const [transaksiKasList, setTransaksiKasList] = useState<TransaksiKas[]>(() => {
    try {
      const saved = localStorage.getItem('payroll_transaksi_kas_data');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage transaksi kas', e);
    }
    return [];
  });

  const [auditLogList, setAuditLogList] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('payroll_audit_log_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage audit log', e);
    }
    return INITIAL_AUDIT_LOG;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('penggajian');

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('payroll_karyawan_data', JSON.stringify(karyawanList));
  }, [karyawanList]);

  useEffect(() => {
    localStorage.setItem('payroll_company_settings', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('payroll_sheets_config', JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  useEffect(() => {
    localStorage.setItem('payroll_absensi_data', JSON.stringify(absensiList));
  }, [absensiList]);

  useEffect(() => {
    localStorage.setItem('payroll_kasbon_data', JSON.stringify(kasbonList));
  }, [kasbonList]);

  useEffect(() => {
    localStorage.setItem('payroll_transaksi_kas_data', JSON.stringify(transaksiKasList));
  }, [transaksiKasList]);

  useEffect(() => {
    localStorage.setItem('payroll_audit_log_data', JSON.stringify(auditLogList));
  }, [auditLogList]);

  // Helper to append audit log
  const logAudit = (action: string, target?: string, details?: string, actor = 'Mandor Utama') => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor,
      action,
      target,
      details: details || ''
    };
    setAuditLogList((prev) => [newLog, ...prev.slice(0, 200)]); // keep latest 200 logs
  };

  // 2. Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gajiFilter, setGajiFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id-asc');

  // 3. Modal States
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingKaryawan, setEditingKaryawan] = useState<Karyawan | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedForWA, setSelectedForWA] = useState<Karyawan | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Karyawan | null>(null);

  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation Modals State (Reliable across all browsers and iframes)
  const [deleteEmployeeTarget, setDeleteEmployeeTarget] = useState<{ id: number | string; nama: string } | null>(null);
  const [clearDataModal, setClearDataModal] = useState<'all' | 'absensi' | 'kas' | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 4. Filter and Sort Logic
  const filteredKaryawan = useMemo(() => {
    let result = [...karyawanList];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (k) =>
          k.nama.toLowerCase().includes(term) ||
          k.kode.toLowerCase().includes(term) ||
          k.pekerjaan.toLowerCase().includes(term) ||
          (k.no_wa && k.no_wa.includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((k) => k.status === statusFilter);
    }

    // Gaji type filter
    if (gajiFilter !== 'all') {
      result = result.filter((k) => k.jenis_gaji === gajiFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'nama-asc') return a.nama.localeCompare(b.nama);
      if (sortBy === 'total-desc') return b.total_gaji - a.total_gaji;
      if (sortBy === 'total-asc') return a.total_gaji - b.total_gaji;
      if (sortBy === 'hari-desc') return b.hari_kerja - a.hari_kerja;
      return Number(a.id) - Number(b.id);
    });

    return result;
  }, [karyawanList, searchTerm, statusFilter, gajiFilter, sortBy]);

  // 5. Employee CRUD Actions
  const handleSaveEmployee = (data: Omit<Karyawan, 'id'> & { id?: number | string }) => {
    if (data.id !== undefined) {
      // Update existing
      setKaryawanList((prev) =>
        prev.map((item) => (item.id === data.id ? { ...(data as Karyawan) } : item))
      );
      logAudit('Update Karyawan', data.nama, `Upah/hari: Rp ${(data.gaji_per_hari || 0).toLocaleString('id-ID')}, Hari: ${data.hari_kerja}`);
      showToast(`Data karyawan ${data.nama} berhasil diperbarui!`);

      // Sync to Google Sheet if connected
      if (sheetsConfig.scriptUrl) {
        sendToGoogleSheet(sheetsConfig.scriptUrl, 'PUT', data);
      }
    } else {
      // Create new with auto-increment ID
      const newId = karyawanList.length > 0 ? Math.max(...karyawanList.map((k) => Number(k.id) || 0)) + 1 : 1;
      const newEmployee: Karyawan = {
        ...data,
        id: newId,
      };
      setKaryawanList((prev) => [...prev, newEmployee]);
      logAudit('Tambah Karyawan', data.nama, `Jabatan: ${data.pekerjaan}, Upah: Rp ${(data.gaji_per_hari || 0).toLocaleString('id-ID')}`);
      showToast(`Karyawan ${data.nama} berhasil ditambahkan!`);

      // Sync to Google Sheet if connected
      if (sheetsConfig.scriptUrl) {
        sendToGoogleSheet(sheetsConfig.scriptUrl, 'POST', newEmployee);
      }
    }
    setIsEmployeeModalOpen(false);
    setEditingKaryawan(null);
  };

  const handleToggleStatus = (id: number | string, currentStatus: StatusPembayaran) => {
    const nextStatus: StatusPembayaran = currentStatus === 'Pending' ? 'Bayar' : 'Pending';
    setKaryawanList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: nextStatus } : k))
    );

    const targetKaryawan = karyawanList.find((k) => k.id === id);
    if (targetKaryawan) {
      logAudit('Ubah Status Pembayaran', targetKaryawan.nama, `Status diubah: ${currentStatus} -> ${nextStatus}`);
      showToast(`Status ${targetKaryawan.nama} diubah menjadi: ${nextStatus === 'Bayar' ? 'Lunas / Bayar' : 'Pending'}`);

      // Sync to Google Sheet if connected
      if (sheetsConfig.scriptUrl) {
        sendToGoogleSheet(sheetsConfig.scriptUrl, 'PUT', { ...targetKaryawan, status: nextStatus });
      }
    }
  };

  const handleDeleteEmployee = (id: number | string, nama: string) => {
    setDeleteEmployeeTarget({ id, nama });
  };

  const executeDeleteEmployee = () => {
    if (!deleteEmployeeTarget) return;
    const { id, nama } = deleteEmployeeTarget;
    setKaryawanList((prev) => prev.filter((k) => k.id !== id));
    logAudit('Hapus Karyawan', nama, `Menghapus data karyawan ID ${id}`);
    showToast(`Data karyawan "${nama}" telah dihapus.`);

    // Sync to Google Sheet if connected
    if (sheetsConfig.scriptUrl) {
      sendToGoogleSheet(sheetsConfig.scriptUrl, 'DELETE', { id });
    }
    setDeleteEmployeeTarget(null);
  };

  const handleBulkUpdateStatus = (status: StatusPembayaran) => {
    const filteredIds = new Set(filteredKaryawan.map((k) => k.id));
    setKaryawanList((prev) =>
      prev.map((k) => (filteredIds.has(k.id) ? { ...k, status } : k))
    );
    logAudit('Mass Update Status', `${filteredKaryawan.length} Karyawan`, `Mengubah status menjadi: ${status}`);
    showToast(`Status ${filteredKaryawan.length} karyawan diubah menjadi: ${status === 'Bayar' ? 'Lunas' : 'Pending'}`);
  };

  // 6. Google Sheets Pull and Push
  const handlePullFromSheets = async () => {
    if (!sheetsConfig.scriptUrl) {
      showToast('URL Google Apps Script belum disetel.');
      return;
    }
    setIsSyncing(true);
    try {
      const data = await fetchGoogleSheetData(sheetsConfig.scriptUrl);
      if (data && data.length > 0) {
        setKaryawanList(data);
        showToast(`Berhasil menarik ${data.length} data karyawan dari Google Sheet!`);
        setIsSheetsModalOpen(false);
      } else {
        showToast('Tidak ditemukan data baris di sheet atau format belum sesuai.');
      }
    } catch (err: any) {
      showToast('Gagal mengambil data dari Google Sheet: ' + (err?.message || 'Error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheets = async () => {
    if (!sheetsConfig.scriptUrl) {
      showToast('URL Google Apps Script belum disetel.');
      return;
    }
    setIsSyncing(true);
    try {
      // Loop or post all items
      let successCount = 0;
      for (const k of karyawanList) {
        const res = await sendToGoogleSheet(sheetsConfig.scriptUrl, 'POST', k);
        if (res.success) successCount++;
      }
      showToast(`Berhasil mengirimkan ${successCount} data ke Google Sheet!`);
      setIsSheetsModalOpen(false);
    } catch (err: any) {
      showToast('Gagal mengirim data ke Google Sheet: ' + (err?.message || 'Error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetToDefault = () => {
    setKaryawanList(INITIAL_KARYAWAN);
    setCompany(INITIAL_COMPANY);
    setAbsensiList(INITIAL_ABSENSI);
    setKasbonList(INITIAL_KASBON);
    setTransaksiKasList(INITIAL_TRANSAKSI_KAS);
    setAuditLogList(INITIAL_AUDIT_LOG);
    logAudit('Reset Sistem', 'Database Proyek', 'Mengembalikan seluruh data ke data demo awal');
    showToast('Semua data dikembalikan ke contoh awal.');
  };

  const handleResetDetailTo1319Sep = () => {
    setKaryawanList(INITIAL_KARYAWAN);
    setCompany(INITIAL_COMPANY);
    setAbsensiList(INITIAL_ABSENSI);
    logAudit('Muat Absensi 13-19 Sep', 'Presensi & Slip', 'Memuat data presensi 13-19 Sep (Eeng & Rohman 6 hari kerja, 4 pekerja 0 hari)');
    showToast('Data absensi detail 13-19 Sep berhasil dimuat!');
  };

  // 7. Absensi Handlers
  const handleSaveAbsensi = (records: AbsensiRecord[]) => {
    setAbsensiList((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      records.forEach((r) => map.set(r.id, r));
      return Array.from(map.values());
    });
    logAudit('Update Absensi', 'Presensi', `Memperbarui ${records.length} catatan absensi`);
    showToast('Data absensi harian berhasil diperbarui!');
  };

  const handleSyncAttendanceToPayroll = (
    updatedEmployees: { id: number | string; hari_kerja: number; lembur_bonus: number }[]
  ) => {
    const updateMap = new Map(updatedEmployees.map((u) => [String(u.id), u]));
    setKaryawanList((prev) =>
      prev.map((k) => {
        const match = updateMap.get(String(k.id));
        if (!match) return k;
        // Non-harian employees (Per Tanggal, Dana Talang, Bulanan) are protected from daily wage recalculation
        if (k.jenis_gaji !== 'Harian') {
          return k;
        }
        const hariKerja = match.hari_kerja;
        const lembur = match.lembur_bonus;
        const kasbon = Number(k.potongan_kasbon) || 0;
        const pokok = Number(k.gaji_pokok) || 0;
        const total = (k.gaji_per_hari * hariKerja) + pokok + lembur - kasbon;
        return {
          ...k,
          hari_kerja: hariKerja,
          lembur_bonus: lembur,
          total_gaji: total
        };
      })
    );
    logAudit('Sinkronisasi Absensi', 'Slip Gaji', `Sinkronisasi hari kerja & lembur untuk ${updatedEmployees.length} karyawan`);
    showToast(`Berhasil menyinkronkan hari kerja & lembur untuk ${updatedEmployees.length} karyawan!`);
    setActiveTab('penggajian');
  };

  // 8. Kasbon Handlers
  const handleSaveKasbon = (record: KasbonRecord) => {
    setKasbonList((prev) => {
      const exists = prev.some((k) => k.id === record.id);
      if (exists) {
        return prev.map((k) => (k.id === record.id ? record : k));
      }
      return [record, ...prev];
    });
    const kName = karyawanList.find((k) => String(k.id) === String(record.karyawan_id))?.nama || `Karyawan #${record.karyawan_id}`;
    logAudit('Catat Kasbon', kName, `Nominal: Rp ${record.nominal.toLocaleString('id-ID')} (${record.status})`);
    showToast(`Catatan kasbon ${record.status === 'Lunas' ? 'Lunas' : 'tersimpan'}!`);
  };

  const handleAddQuickKasbon = (karyawanId: number | string, nominal: number, keperluan: string) => {
    const newKasbon: KasbonRecord = {
      id: `kas-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      karyawan_id: karyawanId,
      tanggal: new Date().toISOString().split('T')[0],
      nominal,
      keperluan,
      status: 'Belum Lunas'
    };
    handleSaveKasbon(newKasbon);
  };

  const handleDeleteKasbon = (id: string) => {
    const item = kasbonList.find((k) => k.id === id);
    const kName = item ? (karyawanList.find((k) => String(k.id) === String(item.karyawan_id))?.nama || `Karyawan #${item.karyawan_id}`) : `Kasbon #${id}`;
    setKasbonList((prev) => prev.filter((k) => k.id !== id));
    logAudit('Hapus Kasbon', kName, `Menghapus catatan kasbon ID ${id}`);
    showToast('Catatan kasbon dihapus.');
  };

  const handleApplyKasbonToPayroll = (
    applied: { id: number | string; potongan_kasbon: number }[]
  ) => {
    const applyMap = new Map(applied.map((a) => [String(a.id), a.potongan_kasbon]));
    setKaryawanList((prev) =>
      prev.map((k) => {
        if (!applyMap.has(String(k.id))) return k;
        const potongan = applyMap.get(String(k.id)) || 0;
        const gross = k.gaji_per_hari * k.hari_kerja;
        const lembur = Number(k.lembur_bonus) || 0;
        const total = gross + lembur - potongan;
        return {
          ...k,
          potongan_kasbon: potongan,
          total_gaji: total
        };
      })
    );
    logAudit('Terapkan Kasbon', 'Slip Gaji', `Menerapkan potongan kasbon untuk ${applied.length} karyawan`);
    showToast('Kasbon berhasil diterapkan ke potongan slip gaji!');
    setActiveTab('penggajian');
  };

  // 9. Buku Kas Handlers (Masuk / Keluar)
  const handleSaveTransaksiKas = (transaksi: TransaksiKas) => {
    setTransaksiKasList((prev) => {
      const exists = prev.some((t) => t.id === transaksi.id);
      if (exists) {
        return prev.map((t) => (t.id === transaksi.id ? transaksi : t));
      }
      return [transaksi, ...prev];
    });
    logAudit(
      `Kas ${transaksi.tipe}`,
      `Kategori: ${transaksi.kategori}`,
      `Rp ${transaksi.nominal.toLocaleString('id-ID')} - ${transaksi.deskripsi}`
    );
    showToast(`Transaksi kas ${transaksi.tipe === 'Masuk' ? 'pemasukan' : 'pengeluaran'} berhasil disimpan!`);
  };

  const handleDeleteTransaksiKas = (id: string) => {
    const target = transaksiKasList.find((t) => t.id === id);
    setTransaksiKasList((prev) => prev.filter((t) => t.id !== id));
    logAudit('Hapus Transaksi Kas', target?.kategori, `Menghapus: ${target?.deskripsi} (Rp ${target?.nominal.toLocaleString('id-ID')})`);
    showToast('Transaksi kas berhasil dihapus.');
  };

  // 10. Data Cleaning Tools (Reset Mock Data for Real Operations)
  const handleClearAllMockData = () => {
    setClearDataModal('all');
  };

  const handleClearAbsensiOnly = () => {
    setClearDataModal('absensi');
  };

  const handleClearKasOnly = () => {
    setClearDataModal('kas');
  };

  const executeClearData = () => {
    if (clearDataModal === 'all') {
      setKaryawanList([]);
      setAbsensiList([]);
      setKasbonList([]);
      setTransaksiKasList([]);
      logAudit('Pembersihan Total', 'Database', 'Mengosongkan semua data mock untuk memulai data riil');
      showToast('Semua data mock telah dikosongkan. Siap input data riil!');
    } else if (clearDataModal === 'absensi') {
      setAbsensiList([]);
      logAudit('Reset Absensi', 'Presensi', 'Mengosongkan seluruh log centang absensi');
      showToast('Data absensi berhasil dikosongkan.');
    } else if (clearDataModal === 'kas') {
      setTransaksiKasList([]);
      logAudit('Reset Buku Kas', 'Keuangan', 'Mengosongkan seluruh riwayat arus kas proyek');
      showToast('Buku kas berhasil dikosongkan.');
    }
    setClearDataModal(null);
  };

  const pendingGajiCount = karyawanList.filter((k) => k.status === 'Pending').length;
  const unpaidKasbonCount = kasbonList.filter((k) => k.status === 'Belum Lunas').length;

  // Kasbon overdue check (> 30 days)
  const overdueKasbonList = useMemo(() => {
    return kasbonList.filter((k) => isKasbonOverdue(k, 30));
  }, [kasbonList]);
  const overdueKasbonCount = overdueKasbonList.length;

  const saldoKas = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    transaksiKasList.forEach((t) => {
      if (t.tipe === 'Masuk') masuk += t.nominal;
      else keluar += t.nominal;
    });
    return masuk - keluar;
  }, [transaksiKasList]);

  const isMockDataActive = useMemo(() => {
    return karyawanList.some((k) => k.nama === 'Eeng' || k.nama === 'Rohman' || k.nama === 'Abah');
  }, [karyawanList]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Simulation / Real Data Status Banner */}
      {isMockDataActive ? (
        <div className="bg-amber-500/10 border-b border-amber-300/80 px-4 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <span>
              <b>Mode Data Contoh / Simulasi Terdeteksi</b> ({karyawanList.length} pekerja placeholder: Eeng, Rohman, dll). Siap mengoperasikan data asli proyek Anda?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setClearDataModal('all')}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Kosongkan Semua & Mulai Data Real
            </button>
          </div>
        </div>
      ) : karyawanList.length === 0 ? (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
            <span>
              <b>Mode Operasional Riil (Data Real) Aktif</b> • Database bersih dan siap diisi oleh operator. 100% offline & tersimpan aman di LocalStorage perangkat Anda.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingKaryawan(null);
                setIsEmployeeModalOpen(true);
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              + Tambah Pekerja Pertama
            </button>
            <button
              onClick={handleResetDetailTo1319Sep}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md font-medium text-xs border border-slate-200 transition-colors cursor-pointer"
              title="Muat data simulasi 6 buruh 13-19 Sep jika ingin mencoba sistem"
            >
              Muat Contoh Data Simulasi
            </button>
          </div>
        </div>
      ) : null}

      {/* App Header */}
      <Header
        company={company}
        onUpdateCompany={(newCo) => {
          setCompany(newCo);
          logAudit('Ubah Pengaturan', 'Info Perusahaan', `Memperbarui nama proyek atau kontak WA (${newCo.noWaDefault})`);
        }}
        sheetsConfig={sheetsConfig}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAddModal={() => {
          setEditingKaryawan(null);
          setIsEmployeeModalOpen(true);
        }}
        onQuickSync={handlePullFromSheets}
        isSyncing={isSyncing}
      />

      {/* Main Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingGajiCount={pendingGajiCount}
        unpaidKasbonCount={unpaidKasbonCount}
        overdueKasbonCount={overdueKasbonCount}
        totalKaryawan={karyawanList.length}
        saldoKas={saldoKas}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* VIEW 1: PENGGAJIAN & SLIP */}
        {activeTab === 'penggajian' && (
          <>
            {/* Automated Overdue Kasbon Notification Banner (>30 Hari) */}
            <OverdueKasbonAlert
              overdueKasbonList={overdueKasbonList}
              karyawanList={karyawanList}
              onNavigateToKasbon={() => setActiveTab('kasbon')}
              company={company}
            />

            {/* KPI & Summary Cards */}
            <StatsCards
              karyawanList={karyawanList}
              onFilterStatus={(st) => setStatusFilter(st)}
              activeStatusFilter={statusFilter}
              overdueKasbonCount={overdueKasbonCount}
              onNavigateToKasbon={() => setActiveTab('kasbon')}
            />

            {/* Filter & Search Bar */}
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              gajiFilter={gajiFilter}
              onGajiFilterChange={setGajiFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              totalFiltered={filteredKaryawan.length}
            />

            {/* Employee Table & Mobile Cards */}
            <EmployeeTable
              karyawanList={filteredKaryawan}
              onToggleStatus={handleToggleStatus}
              onOpenWhatsApp={(k) => {
                setSelectedForWA(k);
                setIsWhatsAppModalOpen(true);
              }}
              onOpenPrintSlip={(k) => {
                setSelectedForPrint(k);
                setIsPrintModalOpen(true);
              }}
              onEdit={(k) => {
                setEditingKaryawan(k);
                setIsEmployeeModalOpen(true);
              }}
              onDelete={handleDeleteEmployee}
              onAddNew={() => {
                setEditingKaryawan(null);
                setIsEmployeeModalOpen(true);
              }}
              onSeedSample={handleResetDetailTo1319Sep}
            />

            {/* TABEL ABSENSI DETAIL DI BAWAH (Permintaan Khusus: Absensi Detail Mingguan 13-19 Sep) */}
            <AbsensiDetailSection
              karyawanList={karyawanList}
              absensiList={absensiList}
              kasbonList={kasbonList}
              onSaveAbsensi={handleSaveAbsensi}
              onSyncToPayroll={handleSyncAttendanceToPayroll}
              onAddKasbonRecord={handleAddQuickKasbon}
              onResetToDefault1319Sep={handleResetDetailTo1319Sep}
            />

            {/* Quick Floating Action Button for Mobile screens */}
            <div className="md:hidden fixed bottom-5 right-5 z-20 no-print">
              <button
                onClick={() => {
                  setEditingKaryawan(null);
                  setIsEmployeeModalOpen(true);
                }}
                className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"
                title="Tambah Karyawan"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </>
        )}

        {/* VIEW 2: ABSENSI & PRESENSI MATRIKS */}
        {activeTab === 'absensi' && (
          <AttendanceView
            karyawanList={karyawanList}
            absensiList={absensiList}
            kasbonList={kasbonList}
            onSaveAbsensi={handleSaveAbsensi}
            onSyncToPayroll={handleSyncAttendanceToPayroll}
            onAddKasbon={(karyawanId) => {
              setActiveTab('kasbon');
              showToast('Silakan input kasbon pekerja di sini.');
            }}
            onResetDetailTo1319Sep={handleResetDetailTo1319Sep}
            company={company}
          />
        )}

        {/* VIEW 3: KASBON & PINJAMAN */}
        {activeTab === 'kasbon' && (
          <KasbonView
            karyawanList={karyawanList}
            kasbonList={kasbonList}
            onSaveKasbon={handleSaveKasbon}
            onDeleteKasbon={handleDeleteKasbon}
            onApplyKasbonToPayroll={handleApplyKasbonToPayroll}
            company={company}
          />
        )}

        {/* VIEW 4: BUKU KAS (MASUK / KELUAR) */}
        {activeTab === 'keuangan' && (
          <CashflowView
            transaksiList={transaksiKasList}
            onSaveTransaksi={handleSaveTransaksiKas}
            onDeleteTransaksi={handleDeleteTransaksiKas}
            company={company}
          />
        )}

        {/* VIEW 5: LAPORAN & REKAP RESMI */}
        {activeTab === 'laporan' && (
          <ReportView
            karyawanList={karyawanList}
            kasbonList={kasbonList}
            company={company}
            transaksiList={transaksiKasList}
          />
        )}

        {/* VIEW 6: AUDIT & PENGATURAN */}
        {activeTab === 'audit' && (
          <AuditLogView
            auditLogs={auditLogList}
            company={company}
            onUpdateCompany={(newCo) => {
              setCompany(newCo);
              logAudit('Ubah Pengaturan', 'Konfigurasi Proyek', `Nama Proyek: ${newCo.namaProyek}, No WA: ${newCo.noWaDefault}`);
              showToast('Pengaturan proyek disimpan!');
            }}
            onClearAllMockData={handleClearAllMockData}
            onResetToDefault={handleResetToDefault}
            onClearAbsensiOnly={handleClearAbsensiOnly}
            onClearKasOnly={handleClearKasOnly}
            onLoadDetail1319Sep={handleResetDetailTo1319Sep}
            onLogAudit={logAudit}
            onRestoreSuccess={() => {
              const savedK = localStorage.getItem('payroll_karyawan_data');
              if (savedK) setKaryawanList(JSON.parse(savedK));
              const savedA = localStorage.getItem('payroll_absensi_data');
              if (savedA) setAbsensiList(JSON.parse(savedA));
              const savedKs = localStorage.getItem('payroll_kasbon_data');
              if (savedKs) setKasbonList(JSON.parse(savedKs));
              const savedT = localStorage.getItem('payroll_transaksi_kas_data');
              if (savedT) setTransaksiKasList(JSON.parse(savedT));
              const savedC = localStorage.getItem('payroll_company_settings');
              if (savedC) setCompany(JSON.parse(savedC));
              const savedL = localStorage.getItem('payroll_audit_log_data');
              if (savedL) setAuditLogList(JSON.parse(savedL));
              showToast('Data berhasil dipulihkan dari file JSON!');
            }}
          />
        )}

      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <b>PayrollDB Pro</b> • Sistem Penggajian & Slip WhatsApp Gratis Tanpa Biaya Server
          </span>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>100% Offline-First (LocalStorage)</span>
            <span>•</span>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Sinkronisasi Google Sheets
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingKaryawan(null);
        }}
        onSave={handleSaveEmployee}
        initialData={editingKaryawan}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setSelectedForWA(null);
        }}
        karyawan={selectedForWA}
        company={company}
      />

      <SlipPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedForPrint(null);
        }}
        karyawan={selectedForPrint}
        company={company}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={(cfg) => {
          setSheetsConfig(cfg);
          showToast('Pengaturan Google Sheets disimpan!');
        }}
        onPullFromSheets={handlePullFromSheets}
        onPushToSheets={handlePushToSheets}
        isSyncing={isSyncing}
        karyawanCount={karyawanList.length}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        karyawanList={karyawanList}
        onImportData={(data) => {
          setKaryawanList(data);
          showToast(`Berhasil memuat ${data.length} data karyawan!`);
        }}
        onResetToDefault={handleResetToDefault}
      />

      {/* In-App Confirmation Modal: Delete Employee (Works 100% in iFrames) */}
      <ConfirmModal
        isOpen={!!deleteEmployeeTarget}
        title="Hapus Data Karyawan"
        message={
          deleteEmployeeTarget ? (
            <div>
              Apakah Anda yakin ingin menghapus data pekerja/karyawan <b className="text-slate-900 font-bold font-mono">"{deleteEmployeeTarget.nama}"</b>?
              <br />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Tindakan ini akan menghapus data pekerja dari daftar aktif.
              </span>
            </div>
          ) : ''
        }
        confirmText="Ya, Hapus Karyawan"
        cancelText="Batal"
        variant="danger"
        onConfirm={executeDeleteEmployee}
        onCancel={() => setDeleteEmployeeTarget(null)}
      />

      {/* In-App Confirmation Modal: Data Cleaning (Works 100% in iFrames) */}
      <ConfirmModal
        isOpen={!!clearDataModal}
        title={
          clearDataModal === 'all'
            ? 'Kosongkan Seluruh Data Mock?'
            : clearDataModal === 'absensi'
            ? 'Bersihkan Data Absensi?'
            : 'Bersihkan Riwayat Buku Kas?'
        }
        message={
          clearDataModal === 'all' ? (
            <div>
              Anda akan mengosongkan <b>seluruh data pekerja, rekaman presensi, kasbon, dan buku kas</b> agar dapat memulai pengisian data nyata dari nol.
              <br />
              <span className="text-rose-600 font-bold block mt-1.5">
                Pastikan Anda telah mengunduh cadangan (Download Cadangan Data) jika masih memerlukan arsip sebelumnya.
              </span>
            </div>
          ) : clearDataModal === 'absensi' ? (
            <div>
              Semua centang absensi dan lembur akan direset kosong dari nol.
            </div>
          ) : (
            <div>
              Seluruh catatan transaksi buku kas masuk dan keluar proyek akan dikosongkan.
            </div>
          )
        }
        confirmText={clearDataModal === 'all' ? 'Ya, Kosongkan Semua' : 'Ya, Bersihkan'}
        cancelText="Batal"
        variant="danger"
        onConfirm={executeClearData}
        onCancel={() => setClearDataModal(null)}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200 no-print">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
