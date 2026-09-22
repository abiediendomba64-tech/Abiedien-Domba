import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck2, 
  Check, 
  RefreshCw, 
  Plus, 
  DollarSign, 
  Calendar, 
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { Karyawan, AbsensiRecord, KasbonRecord, StatusKehadiran } from '../types';
import { formatRupiah } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface AbsensiDetailSectionProps {
  karyawanList: Karyawan[];
  absensiList: AbsensiRecord[];
  kasbonList: KasbonRecord[];
  onSaveAbsensi: (records: AbsensiRecord[]) => void;
  onSyncToPayroll: (changes: { id: number | string; hari_kerja: number; lembur_bonus: number }[]) => void;
  onAddKasbonRecord?: (karyawanId: number | string, jumlah: number, keterangan: string) => void;
  onResetToDefault1319Sep: () => void;
}

interface DateCol {
  dateStr: string;
  dayName: string; // Min, Sen, Sel, Rab, Kam, Jum, Sab
  dateLabel: string; // 13 Sep, 14 Sep, ...
  fullLabel: string;
}

const DEFAULT_DAYS: DateCol[] = [
  { dateStr: '2026-09-13', dayName: 'Min', dateLabel: '13 Sep', fullLabel: 'Minggu, 13 Sep' },
  { dateStr: '2026-09-14', dayName: 'Sen', dateLabel: '14 Sep', fullLabel: 'Senin, 14 Sep' },
  { dateStr: '2026-09-15', dayName: 'Sel', dateLabel: '15 Sep', fullLabel: 'Selasa, 15 Sep' },
  { dateStr: '2026-09-16', dayName: 'Rab', dateLabel: '16 Sep', fullLabel: 'Rabu, 16 Sep' },
  { dateStr: '2026-09-17', dayName: 'Kam', dateLabel: '17 Sep', fullLabel: 'Kamis, 17 Sep' },
  { dateStr: '2026-09-18', dayName: 'Jum', dateLabel: '18 Sep', fullLabel: 'Jumat, 18 Sep' },
  { dateStr: '2026-09-19', dayName: 'Sab', dateLabel: '19 Sep', fullLabel: 'Sabtu, 19 Sep' },
];

