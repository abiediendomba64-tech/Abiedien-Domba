import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BarChart3, 
  Calendar,
  Sparkles,
  Layers
} from 'lucide-react';
import { TransaksiKas } from '../types';
import { formatRupiah, formatRupiahShort } from '../utils/formatters';

interface CashflowMonthlyChartProps {
  transaksiList: TransaksiKas[];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface MonthlyDataPoint {
  key: string; // YYYY-MM
  label: string;
  fullLabel: string;
  year: number;
  monthIndex: number;
  pemasukan: number;
  pengeluaran: number;
  selisih: number;
  countMasuk: number;
  countKeluar: number;
}

export const CashflowMonthlyChart: React.FC<CashflowMonthlyChartProps> = ({ transaksiList }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Detect all available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    transaksiList.forEach((t) => {
      if (t.tanggal && t.tanggal.length >= 4) {
        const y = t.tanggal.substring(0, 4);
        if (!isNaN(Number(y))) years.add(y);
      }
    });
    // Default to at least current year
    if (years.size === 0) years.add('2026');
    return Array.from(years).sort().reverse();
  }, [transaksiList]);

  // Aggregate data by month
  const monthlyData = useMemo(() => {
    const map = new Map<string, MonthlyDataPoint>();

    transaksiList.forEach((t) => {
      if (!t.tanggal) return;
      const parts = t.tanggal.split('-');
      if (parts.length < 2) return;
      
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return;

      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${MONTH_NAMES[monthIdx]} ${String(year).slice(-2)}`,
          fullLabel: `${FULL_MONTH_NAMES[monthIdx]} ${year}`,
          year,
          monthIndex: monthIdx,
          pemasukan: 0,
          pengeluaran: 0,
          selisih: 0,
          countMasuk: 0,
          countKeluar: 0
        });
      }

      const point = map.get(key)!;
      if (t.tipe === 'Masuk') {
        point.pemasukan += Number(t.nominal) || 0;
        point.countMasuk += 1;
      } else {
        point.pengeluaran += Number(t.nominal) || 0;
        point.countKeluar += 1;
      }
      point.selisih = point.pemasukan - point.pengeluaran;
    });

    // Sort chronologically
    let sorted = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));

    // Filter by year if selected
    if (selectedYear !== 'all') {
      sorted = sorted.filter((d) => String(d.year) === selectedYear);
    }

    return sorted;
  }, [transaksiList, selectedYear]);

  // Totals for the chart header
  const totals = useMemo(() => {
    let pemasukan = 0;
    let pengeluaran = 0;
    monthlyData.forEach((d) => {
      pemasukan += d.pemasukan;
      pengeluaran += d.pengeluaran;
    });
    const selisih = pemasukan - pengeluaran;
    return { pemasukan, pengeluaran, selisih };
  }, [monthlyData]);

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyDataPoint;
      const isSurplus = dataPoint.selisih >= 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px]">
          <div className="font-bold text-sm text-slate-100 mb-2 pb-1.5 border-b border-slate-800 flex items-center justify-between">
            <span>{dataPoint.fullLabel}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isSurplus ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
              {isSurplus ? 'Surplus' : 'Defisit'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Pemasukan:</span>
              </span>
              <span className="font-mono font-bold">{formatRupiah(dataPoint.pemasukan)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                <span>Pengeluaran:</span>
              </span>
              <span className="font-mono font-bold">{formatRupiah(dataPoint.pengeluaran)}</span>
            </div>

            <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between font-semibold">
              <span className="text-slate-300">Selisih Kas:</span>
              <span className={`font-mono font-bold ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isSurplus ? '+' : ''}{formatRupiah(dataPoint.selisih)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Grafik Perbandingan Pemasukan vs Pengeluaran Bulanan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi tren arus kas masuk (Termin/Modal) vs keluar (Material/Operasional) per bulan
              </p>
            </div>
          </div>
        </div>

        {/* Filter Year & Quick Legend */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {availableYears.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Net Indicator Pill */}
          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${
            totals.selisih >= 0 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {totals.selisih >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>Net: {totals.selisih >= 0 ? '+' : ''}{formatRupiahShort(totals.selisih)}</span>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      {monthlyData.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold">Belum ada riwayat transaksi kas yang tercatat</p>
          <p className="text-xs text-slate-400 mt-1">
            Data grafik batang akan otomatis muncul saat Anda mencatat kas masuk atau pengeluaran bulanan.
          </p>
        </div>
      ) : (
        <div className="w-full">
          {/* Recharts Bar Container */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => formatRupiahShort(val)}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                  formatter={(value: string) => (
                    <span className="text-xs font-semibold text-slate-700 ml-1">
                      {value}
                    </span>
                  )}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <Bar 
                  dataKey="pemasukan" 
                  name="Pemasukan (Masuk)" 
                  fill="#059669" 
                  radius={[5, 5, 0, 0]}
                  maxBarSize={38} 
                />
                <Bar 
                  dataKey="pengeluaran" 
                  name="Pengeluaran (Keluar)" 
                  fill="#e11d48" 
                  radius={[5, 5, 0, 0]}
                  maxBarSize={38} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Month Summary Mini-Badges */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Total Masuk: <b className="text-slate-800 font-mono">{formatRupiah(totals.pemasukan)}</b></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Total Keluar: <b className="text-slate-800 font-mono">{formatRupiah(totals.pengeluaran)}</b></span>
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {monthlyData.map((d) => (
                <div 
                  key={d.key} 
                  className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 shrink-0 ${
                    d.selisih >= 0 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                  title={`${d.fullLabel}: Masuk ${formatRupiah(d.pemasukan)}, Keluar ${formatRupiah(d.pengeluaran)}`}
                >
                  <span className="font-bold">{d.label}:</span>
                  <span className="font-mono">{d.selisih >= 0 ? '+' : ''}{formatRupiahShort(d.selisih)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
