import React, { useMemo } from 'react';
import {
  CryptoRecord,
  ReturnStats,
  VolatilityStats,
  ANOVAResult,
  ActiveTab,
} from '../types/crypto';
import {
  ArrowRight,
  TrendingUp,
  Scale,
  Database,
  BarChart2,
  HelpCircle,
  Upload,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface HomeSectionProps {
  records: CryptoRecord[];
  cryptos: string[];
  dateRange: { start: string; end: string };
  datasetSourceLabel: string;
  returnStats: ReturnStats[];
  volatilityStats: VolatilityStats[];
  anovaVolatility: ANOVAResult;
  onNavigate: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onOpenGuide: () => void;
}

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const HomeSection: React.FC<HomeSectionProps> = ({
  records,
  cryptos,
  dateRange,
  datasetSourceLabel,
  returnStats,
  volatilityStats,
  anovaVolatility,
  onNavigate,
  onOpenUpload,
  onOpenGuide,
}) => {
  const totalObservations = records.length;
  const overallAvgReturn =
    returnStats.length > 0
      ? returnStats.reduce((sum, s) => sum + s.avgReturn, 0) / returnStats.length
      : 0;

  const sortedVol = [...volatilityStats].sort((a, b) => b.avgVolatility - a.avgVolatility);
  const highestVolAsset = sortedVol[0];
  const lowestVolAsset = sortedVol[sortedVol.length - 1];

  // Build normalized price index (Base = 100 on earliest date per coin) so all coins can be compared on one chart
  const normalizedSeries = useMemo(() => {
    if (records.length === 0 || cryptos.length === 0) return [];
    const basePrices: Record<string, number> = {};
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((r) => {
      if (basePrices[r.cryptocurrency] === undefined && r.close > 0) {
        basePrices[r.cryptocurrency] = r.close;
      }
    });

    const dates = Array.from(new Set(sorted.map((r) => r.date))).sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      cryptos.forEach((c) => {
        const rec = sorted.find((r) => r.date === date && r.cryptocurrency === c);
        if (rec && basePrices[c]) {
          row[c] = Math.round((rec.close / basePrices[c]) * 10000) / 100;
        }
      });
      return row;
    });
  }, [records, cryptos]);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-emerald-700">College Statistics Research Project</span>
              <span aria-hidden="true">·</span>
              <span>Active Source: <strong className="text-slate-700">{datasetSourceLabel}</strong></span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{dateRange.start || 'N/A'} to {dateRange.end || 'N/A'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight text-balance">
              Statistical Analysis of Cryptocurrency Price, Returns and Volatility
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Explore cryptocurrency prices, daily gains/losses, price swings, correlations, and statistical hypothesis tests in plain English. Use the built-in 5-asset sample dataset immediately or upload your own CSV or Excel spreadsheet.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV / Excel</span>
              </button>
              <button
                onClick={() => onNavigate('statistics')}
                className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Statistics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('report')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                Read 18-Part Report
              </button>
              <button
                onClick={onOpenGuide}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to read these metrics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Scope KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Coins Analyzed</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {cryptos.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Filtered cryptocurrencies in view
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Cleaned Data Rows</span>
            <BarChart2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalObservations.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Validated daily records (N)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Average Daily Return</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              overallAvgReturn >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {overallAvgReturn > 0 ? '+' : ''}
            {overallAvgReturn.toFixed(3)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Typical day-over-day price change
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Volatility Difference Test</span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {anovaVolatility.rejectNull ? 'Significant Difference' : 'No Significant Diff.'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            ANOVA F = {anovaVolatility.fStat.toFixed(2)}, p = {anovaVolatility.pValue < 0.001 ? '< 0.001' : anovaVolatility.pValue.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Normalized Price Comparison Chart */}
      {normalizedSeries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Relative Price Movement Comparison (Indexed to 100)
              </h2>
              <p className="text-xs text-slate-500">
                All coins start at 100 on {dateRange.start} so high-priced coins (e.g., BTC) and low-priced coins (e.g., ADA) can be compared fairly on one chart.
              </p>
            </div>
            <button
              onClick={() => onNavigate('visualizations')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Open All 10 Charts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={normalizedSeries} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <ReferenceLine y={100} stroke="#cbd5e1" strokeDasharray="3 3" />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)} (Index)`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {cryptos.map((c, i) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    dot={false}
                    strokeWidth={1.75}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cross-Asset Volatility Summary & Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Summary by Cryptocurrency
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {dateRange.start} → {dateRange.end}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50/50">
                  <th className="py-2.5 px-3">Cryptocurrency</th>
                  <th className="py-2.5 px-3 text-right">Days</th>
                  <th className="py-2.5 px-3 text-right">Avg Daily Return</th>
                  <th className="py-2.5 px-3 text-right">Avg Daily Swing</th>
                  <th className="py-2.5 px-3 text-right">Annualized Vol</th>
                  <th className="py-2.5 px-3 text-right">Up Days %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cryptos.map((c) => {
                  const r = returnStats.find((s) => s.cryptocurrency === c);
                  const v = volatilityStats.find((s) => s.cryptocurrency === c);
                  return (
                    <tr key={c} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {c}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {r?.count || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span
                          className={
                            (r?.avgReturn || 0) >= 0
                              ? 'text-emerald-700 font-semibold'
                              : 'text-red-700 font-semibold'
                          }
                        >
                          {(r?.avgReturn || 0) > 0 ? '+' : ''}
                          {(r?.avgReturn || 0).toFixed(3)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                        {(v?.avgVolatility || 0).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 font-semibold">
                        {(v?.annualizedVolatility || 0).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {(r?.positivePercentage || 0).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Analytical Findings */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Plain-English Key Takeaways
          </h2>

          <div className="space-y-3 text-xs">
            {highestVolAsset && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                  Widest Daily Price Swings
                </span>
                <p className="font-semibold text-slate-900">
                  {highestVolAsset.cryptocurrency} ({highestVolAsset.avgVolatility.toFixed(2)}% average daily range)
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Exhibited the highest observed annualized volatility ({highestVolAsset.annualizedVolatility.toFixed(1)}%).
                </p>
              </div>
            )}

            {lowestVolAsset && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                  Steadiest Daily Price Behavior
                </span>
                <p className="font-semibold text-slate-900">
                  {lowestVolAsset.cryptocurrency} ({lowestVolAsset.avgVolatility.toFixed(2)}% average daily range)
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Showed the narrowest day-to-day intraday fluctuations in this window.
                </p>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                What ANOVA Tells Us (α = 0.05)
              </span>
              <p className="font-semibold text-slate-900">
                {anovaVolatility.rejectNull ? 'Volatility differs significantly across coins' : 'Volatility is statistically similar across coins'}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {anovaVolatility.rejectNull
                  ? 'The observed gap in volatility is statistically real (p < 0.05), not random chance.'
                  : 'Differences in average volatility could be explained by sample noise (p ≥ 0.05).'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guided Analysis Steps */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Explore Analysis Modules Step by Step
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {[
            {
              step: 'Step 1 · Data',
              title: 'Inspect & Clean Data',
              desc: 'Check rows, data types, missing values, and download cleaned CSV.',
              tab: 'dataset' as ActiveTab,
            },
            {
              step: 'Step 2 · Averages',
              title: 'Descriptive Stats',
              desc: 'Compare Mean, Median, Mode, Std Dev, and CV% across coins.',
              tab: 'statistics' as ActiveTab,
            },
            {
              step: 'Step 3 · Performance',
              title: 'Returns & Volatility',
              desc: 'See win rates, return distributions, and daily risk swings.',
              tab: 'returns' as ActiveTab,
            },
            {
              step: 'Step 4 · Relationships',
              title: 'Correlation & OLS',
              desc: 'Test whether volume or volatility links linearly with returns.',
              tab: 'regression' as ActiveTab,
            },
            {
              step: 'Step 5 · Proof & Paper',
              title: 'ANOVA & Report',
              desc: 'Verify F-test significance and export the 18-part academic paper.',
              tab: 'hypothesis' as ActiveTab,
            },
          ].map((m) => (
            <button
              key={m.step}
              onClick={() => onNavigate(m.tab)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-left transition-colors cursor-pointer group"
            >
              <span className="text-[11px] font-semibold text-emerald-700 block mb-1">
                {m.step}
              </span>
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {m.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {m.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
