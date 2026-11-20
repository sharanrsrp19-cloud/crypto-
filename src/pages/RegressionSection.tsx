import React, { useState, useMemo } from 'react';
import { CryptoRecord, RegressionResult } from '../types/crypto';
import { computeLinearRegression } from '../utils/statistics';
import { LineChart, Calculator, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface RegressionSectionProps {
  records: CryptoRecord[];
}

type ModelPreset = 'vol_vs_return' | 'vol_vs_close' | 'volatility_vs_return' | 'custom';

export const RegressionSection: React.FC<RegressionSectionProps> = ({ records }) => {
  const [modelPreset, setModelPreset] = useState<ModelPreset>('vol_vs_return');
  const [customX, setCustomX] = useState<keyof CryptoRecord>('volume');
  const [customY, setCustomY] = useState<keyof CryptoRecord>('dailyReturn');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('all');

  const uniqueCryptos = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.cryptocurrency))).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedCrypto === 'all') return records;
    return records.filter((r) => r.cryptocurrency === selectedCrypto);
  }, [records, selectedCrypto]);

  // Compute active regression configuration
  const regressionResult = useMemo((): RegressionResult => {
    if (modelPreset === 'vol_vs_return') {
      return computeLinearRegression(
        filteredRecords,
        'volume',
        'dailyReturn',
        'Trading Volume ($)',
        'Daily Return (%)'
      );
    } else if (modelPreset === 'vol_vs_close') {
      return computeLinearRegression(
        filteredRecords,
        'volume',
        'close',
        'Trading Volume ($)',
        'Close Price ($)'
      );
    } else if (modelPreset === 'volatility_vs_return') {
      return computeLinearRegression(
        filteredRecords,
        'volatility',
        'dailyReturn',
        'Volatility (%)',
        'Daily Return (%)'
      );
    } else {
      const xLabel = String(customX);
      const yLabel = String(customY);
      return computeLinearRegression(filteredRecords, customX, customY, xLabel, yLabel);
    }
  }, [filteredRecords, modelPreset, customX, customY]);

  // Scatter plot data with trend line endpoints
  const scatterData = useMemo(() => {
    return regressionResult.points.map((p) => ({
      x: p.x,
      y: p.y,
      fitted: p.fitted,
      crypto: p.crypto,
      date: p.date,
    }));
  }, [regressionResult]);

  // Two endpoints for the regression line across X range
  const regressionLineData = useMemo(() => {
    if (scatterData.length < 2) return [];
    const xVals = scatterData.map((d) => d.x);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);

    return [
      { x: minX, fitted: regressionResult.intercept + regressionResult.slope * minX },
      { x: maxX, fitted: regressionResult.intercept + regressionResult.slope * maxX },
    ];
  }, [scatterData, regressionResult]);

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="What Linear Regression tests"
        summary="Linear regression fits the best straight line (red line) through the data points to test whether one metric (X) helps explain another metric (Y)."
        tips={[
          'Look at R² (%) to see how much of Y is explained by X (closer to 100% = tighter fit; near 0% = scattered points).',
          'Look at p-Value: if p < 0.05, the slope of the line is statistically significant rather than random noise.',
        ]}
      />

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Ordinary Least Squares (OLS) Linear Regression Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Estimating bivariate parametric relationship: <code>ŷ = β₀ + β₁x</code> and evaluating statistical significance.
            </p>
          </div>

          {/* Crypto Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Asset:</span>
            <select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="all">Pooled (All Cryptos)</option>
              {uniqueCryptos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Model Presets */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => setModelPreset('vol_vs_return')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              modelPreset === 'vol_vs_return'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A. Volume vs Daily Return
          </button>
          <button
            onClick={() => setModelPreset('vol_vs_close')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              modelPreset === 'vol_vs_close'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            B. Volume vs Close Price
          </button>
          <button
            onClick={() => setModelPreset('volatility_vs_return')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              modelPreset === 'volatility_vs_return'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            C. Volatility vs Daily Return
          </button>
          <button
            onClick={() => setModelPreset('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              modelPreset === 'custom'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Variables
          </button>
        </div>

        {/* Custom Variable Pickers */}
        {modelPreset === 'custom' && (
          <div className="mt-3 flex items-center gap-4 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Predictor (X):</span>
              <select
                value={customX}
                onChange={(e) => setCustomX(e.target.value as keyof CryptoRecord)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
              >
                <option value="volume">Trading Volume</option>
                <option value="close">Close Price</option>
                <option value="volatility">Volatility (%)</option>
                <option value="dailyRange">Daily Range</option>
                <option value="marketCap">Market Capitalization</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Response (Y):</span>
              <select
                value={customY}
                onChange={(e) => setCustomY(e.target.value as keyof CryptoRecord)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
              >
                <option value="dailyReturn">Daily Return (%)</option>
                <option value="close">Close Price</option>
                <option value="volatility">Volatility (%)</option>
                <option value="volume">Trading Volume</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Regression Statistical Metrics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            Regression Equation
          </span>
          <p className="font-mono font-bold text-slate-900 text-[11px] truncate" title={regressionResult.equation}>
            {regressionResult.equation}
          </p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            R² (Determination)
          </span>
          <p className="font-mono font-bold text-base text-emerald-800">
            {(regressionResult.rSquared * 100).toFixed(2)}%
          </p>
          <span className="text-[10px] text-slate-400">r² = {regressionResult.rSquared.toFixed(4)}</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            Correlation (r)
          </span>
          <p className="font-mono font-bold text-base text-slate-900">
            {regressionResult.r.toFixed(3)}
          </p>
          <span className="text-[10px] text-slate-400">Pearson coefficient</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            Slope (β₁)
          </span>
          <p className="font-mono font-bold text-slate-900 text-sm">
            {regressionResult.slope}
          </p>
          <span className="text-[10px] text-slate-400">Std Err: {regressionResult.stdError}</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            t-Statistic (df = {regressionResult.n - 2})
          </span>
          <p className="font-mono font-bold text-base text-slate-900">
            {regressionResult.tStat.toFixed(2)}
          </p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded text-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            p-Value (Slope)
          </span>
          <p className={`font-mono font-bold text-base ${regressionResult.pValue < 0.05 ? 'text-emerald-700' : 'text-slate-800'}`}>
            {regressionResult.pValue < 0.001 ? '< 0.001' : regressionResult.pValue.toFixed(4)}
          </p>
          <span className="text-[10px] text-slate-400">
            {regressionResult.pValue < 0.05 ? 'Significant (α=0.05)' : 'Not Significant'}
          </span>
        </div>
      </div>

      {/* Regression Scatter Plot with Fitted Line */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Fitted Regression Line & Empirical Scatter Plot
            </h2>
            <p className="text-xs text-slate-500">
              Y: {regressionResult.yVarName} vs X: {regressionResult.xVarName} (N = {regressionResult.n} pairs)
            </p>
          </div>
          <div className="font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            {regressionResult.equation} | R² = {(regressionResult.rSquared * 100).toFixed(2)}%
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="x"
                name={regressionResult.xVarName}
                type="number"
                tick={{ fontSize: 10, fill: '#64748b' }}
                domain={['auto', 'auto']}
              />
              <YAxis
                dataKey="y"
                name={regressionResult.yVarName}
                type="number"
                tick={{ fontSize: 10, fill: '#64748b' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2.5 border border-slate-200 rounded shadow-xs text-xs space-y-1">
                      <div className="font-semibold text-slate-900">{data.crypto || 'Asset'} ({data.date})</div>
                      <div>X ({regressionResult.xVarName}): <strong className="font-mono">{Number(data.x).toLocaleString()}</strong></div>
                      <div>Y ({regressionResult.yVarName}): <strong className="font-mono">{Number(data.y).toLocaleString()}</strong></div>
                      <div>Fitted (ŷ): <strong className="font-mono">{Number(data.fitted).toLocaleString()}</strong></div>
                    </div>
                  );
                }}
              />
              <Scatter
                name="Observations"
                data={scatterData}
                fill="#3b82f6"
                opacity={0.6}
              />
              <Line
                data={regressionLineData}
                dataKey="fitted"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                name="Fitted OLS Line"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Academic Statistical Interpretation Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>Factual Academic Interpretation</span>
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          {regressionResult.interpretation}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Safety & Accuracy Notice:</strong> Regression coefficients denote observed mathematical slope in the sample, not causative efficacy or predictive investment advice.
          </span>
        </div>
      </div>
    </div>
  );
};
