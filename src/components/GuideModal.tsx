import React from 'react';
import { X, Upload, Filter, BarChart3, BookOpen, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onOpenUpload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              User Guide & Plain-English Statistics Glossary
            </h2>
            <p className="text-xs text-slate-500">
              Quick walkthrough of how to use the dashboard and understand every statistical metric
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 3-Step Workflow */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              How to Use This App in 3 Steps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>1. Load Your Data</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Start right away with the built-in 5-coin sample dataset, or click <strong>Upload Dataset</strong> to load your own CSV or Excel file. Column names are auto-detected and can be adjusted manually.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <Filter className="w-4 h-4 text-emerald-700" />
                  <span>2. Filter & Slice</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Use the top filter bar to pick specific cryptocurrencies, narrow the date window (30D, 90D, custom dates), or set a closing price range. All tables, charts, and tests update live.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>3. Explore & Export</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Browse the left sidebar modules from Descriptive Statistics through Hypothesis Testing. Download cleaned CSVs, export PNG charts, or print the 18-section Academic Report as a PDF.
                </p>
              </div>
            </div>
          </div>

          {/* Plain-English Glossary */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Plain-English Statistics Cheat Sheet</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">Mean vs. Median</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  The <strong>Mean</strong> is the average value; the <strong>Median</strong> is the middle value when sorted. If Mean is much higher than Median, a few huge price spikes are pulling the average up.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">Coefficient of Variation (CV %)</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Measures relative price fluctuation regardless of coin price scale. A $0.50 coin and a $64,000 coin can be compared fairly using CV%: higher CV% means larger relative swings.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">Daily Return (%) & Win Ratio</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Percentage gain or loss from day Open to day Close. <strong>Win Ratio</strong> shows what percentage of days ended higher than they opened.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">Volatility (%) & Annualized Vol</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Intraday swing width <code>(High - Low) / Open</code>. Larger numbers mean wider daily price swings. Annualized volatility scales this across a 365-day crypto year.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">Pearson Correlation (r) & R²</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  <code>r</code> ranges from -1 to +1. Near +1 means two metrics rise together; near -1 means one rises as the other falls; near 0 means no linear link. <code>R²</code> shows how much variance one variable explains in another.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">One-Way ANOVA & p-value</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Tests whether coins genuinely differ in average volatility or return. When <strong>p &lt; 0.05</strong>, the difference across coins is statistically real rather than random noise.
                </p>
              </div>
            </div>
          </div>

          {/* Expected File Format */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-md flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950">
              <strong>Expected Dataset Columns:</strong> Date, Cryptocurrency, Open, High, Low, Close, Trading Volume, and Market Cap. Missing High/Low or currency signs like <code>$</code> and commas are cleaned automatically.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenUpload();
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
          >
            Upload My Dataset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
