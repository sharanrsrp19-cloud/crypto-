import React, { useState, useMemo } from 'react';
import { CryptoRecord } from '../types/crypto';
import { exportChartElementAsPng } from '../utils/exportUtils';
import {
  Download,
  LineChart as LineChartIcon,
  BarChart2,
  ScatterChart as ScatterIcon,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceLine,
} from 'recharts';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';

interface VisualizationSectionProps {
  records: CryptoRecord[];
  onNotify?: (message: string) => void;
}

type ChartCategory =
  | 'close_price'
  | 'open_close'
  | 'high_low'
  | 'daily_return'
  | 'volatility'
  | 'volume'
  | 'market_cap'
  | 'comparison_bar'
  | 'price_volume'
  | 'risk_return';

const CHART_TABS: {
  id: ChartCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'close_price',
    label: '1. Close Price Series',
    description: 'Daily closing price trend over time. Drag the bottom slider bar to zoom into any date range.',
    icon: LineChartIcon,
  },
  {
    id: 'open_close',
    label: '2. Open vs Close',
    description: 'Compares each day’s opening price against its closing price for a single coin to spot upward or downward closes.',
    icon: Layers,
  },
  {
    id: 'high_low',
    label: '3. High vs Low Spread',
    description: 'Shows the daily ceiling (High) and floor (Low) prices for a single coin—wider gaps mean larger intraday price swings.',
    icon: Activity,
  },
  {
    id: 'daily_return',
    label: '4. Daily Return (%)',
    description: 'Day-to-day percentage gains (above 0%) and losses (below 0%) across your selected coins.',
    icon: TrendingUp,
  },
  {
    id: 'volatility',
    label: '5. Volatility (%)',
    description: 'Intraday price swing percentage ((High - Low) / Open × 100). Spikes highlight turbulent trading days.',
    icon: Activity,
  },
  {
    id: 'volume',
    label: '6. Trading Volume',
    description: 'Total dollar value traded each day, showing bursts of market activity.',
    icon: BarChart2,
  },
  {
    id: 'market_cap',
    label: '7. Market Cap',
    description: 'Total market valuation trajectory over time for each cryptocurrency.',
    icon: BarChart2,
  },
  {
    id: 'comparison_bar',
    label: '8. Asset Comparison Bar',
    description: 'Side-by-side comparison of average daily volatility (%) and average daily return (%) per coin.',
    icon: BarChart2,
  },
  {
    id: 'price_volume',
    label: '9. Price vs Volume Scatter',
    description: 'Tests visually whether higher prices correspond to higher trading volumes.',
    icon: ScatterIcon,
  },
  {
    id: 'risk_return',
    label: '10. Risk vs Return Quadrant',
    description: 'Plots Risk (mean volatility %) on the horizontal axis against Reward (mean return %) on the vertical axis.',
    icon: ScatterIcon,
  },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