export const AbsensiDetailSection: React.FC<AbsensiDetailSectionProps> = ({
  karyawanList,
  absensiList,
  kasbonList,
  onSaveAbsensi,
  onSyncToPayroll,
  onAddKasbonRecord,
  onResetToDefault1319Sep
}) => {
  // Quick Kasbon Modal state
  const [quickKasbonTarget, setQuickKasbonTarget] = useState<Karyawan | null>(null);
  const [quickKasbonAmount, setQuickKasbonAmount] = useState<string>('');
  const [quickKasbonKet, setQuickKasbonKet] = useState<string>('Kasbon mingguan');
  const [quickKasbonNotice, setQuickKasbonNotice] = useState<string | null>(null);

  // Sync confirmation modal
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Quick lookup map: `${karyawan_id}_${tanggal}` -> AbsensiRecord
  const absensiMap = useMemo(() => {
    const map = new Map<string, AbsensiRecord>();
    absensiList.forEach((rec) => {
      map.set(`${rec.karyawan_id}_${rec.tanggal}`, rec);
    });
    return map;
  }, [absensiList]);

  // Quick lookup map: karyawan_id -> total active kasbon
  const kasbonMap = useMemo(() => {
    const map = new Map<number | string, number>();
    kasbonList.forEach((k) => {
      if (k.status === 'Belum Lunas') {
        const cur = map.get(k.karyawan_id) || 0;
        map.set(k.karyawan_id, cur + (k.nominal || 0));
      }
    });
    return map;
  }, [kasbonList]);

  // Compute row-level calculation for each worker
  const tableRows = useMemo(() => {
    return karyawanList.map((k, index) => {
      let totalDays = 0;
      const dayValues: Record<string, { display: string; status: StatusKehadiran | undefined; weight: number }> = {};

      DEFAULT_DAYS.forEach((d) => {
        const key = `${k.id}_${d.dateStr}`;
        const record = absensiMap.get(key);
        const status = record?.status;

        if (status === 'Hadir') {
          dayValues[d.dateStr] = { display: '1', status, weight: 1.0 };
          totalDays += 1.0;
        } else if (status === 'Setengah Hari') {
          dayValues[d.dateStr] = { display: '½', status, weight: 0.5 };
          totalDays += 0.5;
        } else {
          dayValues[d.dateStr] = { display: '-', status: status || 'Alpa', weight: 0 };
        }
      });

      const isNonHarian = k.jenis_gaji === 'Per Tanggal' || k.jenis_gaji === 'Bulanan' || k.jenis_gaji === 'Dana Talang';
      const tarifHari = Number(k.gaji_per_hari) || 0;
      const gajiPokok = Number(k.gaji_pokok) || 0;
      const upahKotor = isNonHarian 
        ? (Number(k.total_gaji) || tarifHari || gajiPokok) 
        : (totalDays * tarifHari) + gajiPokok;
      const kasbonPotongan = kasbonMap.get(k.id) || 0;
      const upahBersih = Math.max(0, upahKotor - kasbonPotongan);

      return {
        index: index + 1,
        karyawan: k,
        isNonHarian,
        tarifHari,
        dayValues,
        totalDays,
        upahKotor,
        kasbonPotongan,
        upahBersih
      };
    });
  }, [karyawanList, absensiMap, kasbonMap]);

  // Summary statistics across all workers
  const grandSummary = useMemo(() => {
    const dayCounts: Record<string, number> = {};
    DEFAULT_DAYS.forEach((d) => {
      let count = 0;
      tableRows.forEach((r) => {
        const val = r.dayValues[d.dateStr];
        if (val && val.weight > 0) {
          count++;
        }
      });
      dayCounts[d.dateStr] = count;
    });

    const totalHariAll = tableRows.reduce((acc, r) => acc + r.totalDays, 0);
    const totalUpahKotorAll = tableRows.reduce((acc, r) => acc + r.upahKotor, 0);
    const totalKasbonAll = tableRows.reduce((acc, r) => acc + r.kasbonPotongan, 0);
    const totalUpahBersihAll = tableRows.reduce((acc, r) => acc + r.upahBersih, 0);

    return {
      dayCounts,
      totalHariAll,
      totalUpahKotorAll,
      totalKasbonAll,
      totalUpahBersihAll
    };
  }, [tableRows]);

  // Cell toggle handler: '-' -> '1' -> '½' -> '-'
  const handleToggleCell = (karyawanId: number | string, dateStr: string) => {
    const key = `${karyawanId}_${dateStr}`;
    const existing = absensiMap.get(key);
    let nextStatus: StatusKehadiran = 'Hadir';

    if (!existing || existing.status === 'Alpa') {
      nextStatus = 'Hadir';
    } else if (existing.status === 'Hadir') {
      nextStatus = 'Setengah Hari';
    } else {
      nextStatus = 'Alpa';
    }

    const updated: AbsensiRecord = {
      id: existing ? existing.id : `abs-${karyawanId}-${dateStr}`,
      karyawan_id: karyawanId,
      tanggal: dateStr,
      status: nextStatus,
      jam_lembur: existing?.jam_lembur || 0,
      catatan: existing?.catatan || ''
    };

    onSaveAbsensi([updated]);
  };

  // "All 1" toggle for an entire column/date
  const handleColumnAllOne = (dateStr: string) => {
    // If all workers already have '1' (Hadir), toggle all to '-' (Alpa). Otherwise, set all to '1'.
    const allAreOne = karyawanList.every((k) => {
      const rec = absensiMap.get(`${k.id}_${dateStr}`);
      return rec?.status === 'Hadir';
    });

    const targetStatus: StatusKehadiran = allAreOne ? 'Alpa' : 'Hadir';

    const updates: AbsensiRecord[] = karyawanList.map((k) => {
      const existing = absensiMap.get(`${k.id}_${dateStr}`);
      return {
        id: existing ? existing.id : `abs-${k.id}-${dateStr}`,
        karyawan_id: k.id,
        tanggal: dateStr,
        status: targetStatus,
        jam_lembur: existing?.jam_lembur || 0,
        catatan: existing?.catatan || ''
      };
    });

    onSaveAbsensi(updates);
  };

  // Sync to Payroll handler
  const executeSyncToPayroll = () => {
    // Only synchronize daily workers' days so fixed scheduled workers (Dafid, Ompong, Bayu) are protected
    const changes = tableRows
      .filter((r) => r.karyawan.jenis_gaji === 'Harian')
      .map((r) => ({
        id: r.karyawan.id,
        hari_kerja: r.totalDays,
        lembur_bonus: Number(r.karyawan.lembur_bonus) || 0
      }));
    onSyncToPayroll(changes);
    setShowSyncConfirm(false);
  };

  // Quick submit kasbon
  const handleSaveQuickKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickKasbonTarget || !onAddKasbonRecord) return;
    const amountNum = parseFloat(quickKasbonAmount.replace(/[^0-9]/g, '')) || 0;
    if (amountNum <= 0) return;

    onAddKasbonRecord(quickKasbonTarget.id, amountNum, quickKasbonKet || 'Kasbon mingguan');
    setQuickKasbonNotice(`Kasbon ${formatRupiah(amountNum)} untuk ${quickKasbonTarget.nama} berhasil dicatat!`);
    setTimeout(() => {
      setQuickKasbonTarget(null);
      setQuickKasbonAmount('');
      setQuickKasbonNotice(null);
    }, 1000);
  };

  return (
    <div id="section-absensi-detail" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mt-6 mb-8 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CalendarCheck2 className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Absensi Detail Mingguan
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              13 Sep - 19 Sep
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik angka pada kolom tanggal untuk mengubah kehadiran (<b>1</b> = Hadir, <b>½</b> = Setengah Hari, <b>-</b> = Libur). Klik <b>All 1</b> untuk mengisi massal per hari.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSyncConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Perbarui data hari kerja di tabel utama dengan total absensi ini"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan ke Payroll</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Kembalikan centang kehadiran ke contoh awal (Eeng & Rohman 6 hari, lainnya 0 hari)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset ke 13-19 Sep</span>
          </button>
        </div>
      </div>

      {/* Main Absensi Detail Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 select-none">
              <th className="py-3 px-3 w-10 text-center font-bold text-slate-500">
                No
              </th>
              <th className="py-3 px-3.5 min-w-[140px] font-bold text-slate-900">
                Nama Buruh
              </th>
              <th className="py-3 px-3 min-w-[110px] text-right font-bold text-slate-800">
                Tarif/Hari
              </th>

              {/* 7 Day Columns with "All 1" button */}
              {DEFAULT_DAYS.map((d) => (
                <th key={d.dateStr} className="py-2.5 px-2 text-center min-w-[70px] border-l border-slate-200/80">
                  <div className="font-bold text-slate-900 leading-tight">
                    {d.dayName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    {d.dateLabel}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleColumnAllOne(d.dateStr)}
                    className="mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 rounded border border-emerald-300 transition-colors shadow-2xs cursor-pointer block mx-auto whitespace-nowrap"
                    title={`Tandai SEMUA buruh hadir (1) pada ${d.fullLabel}`}
                  >
                    All 1
                  </button>
                </th>
              ))}

              <th className="py-3 px-3 text-center min-w-[85px] font-bold text-emerald-800 bg-emerald-50/60 border-l border-slate-200">
                Total Hari
              </th>
              <th className="py-3 px-3.5 text-right min-w-[110px] font-bold text-slate-900 border-l border-slate-200">
                Upah Kotor
              </th>
              <th className="py-3 px-3.5 text-center min-w-[115px] font-bold text-slate-800 border-l border-slate-200">
                Kasbon / Potongan
              </th>
              <th className="py-3 px-3.5 text-right min-w-[115px] font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-200">
                Upah Bersih
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-10 px-4 text-center bg-slate-50/50 text-slate-500">
                  <div className="max-w-md mx-auto space-y-1.5">
                    <p className="font-bold text-slate-800 text-sm">Belum Ada Data Pekerja</p>
                    <p className="text-xs text-slate-500">
                      Silakan tambahkan data pekerja melalui tombol <b>+ Tambah Karyawan</b> di atas untuk mulai mencatat absensi harian dan perhitungan upah kotor/bersih.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              tableRows.map((row) => (
              <tr key={row.karyawan.id} className="hover:bg-slate-50/80 transition-colors">
                {/* No */}
                <td className="py-3 px-3 text-center text-slate-400 font-bold">
                  {row.index}
                </td>

                {/* Nama Buruh */}
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                    <span>{row.karyawan.nama}</span>
                    {row.karyawan.jenis_gaji === 'Per Tanggal' && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md font-bold border border-amber-200">
                        Per Tgl
                      </span>
                    )}
                    {row.karyawan.jenis_gaji === 'Dana Talang' && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md font-bold border border-emerald-300">
                        Dana Talang
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {row.karyawan.pekerjaan || 'Buruh Lapangan'}
                  </div>
                </td>

                {/* Tarif/Hari */}
                <td className="py-3 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                  <div>{formatRupiah(row.tarifHari)}</div>
                  {row.isNonHarian && (
                    <span className="text-[10px] text-slate-400 font-normal block">
                      {row.karyawan.jenis_gaji}
                    </span>
                  )}
                </td>

                {/* 7 Day Values */}
                {DEFAULT_DAYS.map((d) => {
                  const val = row.dayValues[d.dateStr];
                  const isOne = val.display === '1';
                  const isHalf = val.display === '½';
                  return (
                    <td 
                      key={d.dateStr} 
                      className="py-2 px-1.5 text-center border-l border-slate-100"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleCell(row.karyawan.id, d.dateStr)}
                        className={`w-9 h-8 rounded-lg font-bold text-xs inline-flex items-center justify-center transition-all cursor-pointer ${
                          isOne 
                            ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 scale-100'
                            : isHalf
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            : 'bg-slate-100/70 text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                        }`}
                        title={`${row.karyawan.nama} - ${d.fullLabel}: ${
                          isOne ? 'Hadir (1 hari)' : isHalf ? 'Setengah Hari (0.5 hari)' : 'Tidak Hadir / Libur (0)'
                        }. Klik untuk mengubah.`}
                      >
                        {val.display}
                      </button>
                    </td>
                  );
                })}

                {/* Total Hari */}
                <td className="py-3 px-3 text-center font-bold border-l border-slate-100 whitespace-nowrap text-xs">
                  {row.isNonHarian ? (
                    <div>
                      <span className="text-slate-600">{row.totalDays} hari</span>
                      <span className="block text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mt-0.5">
                        Non-Harian
                      </span>
                    </div>
                  ) : (
                    <span className="text-emerald-800 bg-emerald-50/60 px-2 py-1 rounded-md">
                      {row.totalDays} hari
                    </span>
                  )}
                </td>

                {/* Upah Kotor */}
                <td className="py-3 px-3.5 text-right font-bold text-slate-800 border-l border-slate-100 whitespace-nowrap">
                  {formatRupiah(row.upahKotor)}
                </td>

                {/* Kasbon / Potongan */}
                <td className="py-2.5 px-3 text-center border-l border-slate-100">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xs font-semibold ${row.kasbonPotongan > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                      {formatRupiah(row.kasbonPotongan)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickKasbonTarget(row.karyawan);
                        setQuickKasbonAmount('');
                        setQuickKasbonNotice(null);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      title={`Tambah catatan kasbon untuk ${row.karyawan.nama}`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Kasbon</span>
                    </button>
                  </div>
                </td>

                {/* Upah Bersih */}
                <td className="py-3 px-3.5 text-right font-bold text-emerald-700 bg-emerald-50/20 border-l border-slate-100 whitespace-nowrap text-sm">
                  {formatRupiah(row.upahBersih)}
                </td>
              </tr>
            )))}
          </tbody>

          {/* TOTAL KESELURUHAN ROW */}
          <tfoot>
            <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colSpan={3} className="py-3 px-3.5 text-left text-xs uppercase tracking-wider font-extrabold text-slate-800">
                TOTAL KESELURUHAN:
              </td>

              {/* Day Counts: "0 org", "2 org", etc. */}
              {DEFAULT_DAYS.map((d) => (
                <td key={d.dateStr} className="py-3 px-2 text-center text-xs font-bold text-slate-800 border-l border-slate-200 whitespace-nowrap">
                  {grandSummary.dayCounts[d.dateStr]} org
                </td>
              ))}

              {/* Total Hari Keseluruhan */}
              <td className="py-3 px-3 text-center font-extrabold text-emerald-800 bg-emerald-100/70 border-l border-slate-200 text-xs whitespace-nowrap">
                {grandSummary.totalHariAll} hari
              </td>

              {/* Total Upah Kotor */}
              <td className="py-3 px-3.5 text-right font-extrabold text-slate-900 border-l border-slate-200 text-xs whitespace-nowrap">
                {formatRupiah(grandSummary.totalUpahKotorAll)}
              </td>

              {/* Total Kasbon */}
              <td className="py-3 px-3 text-center font-bold text-rose-700 border-l border-slate-200 text-xs whitespace-nowrap">
                {formatRupiah(grandSummary.totalKasbonAll)}
              </td>

              {/* Total Upah Bersih */}
              <td className="py-3 px-3.5 text-right font-extrabold text-emerald-800 bg-emerald-100/80 border-l border-slate-200 text-xs sm:text-sm whitespace-nowrap">
                {formatRupiah(grandSummary.totalUpahBersihAll)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Helpful Hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Setiap perubahan hari di atas dapat disinkronkan langsung ke tabel penggajian dan slip gaji.</span>
        </div>
        <div className="text-slate-400 font-medium">
          Total Rekap: <span className="text-emerald-700 font-bold">{grandSummary.totalHariAll} hari</span> | Bersih: <span className="text-emerald-700 font-bold">{formatRupiah(grandSummary.totalUpahBersihAll)}</span>
        </div>
      </div>

      {/* Sync Confirmation Modal */}
      <ConfirmModal
        isOpen={showSyncConfirm}
        title="Sinkronkan ke Tabel Penggajian?"
        message={
          <div>
            Apakah Anda ingin menyinkronkan akumulasi hari kerja (<b className="text-slate-900">{grandSummary.totalHariAll} hari total</b>) untuk <b>{karyawanList.length} karyawan</b> ke dalam tabel penggajian utama?
            <br />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Nilai hari kerja dan total gaji pada daftar pekerja akan diperbarui secara otomatis.
            </span>
          </div>
        }
        confirmText="Ya, Sinkronkan"
        cancelText="Batal"
        variant="primary"
        onConfirm={executeSyncToPayroll}
        onCancel={() => setShowSyncConfirm(false)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Absensi ke Contoh 13-19 Sep?"
        message={
          <div>
            Kembalikan matriks absensi ke status awal: <b>Eeng & Rohman (6 hari kerja)</b>, dan buruh lainnya <b>(0 hari kerja)</b>?
          </div>
        }
        confirmText="Ya, Reset Matriks"
        cancelText="Batal"
        variant="warning"
        onConfirm={() => {
          onResetToDefault1319Sep();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Quick Add Kasbon Dialog */}
      {quickKasbonTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  + Kasbon: {quickKasbonTarget.nama}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {quickKasbonTarget.pekerjaan} • Tarif: {formatRupiah(quickKasbonTarget.gaji_per_hari)}/hari
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickKasbonTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickKasbonNotice && (
              <div className="mt-3 p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{quickKasbonNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickKasbon} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Kasbon / Pinjaman (Rp) *
                </label>
                <input
                  type="number"
                  step="5000"
                  min="5000"
                  placeholder="Contoh: 100000"
                  value={quickKasbonAmount}
                  onChange={(e) => setQuickKasbonAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pinjaman belanja makan / transport"
                  value={quickKasbonKet}
                  onChange={(e) => setQuickKasbonKet(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickKasbonTarget(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
