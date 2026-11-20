import React, { useState, useMemo } from 'react';
import { CryptoRecord, ANOVAResult } from '../types/crypto';
import { computeOneWayANOVA } from '../utils/statistics';
import { exportANOVACsv } from '../utils/exportUtils';
import { Scale, CheckCircle2, XCircle, Download, HelpCircle, Info } from 'lucide-react';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';

interface HypothesisSectionProps {
  records: CryptoRecord[];
}

export const HypothesisSection: React.FC<HypothesisSectionProps> = ({ records }) => {
  const [metricChoice, setMetricChoice] = useState<'volatility' | 'dailyReturn'>('volatility');
  const [alpha, setAlpha] = useState<number>(0.05);

  const anovaResult: ANOVAResult = useMemo(() => {
    const label = metricChoice === 'volatility' ? 'Volatility (%)' : 'Daily Return (%)';
    return computeOneWayANOVA(records, metricChoice, label, alpha);
  }, [records, metricChoice, alpha]);

  const handleExport = () => {
    exportANOVACsv(anovaResult);
  };

  const chartData = useMemo(() => {
    return anovaResult.groupStats.map((g) => ({
      name: g.group.split(' ')[0],
      fullName: g.group,
      mean: g.mean,
      error: g.stdDev,
      count: g.count,
    }));
  }, [anovaResult]);

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="What One-Way ANOVA tests in plain English"
        summary="ANOVA checks whether the differences you see in average volatility or daily return across coins are statistically real, or could just be random day-to-day luck."
        tips={[
          'If p < α (default 0.05), we reject H₀ and conclude that coins genuinely differ in average volatility or return.',
          'Switch between Volatility (%) and Daily Return (%) or test stricter α = 0.01 thresholds below.',
        ]}
      />

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Parametric Hypothesis Testing: One-Way ANOVA
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Testing for statistically significant differences in population means across independent cryptocurrency asset groups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export ANOVA Table</span>
            </button>
          </div>
        </div>

        {/* Controls: Target Variable & Significance Level (alpha) */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Test Variable:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
              <button
                onClick={() => setMetricChoice('volatility')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  metricChoice === 'volatility'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Volatility (%)
              </button>
              <button
                onClick={() => setMetricChoice('dailyReturn')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  metricChoice === 'dailyReturn'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Return (%)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Significance Level (α):</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
              {[0.01, 0.05, 0.1].map((val) => (
                <button
                  key={val}
                  onClick={() => setAlpha(val)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                    alpha === val
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  α = {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formal Hypotheses Framework Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Statistical Hypotheses Specification
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1.5">
              <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[11px]">H₀</span>
              <span>Null Hypothesis</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              There is <strong>no significant difference</strong> in mean {anovaResult.metricName.toLowerCase()} among the observed cryptocurrency groups:
            </p>
            <code className="text-emerald-700 font-mono block mt-2 p-1.5 bg-white border border-slate-200 rounded">
              μ₁ = μ₂ = μ₃ = ... = μₖ
            </code>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1.5">
              <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[11px]">H₁</span>
              <span>Alternative Hypothesis</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              There is a <strong>statistically significant difference</strong> in mean {anovaResult.metricName.toLowerCase()} among the cryptocurrencies:
            </p>
            <code className="text-emerald-700 font-mono block mt-2 p-1.5 bg-white border border-slate-200 rounded">
              At least one pair (μᵢ ≠ μⱼ) differs significantly
            </code>
          </div>
        </div>
      </div>

      {/* Test Verdict & Decision Card */}
      <div
        className={`border rounded-lg p-6 ${
          anovaResult.rejectNull
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-amber-50/70 border-amber-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded bg-white shadow-xs shrink-0">
            {anovaResult.rejectNull ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <XCircle className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Statistical Decision (α = {alpha})
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {anovaResult.decision}
            </h3>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {anovaResult.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Complete ANOVA Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            ANOVA Table: {anovaResult.metricName}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            k = {anovaResult.groups.length} groups | N = {anovaResult.dfTotal + 1} observations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-mono tabular-nums">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans font-semibold">
                <th className="py-2.5 px-4">Source of Variation</th>
                <th className="py-2.5 px-3 text-right">Sum of Squares (SS)</th>
                <th className="py-2.5 px-3 text-right">Degrees of Freedom (df)</th>
                <th className="py-2.5 px-3 text-right">Mean Square (MS)</th>
                <th className="py-2.5 px-3 text-right">F-Statistic</th>
                <th className="py-2.5 px-4 text-right">p-Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                  Between Groups (Treatment)
                </td>
                <td className="py-3 px-3 text-right">{anovaResult.ssBetween.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">{anovaResult.dfBetween}</td>
                <td className="py-3 px-3 text-right">{anovaResult.msBetween.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  {anovaResult.fStat.toFixed(3)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-emerald-800">
                  {anovaResult.pValue < 0.0001 ? '< 0.0001' : anovaResult.pValue.toFixed(4)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                  Within Groups (Error / Residual)
                </td>
                <td className="py-3 px-3 text-right">{anovaResult.ssWithin.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">{anovaResult.dfWithin}</td>
                <td className="py-3 px-3 text-right">{anovaResult.msWithin.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-slate-400">—</td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
              </tr>
              <tr className="bg-slate-50/50 font-semibold text-slate-900">
                <td className="py-3 px-4 font-sans">Total</td>
                <td className="py-3 px-3 text-right">{anovaResult.ssTotal.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">{anovaResult.dfTotal}</td>
                <td className="py-3 px-3 text-right text-slate-400">—</td>
                <td className="py-3 px-3 text-right text-slate-400">—</td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Means & Error Bars Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Group Means & Standard Deviation Spread
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Visual comparison of group means (x̄) for {anovaResult.metricName}
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: unknown) => [Number(val).toFixed(3), 'Group Mean']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="mean" fill="#059669" radius={[4, 4, 0, 0]} name="Group Mean">
                  <ErrorBar dataKey="error" width={4} strokeWidth={1.5} stroke="#334155" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            ANOVA Group Diagnostics Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Sample counts, group means, and sample variance per asset
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-2 px-3">Group</th>
                  <th className="py-2 px-3 text-right">Sample (n)</th>
                  <th className="py-2 px-3 text-right">Mean (x̄)</th>
                  <th className="py-2 px-3 text-right">Variance (s²)</th>
                  <th className="py-2 px-3 text-right">Std Dev (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
                {anovaResult.groupStats.map((g) => (
                  <tr key={g.group} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">{g.group}</td>
                    <td className="py-2 px-3 text-right">{g.count}</td>
                    <td className="py-2 px-3 text-right font-semibold">{g.mean.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{g.variance.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{g.stdDev.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
