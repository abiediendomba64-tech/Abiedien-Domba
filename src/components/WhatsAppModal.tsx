import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, Phone, MessageSquare, Sparkles, Building, AlertCircle } from 'lucide-react';
import { Karyawan, CompanySettings } from '../types';
import { generateWhatsAppMessage, openWhatsApp, WATemplateType } from '../utils/whatsapp';
import { standardizePhone, formatRupiah } from '../utils/formatters';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  karyawan: Karyawan | null;
  company: CompanySettings;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  karyawan,
  company
}) => {
  const [template, setTemplate] = useState<WATemplateType>('resmi');
  const [customText, setCustomText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (karyawan) {
      setPhoneNumber(karyawan.no_wa || '');
      const initialMsg = generateWhatsAppMessage(karyawan, company, template);
      setCustomText(initialMsg);
      setCopied(false);
    }
  }, [karyawan, company, template, isOpen]);

  if (!isOpen || !karyawan) return null;

  const handleTemplateChange = (newTemplate: WATemplateType) => {
    setTemplate(newTemplate);
    const msg = generateWhatsAppMessage(karyawan, company, newTemplate);
    setCustomText(msg);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = () => {
    openWhatsApp(phoneNumber, customText);
  };

  const cleanPhone = standardizePhone(phoneNumber);
  const hasPhone = Boolean(cleanPhone);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kirim Slip Gaji via WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Karyawan: <span className="font-semibold text-slate-700">{karyawan.nama}</span> ({karyawan.kode}) • {formatRupiah(karyawan.total_gaji)}
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

        <div className="space-y-4 pt-4">
          {/* Target Phone Number Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp Tujuan:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 6281318575529 atau 0813..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {!hasPhone ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Nomor belum diisi (pilih kontak saat kirim).
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  Tujuan: {cleanPhone}
                </span>
              )}
              {company.noWaDefault && (
                <button
                  type="button"
                  onClick={() => setPhoneNumber(company.noWaDefault || '+6281318575529')}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Gunakan No. Proyek ({company.noWaDefault})
                </button>
              )}
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Format / Gaya Pesan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('resmi')}
                className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                  template === 'resmi'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. Resmi Lengkap
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('ringkas')}
                className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                  template === 'ringkas'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. Ringkas Cepat
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('lapangan')}
                className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                  template === 'lapangan'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                3. Proyek Lapangan
              </button>
            </div>
          </div>

          {/* Live Text Area / WhatsApp Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Pratinjau Pesan (Bisa Diedit Manual):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks'}</span>
              </button>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={9}
              className="w-full p-3 text-xs sm:text-sm font-mono bg-emerald-50/30 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-y leading-relaxed text-slate-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Sudah Disalin' : 'Salin Pesan'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg shadow-xs flex items-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp Sekarang</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
