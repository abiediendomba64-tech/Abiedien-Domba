import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  RotateCcw,
  CheckCheck,
  CalendarDays,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Grid3X3,
  ListFilter,
  Check,
  X,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { Karyawan, AbsensiRecord, KasbonRecord, StatusKehadiran, CompanySettings } from '../types';
import { formatTanggal, formatRupiah } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface AttendanceViewProps {
  karyawanList: Karyawan[];
  absensiList: AbsensiRecord[];
  kasbonList?: KasbonRecord[];
  onSaveAbsensi: (records: AbsensiRecord[]) => void;
  onSyncToPayroll: (updatedEmployees: { id: number | string; hari_kerja: number; lembur_bonus: number }[]) => void;
  onAddKasbon?: (karyawanId: number | string) => void;
  onResetDetailTo1319Sep?: () => void;
  company: CompanySettings;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  karyawanList,
  absensiList,
  kasbonList = [],
  onSaveAbsensi,
  onSyncToPayroll,
  onAddKasbon,
  onResetDetailTo1319Sep,
  company
}) => {
  const todayStr = '2026-09-19'; // default context aligned with 13-19 Sep period
  const [activeSubTab, setActiveSubTab] = useState<'matriks' | 'harian' | 'rekap'>('matriks');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Period Date Range for the Matrix Checklist (default: 13 Sep - 19 Sep 2026)
  const [rangeStart, setRangeStart] = useState<string>(company.periodeStartDate || '2026-09-13');
  const [rangeEnd, setRangeEnd] = useState<string>(company.periodeEndDate || '2026-09-19');

  const tarifLembur = company.tarifLemburPerJam || 20000;

  // Generate array of date objects between rangeStart and rangeEnd
  const dateColumns = useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNum: string; dayNumMonth: string; isToday: boolean }[] = [];
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Safety guard max 31 days to prevent UI overload
    let current = new Date(start);
    let count = 0;
    while (current <= end && count < 31) {
      const dateStr = current.toISOString().split('T')[0];
      const dayName = dayNames[current.getDay()];
      const dayNum = String(current.getDate()).padStart(2, '0');
      const dayNumMonth = `${current.getDate()} ${monthNames[current.getMonth()]}`;
      list.push({
        dateStr,
        dayName,
        dayNum,
        dayNumMonth,
        isToday: dateStr === todayStr
      });
      current.setDate(current.getDate() + 1);
      count++;
    }
    return list;
  }, [rangeStart, rangeEnd, todayStr]);

  // Lookup map for fast access: `${karyawan_id}_${tanggal}` => AbsensiRecord
  const absensiMap = useMemo(() => {
    const map = new Map<string, AbsensiRecord>();
    absensiList.forEach((item) => {
      map.set(`${item.karyawan_id}_${item.tanggal}`, item);
    });
    return map;
  }, [absensiList]);

  // Matrix cell toggle handler:
  // Hadir (✓ 1.0) -> Setengah Hari (½ 0.5) -> Izin (I 0) -> Alpa/Libur (- 0) -> Hadir
  const handleToggleMatrixCell = (karyawanId: number | string, dateStr: string) => {
    const key = `${karyawanId}_${dateStr}`;
    const existing = absensiMap.get(key);
    let nextStatus: StatusKehadiran = 'Hadir';

    if (!existing || existing.status === 'Alpa') {
      nextStatus = 'Hadir';
    } else if (existing.status === 'Hadir') {
      nextStatus = 'Setengah Hari';
    } else if (existing.status === 'Setengah Hari') {
      nextStatus = 'Izin';
    } else if (existing.status === 'Izin') {
      nextStatus = 'Alpa';
    } else {
      nextStatus = 'Hadir';
    }

    const updatedRecord: AbsensiRecord = {
      id: existing ? existing.id : `abs-${karyawanId}-${dateStr}`,
      karyawan_id: karyawanId,
      tanggal: dateStr,
      status: nextStatus,
      jam_lembur: existing?.jam_lembur || 0,
      catatan: existing?.catatan || ''
    };

    onSaveAbsensi([updatedRecord]);
  };

  // Direct set status for a matrix cell
  const handleSetMatrixStatus = (karyawanId: number | string, dateStr: string, status: StatusKehadiran) => {
    const key = `${karyawanId}_${dateStr}`;
    const existing = absensiMap.get(key);
    const updatedRecord: AbsensiRecord = {
      id: existing ? existing.id : `abs-${karyawanId}-${dateStr}`,
      karyawan_id: karyawanId,
      tanggal: dateStr,
      status,
      jam_lembur: existing?.jam_lembur || 0,
      catatan: existing?.catatan || ''
    };
    onSaveAbsensi([updatedRecord]);
  };

  // Batch: Mark all workers as Hadir on a specific single date
  const handleMarkAllHadirOnDate = (dateStr: string) => {
    const updates: AbsensiRecord[] = karyawanList.map((k) => {
      const existing = absensiMap.get(`${k.id}_${dateStr}`);
      return {
        id: existing ? existing.id : `abs-${k.id}-${dateStr}`,
        karyawan_id: k.id,
        tanggal: dateStr,
        status: 'Hadir',
        jam_lembur: existing?.jam_lembur || 0,
        catatan: existing?.catatan || ''
      };
    });
    onSaveAbsensi(updates);
  };

  // Batch: Mark all workers as Hadir across ALL dates in the active period range!
  const executeMarkAllHadirWholePeriod = () => {
    const updates: AbsensiRecord[] = [];
    karyawanList.forEach((k) => {
      dateColumns.forEach((d) => {
        const existing = absensiMap.get(`${k.id}_${d.dateStr}`);
        updates.push({
          id: existing ? existing.id : `abs-${k.id}-${d.dateStr}`,
          karyawan_id: k.id,
          tanggal: d.dateStr,
          status: 'Hadir',
          jam_lembur: existing?.jam_lembur || 0,
          catatan: existing?.catatan || ''
        });
      });
    });
    onSaveAbsensi(updates);
    setConfirmModalConfig(null);
  };

  const handleMarkAllHadirWholePeriod = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Tandai Semua Hadir?',
      message: (
        <div>
          Centang SEMUA pekerja (<b className="text-slate-900 font-bold">{karyawanList.length} orang</b>) sebagai <b>HADIR</b> penuh selama periode <b className="text-emerald-700">{rangeStart} s/d {rangeEnd}</b>?
          <br />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tindakan ini akan mengisi centang kehadiran 1 untuk seluruh tanggal aktif pada periode ini.
          </span>
        </div>
      ),
      confirmText: 'Ya, Centang Semua Hadir',
      cancelText: 'Batal',
      variant: 'primary',
      onConfirm: executeMarkAllHadirWholePeriod
    });
  };

  // Reset or clear mock attendance for the period so user can start with empty clean checklist
  const executeClearPeriodAttendance = () => {
    const updates: AbsensiRecord[] = [];
    karyawanList.forEach((k) => {
      dateColumns.forEach((d) => {
        const existing = absensiMap.get(`${k.id}_${d.dateStr}`);
        updates.push({
          id: existing ? existing.id : `abs-${k.id}-${d.dateStr}`,
          karyawan_id: k.id,
          tanggal: d.dateStr,
          status: 'Alpa', // treated as uncompleted/off
          jam_lembur: 0,
          catatan: ''
        });
      });
    });
    onSaveAbsensi(updates);
    setConfirmModalConfig(null);
  };

  const handleClearPeriodAttendance = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Kosongkan Centang Absensi?',
      message: (
        <div>
          Apakah Anda yakin ingin mengosongkan centang absensi untuk periode ini (<b className="text-slate-900">{rangeStart} s/d {rangeEnd}</b>)?
          <br />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Semua status kehadiran pada periode ini akan direset sehingga Anda dapat mengisi data riil dari nol.
          </span>
        </div>
      ),
      confirmText: 'Ya, Kosongkan',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: executeClearPeriodAttendance
    });
  };

  // Overtime increment/decrement per employee in matrix
  const handleAdjustOvertime = (karyawanId: number | string, delta: number) => {
    // We adjust today's record or the latest date in period
    const targetDate = todayStr;
    const key = `${karyawanId}_${targetDate}`;
    const existing = absensiMap.get(key);
    const currentOvertime = existing?.jam_lembur || 0;
    const nextOvertime = Math.max(0, currentOvertime + delta);

    const record: AbsensiRecord = {
      id: existing ? existing.id : `abs-${karyawanId}-${targetDate}`,
      karyawan_id: karyawanId,
      tanggal: targetDate,
      status: existing?.status || 'Hadir',
      jam_lembur: nextOvertime,
      catatan: existing?.catatan || ''
    };
    onSaveAbsensi([record]);
  };

  // Calculated totals per employee across the active date range
  const matrixSummary = useMemo(() => {
    return karyawanList.map((k) => {
      let hadirCount = 0;
      let setengahCount = 0;
      let izinCount = 0;
      let sakitCount = 0;
      let alpaCount = 0;
      let totalLembur = 0;

      dateColumns.forEach((d) => {
        const rec = absensiMap.get(`${k.id}_${d.dateStr}`);
        if (!rec) {
          alpaCount++;
        } else if (rec.status === 'Hadir') {
          hadirCount++;
        } else if (rec.status === 'Setengah Hari') {
          setengahCount++;
        } else if (rec.status === 'Izin') {
          izinCount++;
        } else if (rec.status === 'Sakit') {
          sakitCount++;
        } else {
          alpaCount++;
        }
        if (rec?.jam_lembur) {
          totalLembur += Number(rec.jam_lembur);
        }
      });

      const equivalentDays = hadirCount + (setengahCount * 0.5);
      const calculatedLemburBonus = totalLembur * tarifLembur;
      
      // Calculate Upah Kotor: (Tarif/Hari * Total Hari) + Gaji Pokok + Lembur
      const gajiPokok = Number(k.gaji_pokok) || 0;
      const upahKotor = (k.gaji_per_hari * equivalentDays) + gajiPokok + calculatedLemburBonus;
      
      // Calculate Kasbon / Potongan
      const pendingKasbonNominal = kasbonList
        ?.filter((ksb) => String(ksb.karyawan_id) === String(k.id) && ksb.status === 'Belum Lunas')
        .reduce((sum, ksb) => sum + ksb.nominal, 0) || 0;
      const potonganKasbon = (k.potongan_kasbon || 0) + pendingKasbonNominal;
      
      // Calculate Upah Bersih
      const upahBersih = Math.max(0, upahKotor - potonganKasbon);

      return {
        karyawan: k,
        hadirCount,
        setengahCount,
        izinCount,
        sakitCount,
        alpaCount,
        totalLembur,
        equivalentDays,
        calculatedLemburBonus,
        upahKotor,
        potonganKasbon,
        upahBersih,
        totalEstimasiGaji: upahBersih
      };
    });
  }, [karyawanList, dateColumns, absensiMap, tarifLembur, kasbonList]);

  // Overall aggregate stats across the matrix
  const aggregateStats = useMemo(() => {
    const totalHariKerja = matrixSummary.reduce((acc, m) => acc + m.equivalentDays, 0);
    const totalJamLembur = matrixSummary.reduce((acc, m) => acc + m.totalLembur, 0);
    const totalBonusLembur = totalJamLembur * tarifLembur;
    const totalUpahKotor = matrixSummary.reduce((acc, m) => acc + m.upahKotor, 0);
    const totalPotonganKasbon = matrixSummary.reduce((acc, m) => acc + m.potonganKasbon, 0);
    const totalUpahBersih = matrixSummary.reduce((acc, m) => acc + m.upahBersih, 0);
    return { 
      totalHariKerja, 
      totalJamLembur, 
      totalBonusLembur,
      totalUpahKotor,
      totalPotonganKasbon,
      totalUpahBersih
    };
  }, [matrixSummary, tarifLembur]);

  // Sync to Payroll action
  const executeSyncAttendanceToPayroll = () => {
    const changes = matrixSummary.map((item) => ({
      id: item.karyawan.id,
      hari_kerja: item.equivalentDays,
      lembur_bonus: item.calculatedLemburBonus
    }));

    onSyncToPayroll(changes);
    setConfirmModalConfig(null);
  };

  const handleSyncAttendanceToPayroll = () => {
    const changes = matrixSummary.map((item) => ({
      id: item.karyawan.id,
      hari_kerja: item.equivalentDays,
      lembur_bonus: item.calculatedLemburBonus
    }));

    setConfirmModalConfig({
      isOpen: true,
      title: 'Sinkronkan ke Tabel Penggajian?',
      message: (
        <div>
          Sinkronkan akumulasi kehadiran periode ini ke Tabel Penggajian?
          <br />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Data hari kerja dan bonus lembur ({formatRupiah(tarifLembur)}/jam) untuk <b>{changes.length} karyawan</b> akan disesuaikan otomatis dengan rekapitulasi kehadiran matriks.
          </span>
        </div>
      ),
      confirmText: 'Ya, Sinkronkan',
      cancelText: 'Batal',
      variant: 'primary',
      onConfirm: executeSyncAttendanceToPayroll
    });
  };

  // Helper renderer for matrix cell
  const renderMatrixBadge = (status: StatusKehadiran | undefined) => {
    if (!status || status === 'Alpa') {
      return (
        <span className="w-8 h-8 rounded-lg border border-dashed border-slate-200 text-slate-400 flex items-center justify-center text-xs font-semibold hover:border-slate-400 hover:text-slate-600 transition-colors">
          -
        </span>
      );
    }
    if (status === 'Hadir') {
      return (
        <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold shadow-xs hover:bg-emerald-700 transition-transform active:scale-95">
          1
        </span>
      );
    }
    if (status === 'Setengah Hari') {
      return (
        <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold shadow-xs hover:bg-amber-600 transition-transform active:scale-95">
          ½
        </span>
      );
    }
    if (status === 'Izin') {
      return (
        <span className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-sky-600 transition-transform active:scale-95">
          I
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-purple-600 transition-transform active:scale-95">
        S
      </span>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Absensi & Presensi Centang per Tanggal
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Sistem timesheet matriks praktis: cukup klik centang per tanggal untuk tiap pekerja, otomatis akumulasi hari kerja dan lembur ke slip gaji.
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('matriks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'matriks'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Matriks Centang</span>
            </button>
            <button
              onClick={() => setActiveSubTab('harian')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'harian'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Harian Detail</span>
            </button>
            <button
              onClick={() => setActiveSubTab('rekap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'rekap'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Rekap Akumulasi</span>
            </button>
          </div>

          <button
            onClick={handleSyncAttendanceToPayroll}
            title="Update Hari Kerja & Lembur ke Penggajian"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sinkronkan ke Penggajian</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MATRIKS CENTANG PER TANGGAL (HERO FEATURE) */}
      {activeSubTab === 'matriks' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Period Range Picker & Batch Shortcuts */}
          <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Rentang Periode:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Quick Period Presets */}
              <div className="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => {
                    setRangeStart('2026-09-13');
                    setRangeEnd('2026-09-19');
                  }}
                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-[11px] font-bold"
                >
                  13 - 19 Sep (Default)
                </button>
                <button
                  onClick={() => {
                    setRangeStart('2026-09-15');
                    setRangeEnd('2026-09-21');
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-medium"
                >
                  Minggu Ini
                </button>
                <button
                  onClick={() => {
                    setRangeStart('2026-09-01');
                    setRangeEnd('2026-09-21');
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-medium"
                >
                  Bulan Ini
                </button>
              </div>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {onResetDetailTo1319Sep && (
                <button
                  onClick={onResetDetailTo1319Sep}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 rounded-lg transition-colors shadow-2xs"
                  title="Muat data contoh presensi 13-19 Sep (Eeng & Rohman 6 hari kerja)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Muat Data 13-19 Sep</span>
                </button>
              )}

              <button
                onClick={handleMarkAllHadirWholePeriod}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="Tandai semua pekerja hadir penuh di semua tanggal periode ini"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Centang Semua Hadir</span>
              </button>

              <button
                onClick={handleClearPeriodAttendance}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                title="Kosongkan data absensi untuk mengisi dari awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bersihkan Centang</span>
              </button>
            </div>
          </div>

          {/* Quick Legend & Statistics */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-500 text-[11px]">Keterangan Centang:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span className="text-slate-600 text-[11px]">Hadir (1 hari)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ½
                </span>
                <span className="text-slate-600 text-[11px]">Setengah (0.5)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                  I
                </span>
                <span className="text-slate-600 text-[11px]">Izin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md border border-dashed border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                  -
                </span>
                <span className="text-slate-600 text-[11px]">Libur/Alpa</span>
              </div>
              <span className="text-[11px] text-slate-400 italic">
                *Klik kotak pada tanggal untuk ubah status presensi secara instan.
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 rounded-lg">
              <span>Total Hari: <strong className="text-emerald-700">{aggregateStats.totalHariKerja} Hari</strong></span>
              <span>•</span>
              <span>Total Upah Kotor: <strong className="text-emerald-800">{formatRupiah(aggregateStats.totalUpahKotor)}</strong></span>
              <span>•</span>
              <span>Upah Bersih: <strong className="text-emerald-800">{formatRupiah(aggregateStats.totalUpahBersih)}</strong></span>
            </div>
          </div>

          {/* Matrix Table: ABSENSI DETAIL DENGAN UPAH KOTOR, KASBON & UPAH BERSIH */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs">
                    <th className="py-3 px-3 w-10 text-center font-bold sticky left-0 bg-slate-50 z-10">No</th>
                    <th className="py-3 px-4 font-bold sticky left-10 bg-slate-50 z-10 min-w-[160px]">Nama Buruh</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 text-right min-w-[110px]">Tarif/Hari</th>

                    {/* Dynamic Date Columns with 'All 1' Button */}
                    {dateColumns.map((col) => (
                      <th 
                        key={col.dateStr} 
                        className={`py-2 px-2 text-center border-l border-slate-200 min-w-[65px] ${
                          col.isToday ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'font-medium'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{col.dayName}</span>
                          <span className={`text-[11px] font-extrabold leading-tight mt-0.5 ${col.isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {col.dayNumMonth}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarkAllHadirOnDate(col.dateStr)}
                            className="mt-1 px-1.5 py-0.5 text-[9px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-bold rounded transition-colors shadow-2xs"
                            title={`Centang semua pekerja (1) pada ${col.dayNumMonth}`}
                          >
                            All 1
                          </button>
                        </div>
                      </th>
                    ))}

                    <th className="py-3 px-3 text-center font-bold text-emerald-900 bg-emerald-50/50 border-l border-slate-200 min-w-[85px]">
                      Total Hari
                    </th>
                    <th className="py-3 px-3 text-right font-bold text-slate-800 border-l border-slate-200 min-w-[115px]">
                      Upah Kotor
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-slate-800 border-l border-slate-200 min-w-[125px]">
                      Kasbon / Potongan
                    </th>
                    <th className="py-3 px-3 text-right font-extrabold text-emerald-900 bg-emerald-50/40 border-l border-slate-200 min-w-[120px]">
                      Upah Bersih
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {matrixSummary.map((item, idx) => {
                    const k = item.karyawan;
                    return (
                      <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-400 sticky left-0 bg-white hover:bg-slate-50/80 z-10">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 sticky left-10 bg-white hover:bg-slate-50/80 z-10">
                          <div className="font-bold text-slate-900 text-xs">{k.nama}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{k.pekerjaan}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-700 font-semibold text-xs">
                          {formatRupiah(k.gaji_per_hari)}
                        </td>

                        {/* Cells for each date */}
                        {dateColumns.map((col) => {
                          const record = absensiMap.get(`${k.id}_${col.dateStr}`);
                          return (
                            <td 
                              key={col.dateStr} 
                              className={`py-2 px-1 text-center border-l border-slate-100 ${
                                col.isToday ? 'bg-emerald-50/30' : ''
                              }`}
                            >
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMatrixCell(k.id, col.dateStr)}
                                  className="focus:outline-hidden transform active:scale-90 transition-transform"
                                  title={`${k.nama} - ${col.dayNumMonth} (Status: ${record?.status || '-'}) - Klik untuk ganti`}
                                >
                                  {renderMatrixBadge(record?.status)}
                                </button>
                              </div>
                            </td>
                          );
                        })}

                        {/* Calculated Total Hari */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-800 bg-slate-50/30 border-l border-slate-200 text-xs">
                          {item.equivalentDays} hari
                        </td>

                        {/* Upah Kotor */}
                        <td className="py-3.5 px-3 text-right font-bold text-slate-800 border-l border-slate-200 text-xs">
                          {formatRupiah(item.upahKotor)}
                        </td>

                        {/* Kasbon / Potongan */}
                        <td className="py-3 px-3 text-center border-l border-slate-200">
                          <button
                            type="button"
                            onClick={() => onAddKasbon && onAddKasbon(k.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors shadow-2xs"
                            title={`Tambah Kasbon untuk ${k.nama}`}
                          >
                            + Kasbon
                          </button>
                          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                            {item.potonganKasbon > 0 ? formatRupiah(item.potonganKasbon) : 'Rp 0'}
                          </div>
                        </td>

                        {/* Upah Bersih */}
                        <td className="py-3.5 px-3 text-right font-extrabold text-emerald-700 bg-emerald-50/30 border-l border-slate-200 text-xs">
                          {formatRupiah(item.upahBersih)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* TOTAL KESELURUHAN FOOTER */}
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900 text-xs">
                    <td colSpan={3} className="py-3.5 px-4 sticky left-0 bg-slate-100 z-10 tracking-wide font-extrabold text-slate-900">
                      TOTAL KESELURUHAN:
                    </td>

                    {/* Total Hadir Per Kolom Tanggal */}
                    {dateColumns.map((col) => {
                      const countHadir = karyawanList.filter((k) => {
                        const rec = absensiMap.get(`${k.id}_${col.dateStr}`);
                        return rec && (rec.status === 'Hadir' || rec.status === 'Setengah Hari');
                      }).length;
                      return (
                        <td key={col.dateStr} className="py-3 px-2 text-center border-l border-slate-200 text-slate-900 font-bold whitespace-nowrap">
                          {countHadir} org
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3 text-center text-emerald-900 border-l border-slate-200 font-extrabold whitespace-nowrap">
                      {aggregateStats.totalHariKerja} hari
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-900 border-l border-slate-200 font-extrabold whitespace-nowrap">
                      {formatRupiah(aggregateStats.totalUpahKotor)}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-800 border-l border-slate-200 font-extrabold whitespace-nowrap">
                      {formatRupiah(aggregateStats.totalPotonganKasbon)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-900 bg-emerald-100/50 border-l border-slate-200 font-extrabold whitespace-nowrap">
                      {formatRupiah(aggregateStats.totalUpahBersih)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Sync Banner */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                Setelah selesai mencentang absensi, klik tombol <b>Sinkronkan ke Penggajian</b> untuk otomatis memperbarui slip gaji!
              </span>
              <button
                onClick={handleSyncAttendanceToPayroll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sinkronkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PRESENSI HARIAN DETAIL */}
      {activeSubTab === 'harian' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => handleMarkAllHadirOnDate(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
            >
              <CheckCheck className="w-4 h-4" />
              Tandai Semua Hadir Hari Ini
            </button>
          </div>

          {/* Daily Table with notes */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {karyawanList.map((k) => {
                const rec = absensiMap.get(`${k.id}_${selectedDate}`);
                const currentStatus: StatusKehadiran = rec?.status || 'Hadir';
                const currentLembur = rec?.jam_lembur || 0;
                const currentCatatan = rec?.catatan || '';

                const updateSingle = (patch: Partial<AbsensiRecord>) => {
                  const updated: AbsensiRecord = {
                    id: rec?.id || `abs-${k.id}-${selectedDate}`,
                    karyawan_id: k.id,
                    tanggal: selectedDate,
                    status: currentStatus,
                    jam_lembur: currentLembur,
                    catatan: currentCatatan,
                    ...patch
                  };
                  onSaveAbsensi([updated]);
                };

                return (
                  <div key={k.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                    <div className="min-w-[180px]">
                      <div className="font-bold text-slate-900 text-sm">{k.nama}</div>
                      <div className="text-xs text-slate-500">{k.pekerjaan} • {formatRupiah(k.gaji_per_hari)}/hari</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['Hadir', 'Setengah Hari', 'Izin', 'Sakit', 'Alpa'] as StatusKehadiran[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateSingle({ status: st })}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            currentStatus === st
                              ? st === 'Hadir'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : st === 'Setengah Hari'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : st === 'Izin' || st === 'Sakit'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {st === 'Hadir' ? 'Hadir (1.0)' : st === 'Setengah Hari' ? '1/2 Hari (0.5)' : st}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-900">Lembur:</span>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={currentLembur}
                          onChange={(e) => updateSingle({ jam_lembur: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-12 text-center text-xs font-bold bg-white border border-purple-300 rounded px-1 py-0.5"
                        />
                        <span className="text-[11px] text-purple-700">Jam</span>
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan harian..."
                        value={currentCatatan}
                        onChange={(e) => updateSingle({ catatan: e.target.value })}
                        className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700 w-36 sm:w-44 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: REKAP AKUMULASI PERIODE */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rekapitulasi Kehadiran & Lembur Periode</h3>
                <p className="text-xs text-slate-500">Rentang: {rangeStart} s/d {rangeEnd} • Standar Lembur: {formatRupiah(tarifLembur)}/jam</p>
              </div>

              <button
                onClick={handleSyncAttendanceToPayroll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Perbarui Data ke Slip Penggajian</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-4 font-bold">Nama Karyawan</th>
                    <th className="py-3 px-3 text-center">Hadir (1.0)</th>
                    <th className="py-3 px-3 text-center">1/2 Hari (0.5)</th>
                    <th className="py-3 px-3 text-center">Izin / Sakit</th>
                    <th className="py-3 px-3 text-center">Alpa</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-800 bg-emerald-50/50">Hari Kerja Efektif</th>
                    <th className="py-3 px-3 text-center font-bold text-purple-800">Total Lembur</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Bonus Lembur</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Est. Total Gaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixSummary.map((item, idx) => (
                    <tr key={item.karyawan.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.karyawan.nama}
                        <div className="text-[11px] text-slate-400 font-normal">{item.karyawan.pekerjaan}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-semibold">{item.hadirCount}</td>
                      <td className="py-3 px-3 text-center text-amber-600 font-semibold">{item.setengahCount}</td>
                      <td className="py-3 px-3 text-center text-sky-600">{item.izinCount + item.sakitCount}</td>
                      <td className="py-3 px-3 text-center text-rose-600">{item.alpaCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30 text-sm">
                        {item.equivalentDays} hari
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-purple-700">
                        {item.totalLembur} jam
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-purple-700">
                        {formatRupiah(item.calculatedLemburBonus)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                        {formatRupiah(item.totalEstimasiGaji)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText || 'Batal'}
          variant={confirmModalConfig.variant || 'primary'}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}

    </div>
  );
};
