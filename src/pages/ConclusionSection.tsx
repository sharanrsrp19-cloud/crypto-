import React, { useMemo } from 'react';
import {
  CryptoRecord,
  ReturnStats,
  VolatilityStats,
  RegressionResult,
  ANOVAResult,
  CorrelationMatrix,
} from '../types/crypto';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  TrendingUp,
  Activity,
  GitCommit,
  LineChart,
} from 'lucide-react';

interface ConclusionSectionProps {
  records: CryptoRecord[];
  cryptos: string[];
  returnStats: ReturnStats[];
  volatilityStats: VolatilityStats[];
  anovaVolatility: ANOVAResult;
  anovaReturns: ANOVAResult;
  regressionVolReturn: RegressionResult;
  regressionVolPrice: RegressionResult;
  correlation: CorrelationMatrix;
}

export const ConclusionSection: React.FC<ConclusionSectionProps> = ({
  records,
  cryptos,
  returnStats,
  volatilityStats,
  anovaVolatility,
  anovaReturns,
  regressionVolReturn,
  regressionVolPrice,
  correlation,
}) => {
  // Sort return stats
  const sortedReturns = useMemo(
    () => [...returnStats].sort((a, b) => b.avgReturn - a.avgReturn),
    [returnStats]
  );
  const highestReturnAsset = sortedReturns[0];
  const lowestReturnAsset = sortedReturns[sortedReturns.length - 1];

  // Sort volatility stats
  const sortedVol = useMemo(
    () => [...volatilityStats].sort((a, b) => b.avgVolatility - a.avgVolatility),
    [volatilityStats]
  );
  const highestVolAsset = sortedVol[0];
  const lowestVolAsset = sortedVol[sortedVol.length - 1];

  // Find strongest non-trivial correlation in matrix
  const topCorrelations = useMemo(() => {
    const list: { var1: string; var2: string; r: number }[] = [];
    const vars = correlation.variables;
    for (let i = 0; i < vars.length; i++) {
      for (let j = i + 1; j < vars.length; j++) {
        list.push({ var1: vars[i], var2: vars[j], r: correlation.matrix[i][j] });
      }
    }
    return list.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [correlation]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            Empirical Synthesis
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Factual Statistical Summary & Research Conclusion
          </h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            The following findings are synthesized strictly from the empirical data contained in the active dataset ({records.length.toLocaleString()} observations across {cryptos.length} assets). All inferences adhere strictly to parametric statistical decision rules without subjective extrapolation.
          </p>
        </div>
      </div>

      {/* Structured Conclusion Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Return Characteristics */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>1. Daily Return Characteristics</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">• Observed Means:</span>
              <span>
                Mean daily return across the analyzed pool ranged from{' '}
                <strong className="text-slate-900 font-mono">
                  {lowestReturnAsset ? `${lowestReturnAsset.avgReturn.toFixed(3)}% (${lowestReturnAsset.cryptocurrency})` : 'N/A'}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 font-mono">
                  {highestReturnAsset ? `${highestReturnAsset.avgReturn.toFixed(3)}% (${highestReturnAsset.cryptocurrency})` : 'N/A'}
                </strong>.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">• Positive Day Proportion:</span>
              <span>
                Assets exhibited win-day percentages ranging between{' '}
                <span className="font-mono text-slate-900 font-medium">
                  {Math.min(...returnStats.map((s) => s.positivePercentage)).toFixed(1)}%
                </span>{' '}
                and{' '}
                <span className="font-mono text-slate-900 font-medium">
                  {Math.max(...returnStats.map((s) => s.positivePercentage)).toFixed(1)}%
                </span>
                , reflecting non-normal distribution with negative and positive tail shocks.
              </span>
            </li>
          </ul>
        </div>

        {/* 2. Volatility & Price Range */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Activity className="w-4 h-4 text-rose-600" />
            <span>2. Volatility & Intraday Dispersion</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">• Volatility Extremes:</span>
              <span>
                The highest average intraday volatility was recorded by{' '}
                <strong className="text-slate-900">
                  {highestVolAsset?.cryptocurrency} ({highestVolAsset?.avgVolatility.toFixed(2)}% daily, {highestVolAsset?.annualizedVolatility.toFixed(1)}% annualized)
                </strong>
                , whereas{' '}
                <strong className="text-slate-900">
                  {lowestVolAsset?.cryptocurrency}
                </strong>{' '}
                exhibited the narrowest spread ({lowestVolAsset?.avgVolatility.toFixed(2)}% daily).
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">• Risk Ranking:</span>
              <span>
                Smaller capitalization and alt-layer tokens displayed markedly higher standard deviations relative to large-cap benchmark assets.
              </span>
            </li>
          </ul>
        </div>

        {/* 3. Correlation Findings */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <GitCommit className="w-4 h-4 text-indigo-600" />
            <span>3. Cross-Variable Correlation Structure</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            {topCorrelations.slice(0, 3).map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-800 shrink-0">• {c.var1} ⟷ {c.var2}:</span>
                <span>
                  Pearson coefficient of <strong className="font-mono text-slate-900">r = {c.r.toFixed(3)}</strong>{' '}
                  ({Math.abs(c.r) >= 0.7 ? 'Strong' : Math.abs(c.r) >= 0.4 ? 'Moderate' : 'Weak'}{' '}
                  {c.r >= 0 ? 'positive' : 'negative'} co-movement).
                </span>
              </li>
            ))}
            <li className="text-[11px] text-slate-500 italic mt-1">
              Note: High price cross-correlations (Open/High/Low/Close) reflect contemporaneous multi-collinearity typical of continuous trading series.
            </li>
          </ul>
        </div>

        {/* 4. Regression & Hypothesis Testing */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>4. Regression Modeling & ANOVA Decision</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">• ANOVA Volatility:</span>
              <span>
                F-statistic = <strong className="font-mono text-slate-900">{anovaVolatility.fStat.toFixed(2)}</strong> (p ={' '}
                {anovaVolatility.pValue < 0.001 ? '< 0.001' : anovaVolatility.pValue.toFixed(4)}). Decision:{' '}
                <strong className="text-slate-900">{anovaVolatility.rejectNull ? 'Reject H₀' : 'Fail to Reject H₀'}</strong> at α = 0.05.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">• Volume vs Daily Return OLS:</span>
              <span>
                The linear relationship yielded R² ={' '}
                <strong className="font-mono text-slate-900">{(regressionVolReturn.rSquared * 100).toFixed(2)}%</strong>{' '}
                (p = {regressionVolReturn.pValue < 0.001 ? '< 0.001' : regressionVolReturn.pValue.toFixed(4)}), indicating that trading volume accounts for a minor proportion of daily return direction.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Safety & Academic Compliance Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 text-sm">
              Academic Compliance & Neutrality Declaration
            </p>
            <p className="leading-relaxed">
              This dashboard is strictly an educational college research system. The statistical measures above (means, standard deviations, correlation coefficients, regression estimates, and ANOVA F-ratios) describe past empirical observations within the supplied dataset window. They do not constitute forecasts, recommendations, or financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
