import React from 'react';
import { Upload, Printer, RotateCcw, FileSpreadsheet, HelpCircle, Menu } from 'lucide-react';
import { ActiveTab } from '../types/crypto';

interface HeaderProps {
  activeTab: ActiveTab;
  tabTitle: string;
  onOpenUpload: () => void;
  onResetSample: () => void;
  onPrintReport: () => void;
  onDownloadSampleCsv: () => void;
  onOpenGuide: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabTitle,
  onOpenUpload,
  onResetSample,
  onPrintReport,
  onDownloadSampleCsv,
  onOpenGuide,
  onOpenMobileMenu,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 no-print">
      {/* Zone 1: Mobile Menu Trigger + Breadcrumb & Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold text-slate-900 tracking-tight truncate">
          Crypto Price, Returns & Volatility
        </span>
        <span className="text-slate-300 font-light hidden md:inline shrink-0">/</span>
        <span className="text-xs font-medium text-slate-500 truncate hidden md:inline">
          {tabTitle}
        </span>
      </div>

      {/* Zone 2 & 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenGuide}
          title="Open User Guide & Statistics Glossary"
          className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">User Guide</span>
        </button>

        <button
          onClick={onDownloadSampleCsv}
          title="Download Sample Dataset Template (CSV)"
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors hidden md:flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span>Sample CSV</span>
        </button>

        <button
          onClick={onResetSample}
          title="Reload baseline 5-asset sample dataset"
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden xl:inline">Reset Sample</span>
        </button>

        <button
          onClick={onPrintReport}
          title="Print or Save Academic Report as PDF"
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Print / PDF</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Data</span>
        </button>
      </div>
    </header>
  );
};
