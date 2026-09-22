import React from 'react';
import { 
  Banknote, 
  CalendarCheck, 
  WalletCards, 
  BarChart3,
  CircleDollarSign,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../types';
import { formatRupiah } from '../utils/formatters';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingGajiCount: number;
  unpaidKasbonCount: number;
  overdueKasbonCount?: number;
  totalKaryawan: number;
  saldoKas?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  pendingGajiCount,
  unpaidKasbonCount,
  overdueKasbonCount = 0,
  totalKaryawan,
  saldoKas = 0
}) => {
  const tabs = [
    {
      id: 'penggajian' as ActiveTab,
      label: 'Penggajian & Slip',
      icon: Banknote,
      badge: pendingGajiCount > 0 ? `${pendingGajiCount} Pending` : `${totalKaryawan} Orang`,
      badgeColor: pendingGajiCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
    },
    {
      id: 'absensi' as ActiveTab,
      label: 'Absensi Centang',
      icon: CalendarCheck,
      badge: 'Matriks Presensi',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-medium'
    },
    {
      id: 'kasbon' as ActiveTab,
      label: 'Kasbon & Pinjaman',
      icon: WalletCards,
      badge: overdueKasbonCount > 0 
        ? `${overdueKasbonCount} Lewat >30hr ⚠️` 
        : unpaidKasbonCount > 0 
          ? `${unpaidKasbonCount} Aktif` 
          : '0 Aktif',
      badgeColor: overdueKasbonCount > 0
        ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-200 animate-pulse'
        : unpaidKasbonCount > 0 
          ? 'bg-rose-100 text-rose-800 font-semibold' 
          : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'keuangan' as ActiveTab,
      label: 'Buku Kas (Masuk/Keluar)',
      icon: CircleDollarSign,
      badge: saldoKas !== undefined ? formatRupiah(saldoKas) : 'Kas Proyek',
      badgeColor: saldoKas >= 0 ? 'bg-emerald-100 text-emerald-800 font-medium' : 'bg-rose-100 text-rose-800 font-medium'
    },
    {
      id: 'laporan' as ActiveTab,
      label: 'Laporan & Rekap',
      icon: BarChart3,
      badge: 'Rekap Resmi',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Audit & Pengaturan',
      icon: ShieldCheck,
      badge: 'Log Sistem',
      badgeColor: 'bg-sky-100 text-sky-800'
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

