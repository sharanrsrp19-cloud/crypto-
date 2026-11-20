import React, { useMemo } from 'react';
import { CryptoRecord, VolatilityStats } from '../types/crypto';
import { computeVolatilityStats } from '../utils/statistics';
import { exportVolatilityCsv } from '../utils/exportUtils';
import { Download, Activity, Flame, ShieldAlert, Info } from 'lucide-react';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface VolatilitySectionProps {
  records: CryptoRecord[];
}

export const VolatilitySection: React.FC<VolatilitySectionProps> = ({ records }) => {
  const volatilityStats = useMemo(() => {
    return computeVolatilityStats(records);
  }, [records]);

  const uniqueCryptos = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.cryptocurrency))).sort();
  }, [records]);

  // Ranked by average volatility descending
  const rankedStats = useMemo(() => {
    return [...volatilityStats].sort((a, b) => b.avgVolatility - a.avgVolatility);
  }, [volatilityStats]);

  // Timeline data for volatility
  const volatilityTimeline = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      uniqueCryptos.forEach((c) => {
        const item = records.find((r) => r.date === date && r.cryptocurrency === c);
        if (item) {
          row[c] = item.volatility;
        }
      });
      return row;
    });
  }, [records, uniqueCryptos]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="Understanding Volatility (%)"
        summary="Volatility measures how wildly a coin's price swings between its daily High and Low relative to its Open price. Higher numbers indicate larger intraday price instability."
        tips={[
          'Assets are ranked from highest (#1) to lowest mean daily volatility.',
          'Annualized Volatility scales daily volatility across a 365-day crypto year for standardized risk comparison.',
        ]}
      />

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Volatility & Intraday Price Range Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily Range = <code>High - Low</code> | Volatility (%) = <code>((High - Low) / Open) × 100</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportVolatilityCsv(volatilityStats)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Volatility Highlights */}
        {rankedStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs">
              <span className="text-[10px] uppercase font-semibold text-red-700 block mb-0.5">
                Highest Volatility Asset
              </span>
              <p className="text-base font-bold text-red-900">
                {rankedStats[0].cryptocurrency}
              </p>
              <p className="text-red-700 font-mono text-[11px] mt-0.5">
                Mean Daily: {rankedStats[0].avgVolatility.toFixed(2)}% | Annualized: {rankedStats[0].annualizedVolatility.toFixed(1)}%
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs">
              <span className="text-[10px] uppercase font-semibold text-emerald-700 block mb-0.5">
                Lowest Volatility Asset
              </span>
              <p className="text-base font-bold text-emerald-900">
                {rankedStats[rankedStats.length - 1].cryptocurrency}
              </p>
              <p className="text-emerald-700 font-mono text-[11px] mt-0.5">
                Mean Daily: {rankedStats[rankedStats.length - 1].avgVolatility.toFixed(2)}% | Annualized: {rankedStats[rankedStats.length - 1].annualizedVolatility.toFixed(1)}%
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                Annualization Factor
              </span>
              <p className="text-base font-bold text-slate-900">
                √365 ≈ 19.105
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Standard crypto market trading 24/7/365 convention.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Volatility Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Cryptocurrency Volatility & Dispersion Comparison
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Cryptocurrency</th>
                <th className="py-2.5 px-3 text-right">Sample (n)</th>
                <th className="py-2.5 px-3 text-right">Mean Daily Volatility (%)</th>
                <th className="py-2.5 px-3 text-right">Max Volatility (%)</th>
                <th className="py-2.5 px-3 text-right">Min Volatility (%)</th>
                <th className="py-2.5 px-3 text-right">Daily Volatility Std Dev</th>
                <th className="py-2.5 px-3 text-right">Mean Daily Range ($)</th>
                <th className="py-2.5 px-4 text-right">Annualized Volatility (σₐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
              {rankedStats.map((s, idx) => (
                <tr key={s.cryptocurrency} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 whitespace-nowrap">
                    <span className="text-slate-400 mr-2 text-[11px]">#{idx + 1}</span>
                    {s.cryptocurrency}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">{s.count}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {s.avgVolatility.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right text-red-700">{s.maxVolatility.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-right text-slate-600">{s.minVolatility.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-right text-slate-700">{s.stdDevVolatility.toFixed(3)}%</td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    ${s.avgDailyRange >= 1 ? s.avgDailyRange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : s.avgDailyRange.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800">
                    {s.annualizedVolatility.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volatility Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volatility Bar Comparison */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Mean Daily Volatility (%) Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Cross-asset comparison of mean percentage price fluctuation
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankedStats} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="cryptocurrency" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val: string) => val.split(' ')[0]} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`, 'Mean Volatility']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="avgVolatility" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Daily Volatility (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volatility Timeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Daily Volatility (%) Time Series
            </h3>
            <p className="text-xs text-slate-500">
              Tracking intraday expansion and contraction cycles over time
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volatilityTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {uniqueCryptos.slice(0, 4).map((c, i) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={COLORS[i % COLORS.length]}
                    dot={false}
                    strokeWidth={1.5}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
