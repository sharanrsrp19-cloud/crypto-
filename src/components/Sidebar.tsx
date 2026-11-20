import React from 'react';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  TrendingUp,
  Activity,
  GitCommit,
  LineChart,
  Scale,
  PieChart,
  FileCheck2,
  BookOpenText,
  Upload,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types/crypto';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  recordCount: number;
  cryptoCount: number;
  datasetSourceLabel: string;
  onOpenUploadModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  shortHint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Overview', shortHint: 'Start & key findings', icon: LayoutDashboard },
  { id: 'dataset', label: 'Dataset & Cleaning', shortHint: 'Table, types & cleaning', icon: Database },
  { id: 'statistics', label: 'Descriptive Statistics', shortHint: 'Mean, median, SD & CV', icon: BarChart3 },
  { id: 'returns', label: 'Daily Return Analysis', shortHint: 'Gains, losses & win rate', icon: TrendingUp },
  { id: 'volatility', label: 'Volatility Analysis', shortHint: 'Price swings & risk', icon: Activity },
  { id: 'correlation', label: 'Correlation Heatmap', shortHint: 'How metrics move together', icon: GitCommit },
  { id: 'regression', label: 'Linear Regression', shortHint: 'Trend lines & R²', icon: LineChart },
  { id: 'hypothesis', label: 'Hypothesis Testing', shortHint: 'One-Way ANOVA test', icon: Scale },
  { id: 'visualizations', label: 'Visualizations Gallery', shortHint: '10 interactive charts', icon: PieChart },
  { id: 'conclusion', label: 'Statistical Summary', shortHint: 'Plain-English takeaway', icon: FileCheck2 },
  { id: 'report', label: 'Academic Project Report', shortHint: '18-section printable paper', icon: BookOpenText },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  recordCount,
  cryptoCount,
  datasetSourceLabel,
  onOpenUploadModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-200 lg:static lg:translate-x-0 no-print ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">
              CS
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">
                CryptoStats Lab
              </h1>
              <p className="text-[11px] text-slate-400 font-normal">
                Statistics Research Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset quick status */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-800/80 rounded border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-[11px] text-slate-400 font-medium truncate" title={datasetSourceLabel}>
              {datasetSourceLabel}
            </span>
            <span className="font-mono text-emerald-400 text-[11px] shrink-0">{cryptoCount} Coins</span>
          </div>
          <div className="flex items-center justify-between font-mono text-slate-300 text-[11px]">
            <span>Active Rows</span>
            <span>{recordCount.toLocaleString()}</span>
          </div>
          <button
            onClick={() => {
              onCloseMobile();
              onOpenUploadModal();
            }}
            className="mt-2.5 w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV / Excel</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
            Analysis Sections
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-start gap-3 px-3 py-2 rounded text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.shortHint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Academic Disclaimer Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 leading-normal">
          <p className="font-medium text-slate-300 mb-0.5">Academic Research Only</p>
          <p className="text-[10px] text-slate-400">
            Calculations reflect uploaded data only and are not financial advice.
          </p>
        </div>
      </aside>
    </>
  );
};
