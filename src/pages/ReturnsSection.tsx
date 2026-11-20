import React, { useMemo, useState } from 'react';
import { CryptoRecord, ReturnStats } from '../types/crypto';
import { computeReturnStats } from '../utils/statistics';
import { exportReturnsCsv } from '../utils/exportUtils';
import { Download, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
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
  ReferenceLine,
} from 'recharts';

interface ReturnsSectionProps {
  records: CryptoRecord[];
}

export const ReturnsSection: React.FC<ReturnsSectionProps> = ({ records }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('all');

  const returnStats = useMemo(() => {
    return computeReturnStats(records);
  }, [records]);

  const uniqueCryptos = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.cryptocurrency))).sort();
  }, [records]);

  // Aggregate return metrics across all
  const totalObservations = returnStats.reduce((sum, s) => sum + s.count, 0);
  const pooledPositives = returnStats.reduce((sum, s) => sum + s.positiveDays, 0);
  const pooledNegatives = returnStats.reduce((sum, s) => sum + s.negativeDays, 0);
  const pooledAvgReturn =
    totalObservations > 0
      ? returnStats.reduce((sum, s) => sum + s.avgReturn * s.count, 0) / totalObservations
      : 0;

  // Time-series data for daily return chart
  const timeSeriesData = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      uniqueCryptos.forEach((c) => {
        const item = records.find((r) => r.date === date && r.cryptocurrency === c);
        if (item) {
          row[c] = item.dailyReturn;
        }
      });
      return row;
    });
  }, [records, uniqueCryptos]);

  // Histogram buckets for daily return distributions
  const histogramData = useMemo(() => {
    const targetRecords =
      selectedCrypto === 'all'
        ? records
        : records.filter((r) => r.cryptocurrency === selectedCrypto);

    const buckets = [
      { range: '< -6%', min: -Infinity, max: -6, count: 0 },
      { range: '-6% to -4%', min: -6, max: -4, count: 0 },
      { range: '-4% to -2%', min: -4, max: -2, count: 0 },
      { range: '-2% to 0%', min: -2, max: 0, count: 0 },
      { range: '0% to +2%', min: 0, max: 2, count: 0 },
      { range: '+2% to +4%', min: 2, max: 4, count: 0 },
      { range: '+4% to +6%', min: 4, max: 6, count: 0 },
      { range: '> +6%', min: 6, max: Infinity, count: 0 },
    ];

    targetRecords.forEach((r) => {
      for (const b of buckets) {
        if (r.dailyReturn >= b.min && r.dailyReturn < b.max) {
          b.count++;
          break;
        }
      }
    });

    return buckets;
  }, [records, selectedCrypto]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="What Daily Return (%) shows"
        summary="Daily Return measures the percentage gain or loss from market open to close each day. Positive days ended higher than they opened; negative days ended lower."
        tips={[
          'Win Ratio (%) tells you how often a coin closed higher than it opened.',
          'Check the Frequency Distribution histogram below to see whether returns cluster tightly near 0% or show large ±6% tail swings.',
        ]}
      />

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Daily Return Analysis & Distribution
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Formula: <code>Daily Return (%) = ((Close Price - Open Price) / Open Price) × 100</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportReturnsCsv(returnStats)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Cross-Asset Mean Return
            </span>
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                pooledAvgReturn >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {pooledAvgReturn > 0 ? '+' : ''}
              {pooledAvgReturn.toFixed(3)}%
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Positive Return Days
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {pooledPositives}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({((pooledPositives / (totalObservations || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Negative Return Days
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-red-700 tabular-nums">
                {pooledNegatives}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({((pooledNegatives / (totalObservations || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              Win / Loss Ratio
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {(pooledPositives / (pooledNegatives || 1)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Return Statistics Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Cryptocurrency Daily Return Statistical Summary
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Cryptocurrency</th>
                <th className="py-2.5 px-3 text-right">Days (n)</th>
                <th className="py-2.5 px-3 text-right">Mean Return (%)</th>
                <th className="py-2.5 px-3 text-right">Std Dev (%)</th>
                <th className="py-2.5 px-3 text-right">Max Gain (%)</th>
                <th className="py-2.5 px-3 text-right">Max Loss (%)</th>
                <th className="py-2.5 px-3 text-right">Positive Days</th>
                <th className="py-2.5 px-3 text-right">Negative Days</th>
                <th className="py-2.5 px-4 text-right">Win Ratio (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
              {returnStats.map((s) => (
                <tr key={s.cryptocurrency} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 whitespace-nowrap">
                    {s.cryptocurrency}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">{s.count}</td>
                  <td className="py-3 px-3 text-right font-semibold">
                    <span className={s.avgReturn >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                      {s.avgReturn > 0 ? '+' : ''}
                      {s.avgReturn.toFixed(3)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-800">{s.stdDevReturn.toFixed(3)}%</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-medium">+{s.maxReturn.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-right text-red-700 font-medium">{s.minReturn.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-right text-slate-800">{s.positiveDays}</td>
                  <td className="py-3 px-3 text-right text-slate-800">{s.negativeDays}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-800">
                    {s.positivePercentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Returns Timeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Daily Return (%) Time Series
            </h3>
            <p className="text-xs text-slate-500">
              Chronological daily percentage fluctuations
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
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

        {/* Return Distribution Histogram */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daily Return Frequency Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Histogram showing return dispersion and fat tails
              </p>
            </div>
            <select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="all">All Cryptocurrencies</option>
              {uniqueCryptos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: unknown) => [Number(val).toLocaleString(), 'Days Count']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Observations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