export const VisualizationSection: React.FC<VisualizationSectionProps> = ({ records, onNotify }) => {
  const [activeChart, setActiveChart] = useState<ChartCategory>('close_price');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('all');

  const uniqueCryptos = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.cryptocurrency))).sort();
  }, [records]);

  // For single-asset OHLC charts (Open vs Close, High vs Low), fall back cleanly to the first coin when 'all' is selected
  const isSingleAssetChart = activeChart === 'open_close' || activeChart === 'high_low';
  const effectiveSingleCrypto =
    selectedCrypto !== 'all' && uniqueCryptos.includes(selectedCrypto)
      ? selectedCrypto
      : uniqueCryptos[0] || '';

  const targetRecords = useMemo(() => {
    if (isSingleAssetChart) {
      return records.filter((r) => r.cryptocurrency === effectiveSingleCrypto);
    }
    if (selectedCrypto === 'all') return records;
    return records.filter((r) => r.cryptocurrency === selectedCrypto);
  }, [records, selectedCrypto, isSingleAssetChart, effectiveSingleCrypto]);

  // Time-series pivot data by date
  const timeSeriesData = useMemo(() => {
    const dates = Array.from(new Set(targetRecords.map((r) => r.date))).sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      const dayRecords = targetRecords.filter((r) => r.date === date);

      dayRecords.forEach((r) => {
        row[`close_${r.cryptocurrency}`] = r.close;
        row[`open_${r.cryptocurrency}`] = r.open;
        row[`high_${r.cryptocurrency}`] = r.high;
        row[`low_${r.cryptocurrency}`] = r.low;
        row[`return_${r.cryptocurrency}`] = r.dailyReturn;
        row[`vol_${r.cryptocurrency}`] = r.volatility;
        row[`volume_${r.cryptocurrency}`] = r.volume;
        row[`mcap_${r.cryptocurrency}`] = r.marketCap;

        if (isSingleAssetChart || selectedCrypto !== 'all') {
          row.close = r.close;
          row.open = r.open;
          row.high = r.high;
          row.low = r.low;
          row.dailyReturn = r.dailyReturn;
          row.volatility = r.volatility;
          row.volume = r.volume;
          row.marketCap = r.marketCap;
        }
      });
      return row;
    });
  }, [targetRecords, selectedCrypto, isSingleAssetChart]);

  // Comparison Bar Data
  const comparisonBarData = useMemo(() => {
    return uniqueCryptos.map((crypto) => {
      const assetRecords = records.filter((r) => r.cryptocurrency === crypto);
      const meanReturn =
        assetRecords.length > 0
          ? assetRecords.reduce((sum, r) => sum + r.dailyReturn, 0) / assetRecords.length
          : 0;
      const meanVol =
        assetRecords.length > 0
          ? assetRecords.reduce((sum, r) => sum + r.volatility, 0) / assetRecords.length
          : 0;

      return {
        crypto: crypto.split(' ')[0],
        fullName: crypto,
        meanReturn: Math.round(meanReturn * 1000) / 1000,
        meanVol: Math.round(meanVol * 1000) / 1000,
      };
    });
  }, [records, uniqueCryptos]);

  // Risk vs Return Quadrant Data
  const riskReturnData = useMemo(() => {
    return uniqueCryptos.map((crypto) => {
      const assetRecords = records.filter((r) => r.cryptocurrency === crypto);
      const meanReturn =
        assetRecords.length > 0
          ? assetRecords.reduce((sum, r) => sum + r.dailyReturn, 0) / assetRecords.length
          : 0;
      const meanVol =
        assetRecords.length > 0
          ? assetRecords.reduce((sum, r) => sum + r.volatility, 0) / assetRecords.length
          : 0;

      return {
        crypto,
        risk: Math.round(meanVol * 100) / 100,
        return: Math.round(meanReturn * 1000) / 1000,
      };
    });
  }, [records, uniqueCryptos]);

  // Price vs Volume Scatter Data
  const priceVolumeData = useMemo(() => {
    return targetRecords.map((r) => ({
      price: r.close,
      volume: r.volume,
      crypto: r.cryptocurrency,
      date: r.date,
    }));
  }, [targetRecords]);

  const handleExportPng = () => {
    exportChartElementAsPng('main-chart-container', `crypto_analysis_${activeChart}.png`, (_ok, msg) => {
      onNotify?.(msg);
    });
  };

  const currentTabMeta = CHART_TABS.find((t) => t.id === activeChart)!;

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="How to explore these charts"
        summary="Pick any of the 10 charts below to visualize price trends, daily returns, volatility spikes, trading volume, or risk vs. return trade-offs. Use the asset dropdown to isolate one coin, or drag the bottom zoom bar on time-series charts to zoom in on specific weeks."
      />

      {/* Top Banner & Chart Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Interactive Visualizations Gallery
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              10 interactive statistical charts with zoom sliders, hover tooltips, and one-click PNG export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter chart by cryptocurrency"
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="all">All Cryptocurrencies</option>
              {uniqueCryptos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportPng}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons for 10 Charts */}
        <div className="mt-5 flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-lg">
          {CHART_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeChart === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {currentTabMeta.label}
              {isSingleAssetChart && effectiveSingleCrypto ? ` — ${effectiveSingleCrypto}` : ''}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentTabMeta.description}
              {isSingleAssetChart && selectedCrypto === 'all' && effectiveSingleCrypto
                ? ` (Showing ${effectiveSingleCrypto}; choose another coin in the dropdown above to switch.)`
                : ''}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono shrink-0">
            {targetRecords.length.toLocaleString()} points
          </span>
        </div>

        <div id="main-chart-container" className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* 1. Close Price Line Chart */}
            {activeChart === 'close_price' && (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Close']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {selectedCrypto === 'all' ? (
                  uniqueCryptos.map((c, i) => (
                    <Line
                      key={c}
                      type="monotone"
                      dataKey={`close_${c}`}
                      name={c}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      strokeWidth={1.5}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey="close"
                    name={selectedCrypto}
                    stroke="#2563eb"
                    dot={false}
                    strokeWidth={2}
                  />
                )}
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </LineChart>
            )}

            {/* 2. Open vs Close Price Chart */}
            {activeChart === 'open_close' && (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="open" name="Open Price ($)" stroke="#94a3b8" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="close" name="Close Price ($)" stroke="#2563eb" dot={false} strokeWidth={2} />
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </LineChart>
            )}

            {/* 3. High vs Low Price Spread Chart */}
            {activeChart === 'high_low' && (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="high" name="High Price ($)" stroke="#10b981" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="low" name="Low Price ($)" stroke="#ef4444" dot={false} strokeWidth={1.5} />
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </LineChart>
            )}

            {/* 4. Daily Return Chart */}
            {activeChart === 'daily_return' && (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`, 'Daily Return']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {selectedCrypto === 'all' ? (
                  uniqueCryptos.map((c, i) => (
                    <Line
                      key={c}
                      type="monotone"
                      dataKey={`return_${c}`}
                      name={c}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      strokeWidth={1.5}
                    />
                  ))
                ) : (
                  <Line type="monotone" dataKey="dailyReturn" name={selectedCrypto} stroke="#10b981" dot={false} strokeWidth={2} />
                )}
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </LineChart>
            )}

            {/* 5. Volatility Chart */}
            {activeChart === 'volatility' && (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`, 'Volatility']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {selectedCrypto === 'all' ? (
                  uniqueCryptos.map((c, i) => (
                    <Line
                      key={c}
                      type="monotone"
                      dataKey={`vol_${c}`}
                      name={c}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      strokeWidth={1.5}
                    />
                  ))
                ) : (
                  <Line type="monotone" dataKey="volatility" name={selectedCrypto} stroke="#f43f5e" dot={false} strokeWidth={2} />
                )}
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </LineChart>
            )}

            {/* 6. Trading Volume Chart */}
            {activeChart === 'volume' && (
              <BarChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val: number) => `$${(val / 1e9).toFixed(1)}B`} />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Volume']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {selectedCrypto === 'all' ? (
                  uniqueCryptos.map((c, i) => (
                    <Bar
                      key={c}
                      dataKey={`volume_${c}`}
                      name={c}
                      stackId="vol"
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))
                ) : (
                  <Bar dataKey="volume" fill="#6366f1" radius={[2, 2, 0, 0]} name={selectedCrypto} />
                )}
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </BarChart>
            )}

            {/* 7. Market Cap Chart */}
            {activeChart === 'market_cap' && (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val: number) => `$${(val / 1e9).toFixed(0)}B`} />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Market Cap']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {selectedCrypto === 'all' ? (
                  uniqueCryptos.map((c, i) => (
                    <Line
                      key={c}
                      type="monotone"
                      dataKey={`mcap_${c}`}
                      name={c}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      strokeWidth={1.75}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey="marketCap"
                    stroke="#0ea5e9"
                    dot={false}
                    strokeWidth={2}
                    name={selectedCrypto}
                  />
                )}
                <Brush dataKey="date" height={22} stroke="#94a3b8" />
              </LineChart>
            )}

            {/* 8. Cryptocurrency Comparison Bar Chart */}
            {activeChart === 'comparison_bar' && (
              <BarChart data={comparisonBarData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="crypto" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="meanVol" fill="#f43f5e" name="Mean Volatility (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="meanReturn" fill="#10b981" name="Mean Return (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}

            {/* 9. Price vs Volume Scatter Plot */}
            {activeChart === 'price_volume' && (
              <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="price"
                  name="Price ($)"
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                  label={{ value: 'Close Price ($)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  dataKey="volume"
                  name="Volume ($)"
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v: number) => `$${(v / 1e9).toFixed(1)}B`}
                  domain={['auto', 'auto']}
                  label={{ value: 'Trading Volume ($)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-slate-200 rounded text-xs">
                        <div className="font-semibold">{d.crypto} ({d.date})</div>
                        <div>Price: ${Number(d.price).toLocaleString()}</div>
                        <div>Volume: ${Number(d.volume).toLocaleString()}</div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Price vs Volume" data={priceVolumeData} fill="#3b82f6" opacity={0.6} />
              </ScatterChart>
            )}

            {/* 10. Risk vs Return Scatter Quadrant */}
            {activeChart === 'risk_return' && (
              <ScatterChart margin={{ top: 20, right: 20, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="risk"
                  name="Mean Daily Volatility (%) [Risk]"
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                  unit="%"
                  label={{ value: 'Risk: Mean Daily Volatility (%)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  dataKey="return"
                  name="Mean Daily Return (%) [Reward]"
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                  unit="%"
                  label={{ value: 'Mean Daily Return (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#475569' }}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-2.5 border border-slate-200 rounded text-xs shadow-xs">
                        <div className="font-bold text-slate-900">{d.crypto}</div>
                        <div>Risk (Mean Volatility): <strong className="font-mono">{d.risk}%</strong></div>
                        <div>Reward (Mean Return): <strong className="font-mono">{d.return}%</strong></div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Assets" data={riskReturnData} fill="#8b5cf6">
                  {riskReturnData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
