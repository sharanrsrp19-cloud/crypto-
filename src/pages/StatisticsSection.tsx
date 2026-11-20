import React, { useState, useMemo } from 'react';
import { CryptoRecord, DescriptiveStats } from '../types/crypto';
import { computeDescriptiveStats } from '../utils/statistics';
import { exportDescriptiveStatsCsv } from '../utils/exportUtils';
import { Download, Calculator, Info } from 'lucide-react';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StatisticsSectionProps {
  records: CryptoRecord[];
}

type MetricKey = 'close' | 'open' | 'high' | 'low' | 'volume' | 'marketCap' | 'dailyReturn' | 'volatility';

const METRIC_OPTIONS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'close', label: 'Close Price', unit: '$' },
  { key: 'open', label: 'Open Price', unit: '$' },
  { key: 'high', label: 'High Price', unit: '$' },
  { key: 'low', label: 'Low Price', unit: '$' },
  { key: 'volume', label: 'Trading Volume', unit: '$' },
  { key: 'marketCap', label: 'Market Capitalization', unit: '$' },
  { key: 'dailyReturn', label: 'Daily Return (%)', unit: '%' },
  { key: 'volatility', label: 'Daily Volatility (%)', unit: '%' },
];

export const StatisticsSection: React.FC<StatisticsSectionProps> = ({ records }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('close');

  const currentMetricConfig = useMemo(() => {
    return METRIC_OPTIONS.find((m) => m.key === selectedMetric)!;
  }, [selectedMetric]);

  const stats = useMemo(() => {
    return computeDescriptiveStats(records, selectedMetric);
  }, [records, selectedMetric]);

  const handleExport = () => {
    exportDescriptiveStatsCsv(stats, currentMetricConfig.label);
  };

  const chartData = useMemo(() => {
    return stats.map((s) => ({
      name: s.cryptocurrency.split(' ')[0], // shorter ticker
      fullName: s.cryptocurrency,
      mean: s.mean,
      median: s.median,
      stdDev: s.stdDev,
      cv: s.coefficientOfVariation,
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="How to read Descriptive Statistics"
        summary="This page summarizes the typical value (Mean & Median), extremes (Min & Max), and price spread (Standard Deviation & CV%) for any metric you select below."
        tips={[
          'Use Coefficient of Variation (CV%) to compare volatility fairly between expensive coins like BTC and low-priced coins like ADA.',
          'Switch tabs below to inspect Close Price, Trading Volume, Daily Return %, or Volatility %.',
        ]}
      />

      {/* Header & Metric Picker */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Descriptive Statistics & Dispersion Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Measures of central tendency, sample variability, and relative dispersion for each cryptocurrency asset.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-md">
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedMetric(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                selectedMetric === opt.key
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Descriptive Statistics Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Parametric Summary Table: {currentMetricConfig.label}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            N = {records.length.toLocaleString()} total pooled observations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Cryptocurrency</th>
                <th className="py-2.5 px-3 text-right">Sample (n)</th>
                <th className="py-2.5 px-3 text-right">Mean (x̄)</th>
                <th className="py-2.5 px-3 text-right">Median</th>
                <th className="py-2.5 px-3 text-right">Mode</th>
                <th className="py-2.5 px-3 text-right">Min</th>
                <th className="py-2.5 px-3 text-right">Max</th>
                <th className="py-2.5 px-3 text-right">Range</th>
                <th className="py-2.5 px-3 text-right">Variance (s²)</th>
                <th className="py-2.5 px-3 text-right">Std Dev (s)</th>
                <th className="py-2.5 px-4 text-right">CV (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
              {stats.map((s) => (
                <tr key={s.cryptocurrency} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 whitespace-nowrap">
                    {s.cryptocurrency}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {s.count}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900">
                    {s.mean.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.median.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 text-[11px]" title={s.mode.join(', ')}>
                    {s.mode.length > 0 ? s.mode.slice(0, 1).map((m) => m.toLocaleString()).join(', ') : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {s.min.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {s.max.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {s.range.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 text-[11px]">
                    {s.variance >= 1000000 ? s.variance.toExponential(2) : s.variance.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {s.stdDev.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-800">
                    {s.coefficientOfVariation.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispersion Comparison Chart: Mean vs Standard Deviation vs CV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Standard Deviation Comparison (Absolute Dispersion)
            </h3>
            <p className="text-xs text-slate-500">
              Sample standard deviation s = √[∑(x - x̄)² / (n - 1)] for {currentMetricConfig.label}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: unknown) => [Number(val).toLocaleString(), 'Std Dev']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="stdDev" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Std Dev" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Coefficient of Variation (CV % - Relative Dispersion)
            </h3>
            <p className="text-xs text-slate-500">
              Unitless normalized risk CV = (s / |x̄|) × 100% enabling cross-scale comparison
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`, 'CV']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="cv" fill="#10b981" radius={[4, 4, 0, 0]} name="CV (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Academic Formulas Reference */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-slate-500" />
          <span>Formulas & Mathematical Definitions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">Arithmetic Mean (x̄)</div>
            <code className="text-emerald-700 font-mono text-[11px] block mb-1">x̄ = (∑ xᵢ) / n</code>
            <p className="text-slate-500 text-[11px]">
              The central location parameter calculated as the sum of all observed data points divided by sample size.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">Sample Variance & Std Dev</div>
            <code className="text-emerald-700 font-mono text-[11px] block mb-1">s² = ∑(xᵢ - x̄)² / (n - 1); s = √s²</code>
            <p className="text-slate-500 text-[11px]">
              Unbiased estimator with Bessel correction (n - 1) measuring the average squared deviation from the mean.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">Coefficient of Variation (CV)</div>
            <code className="text-emerald-700 font-mono text-[11px] block mb-1">CV = (s / |x̄|) × 100%</code>
            <p className="text-slate-500 text-[11px]">
              Dimensionless ratio expressing standard deviation relative to the mean, allowing fair volatility comparison across assets priced at drastically different scales (e.g. BTC vs ADA).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
