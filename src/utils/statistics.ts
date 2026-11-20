import {
  CryptoRecord,
  DescriptiveStats,
  ReturnStats,
  VolatilityStats,
  CorrelationMatrix,
  RegressionResult,
  ANOVAResult,
  ANOVAGroupStat,
} from '../types/crypto';

// -------------------------------------------------------------
// Core Mathematical & Statistical Utilities
// -------------------------------------------------------------

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function calculateMode(values: number[], decimals: number = 2): number[] {
  if (values.length === 0) return [];
  const freqMap = new Map<number, number>();
  let maxFreq = 0;

  for (const v of values) {
    const rounded = Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const count = (freqMap.get(rounded) || 0) + 1;
    freqMap.set(rounded, count);
    if (count > maxFreq) maxFreq = count;
  }

  if (maxFreq <= 1 && values.length > 3) {
    // If each value appears only once in continuous data, return median as representative mode
    return [calculateMedian(values)];
  }

  const modes: number[] = [];
  freqMap.forEach((freq, val) => {
    if (freq === maxFreq) modes.push(val);
  });
  return modes.slice(0, 3); // Return at most top 3 modes
}

export function calculateVariance(values: number[], sample: boolean = true): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const sumSquaredDiff = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const denominator = sample ? values.length - 1 : values.length;
  return sumSquaredDiff / denominator;
}

export function calculateStdDev(values: number[], sample: boolean = true): number {
  return Math.sqrt(calculateVariance(values, sample));
}

export function calculateCV(mean: number, stdDev: number): number {
  if (Math.abs(mean) < 1e-9) return 0;
  return (stdDev / Math.abs(mean)) * 100;
}

// -------------------------------------------------------------
// Descriptive Statistics per Cryptocurrency
// -------------------------------------------------------------

export function computeDescriptiveStats(
  records: CryptoRecord[],
  metric: keyof Pick<CryptoRecord, 'close' | 'open' | 'high' | 'low' | 'volume' | 'marketCap' | 'dailyReturn' | 'volatility'> = 'close'
): DescriptiveStats[] {
  const groups = new Map<string, number[]>();

  for (const r of records) {
    const list = groups.get(r.cryptocurrency) || [];
    list.push(r[metric] as number);
    groups.set(r.cryptocurrency, list);
  }

  const results: DescriptiveStats[] = [];

  groups.forEach((vals, crypto) => {
    if (vals.length === 0) return;
    const count = vals.length;
    const mean = calculateMean(vals);
    const median = calculateMedian(vals);
    const mode = calculateMode(vals);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min;
    const variance = calculateVariance(vals, true);
    const stdDev = calculateStdDev(vals, true);
    const coefficientOfVariation = calculateCV(mean, stdDev);

    results.push({
      cryptocurrency: crypto,
      count,
      mean: Math.round(mean * 1000) / 1000,
      median: Math.round(median * 1000) / 1000,
      mode,
      min: Math.round(min * 1000) / 1000,
      max: Math.round(max * 1000) / 1000,
      range: Math.round(range * 1000) / 1000,
      variance: Math.round(variance * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
    });
  });

  return results.sort((a, b) => a.cryptocurrency.localeCompare(b.cryptocurrency));
}

// -------------------------------------------------------------
// Daily Return Analysis
// -------------------------------------------------------------

export function computeReturnStats(records: CryptoRecord[]): ReturnStats[] {
  const groups = new Map<string, number[]>();

  for (const r of records) {
    const list = groups.get(r.cryptocurrency) || [];
    list.push(r.dailyReturn);
    groups.set(r.cryptocurrency, list);
  }

  const results: ReturnStats[] = [];

  groups.forEach((returns, crypto) => {
    if (returns.length === 0) return;
    const count = returns.length;
    const avgReturn = calculateMean(returns);
    const maxReturn = Math.max(...returns);
    const minReturn = Math.min(...returns);
    const stdDevReturn = calculateStdDev(returns, true);
    const positiveDays = returns.filter((r) => r > 0).length;
    const negativeDays = returns.filter((r) => r < 0).length;
    const neutralDays = returns.filter((r) => r === 0).length;
    const positivePercentage = count > 0 ? Math.round((positiveDays / count) * 10000) / 100 : 0;

    results.push({
      cryptocurrency: crypto,
      count,
      avgReturn: Math.round(avgReturn * 1000) / 1000,
      maxReturn: Math.round(maxReturn * 1000) / 1000,
      minReturn: Math.round(minReturn * 1000) / 1000,
      stdDevReturn: Math.round(stdDevReturn * 1000) / 1000,
      positiveDays,
      negativeDays,
      neutralDays,
      positivePercentage,
    });
  });

  return results.sort((a, b) => a.cryptocurrency.localeCompare(b.cryptocurrency));
}

// -------------------------------------------------------------
// Volatility Analysis
// -------------------------------------------------------------

export function computeVolatilityStats(records: CryptoRecord[]): VolatilityStats[] {
  const groups = new Map<string, { vol: number[]; range: number[] }>();

  for (const r of records) {
    const item = groups.get(r.cryptocurrency) || { vol: [], range: [] };
    item.vol.push(r.volatility);
    item.range.push(r.dailyRange);
    groups.set(r.cryptocurrency, item);
  }

  const results: VolatilityStats[] = [];

  groups.forEach(({ vol, range }, crypto) => {
    if (vol.length === 0) return;
    const count = vol.length;
    const avgVolatility = calculateMean(vol);
    const maxVolatility = Math.max(...vol);
    const minVolatility = Math.min(...vol);
    const stdDevVolatility = calculateStdDev(vol, true);
    const avgDailyRange = calculateMean(range);
    // Annualized volatility for 365 daily crypto trading days = daily std dev * sqrt(365)
    const annualizedVolatility = Math.round(stdDevVolatility * Math.sqrt(365) * 100) / 100;

    results.push({
      cryptocurrency: crypto,
      count,
      avgVolatility: Math.round(avgVolatility * 1000) / 1000,
      maxVolatility: Math.round(maxVolatility * 1000) / 1000,
      minVolatility: Math.round(minVolatility * 1000) / 1000,
      stdDevVolatility: Math.round(stdDevVolatility * 1000) / 1000,
      avgDailyRange: Math.round(avgDailyRange * 1000) / 1000,
      annualizedVolatility,
    });
  });

  return results.sort((a, b) => a.cryptocurrency.localeCompare(b.cryptocurrency));
}

// -------------------------------------------------------------
// Correlation Analysis (Pearson r)
// -------------------------------------------------------------

export function calculatePearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const meanX = calculateMean(x.slice(0, n));
  const meanY = calculateMean(y.slice(0, n));

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  const r = numerator / denominator;
  return Math.max(-1, Math.min(1, r));
}

export const CORRELATION_VARIABLES = [
  { key: 'open', label: 'Open Price' },
  { key: 'high', label: 'High Price' },
  { key: 'low', label: 'Low Price' },
  { key: 'close', label: 'Close Price' },
  { key: 'volume', label: 'Trading Volume' },
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'dailyReturn', label: 'Daily Return (%)' },
  { key: 'volatility', label: 'Volatility (%)' },
] as const;

export function computeCorrelationMatrix(records: CryptoRecord[]): CorrelationMatrix {
  const variables = CORRELATION_VARIABLES.map((v) => v.label);
  const dataArrays: number[][] = CORRELATION_VARIABLES.map((v) =>
    records.map((r) => Number(r[v.key as keyof CryptoRecord]) || 0)
  );

  const matrix: number[][] = [];

  for (let i = 0; i < variables.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < variables.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const r = calculatePearson(dataArrays[i], dataArrays[j]);
        matrix[i][j] = Math.round(r * 1000) / 1000;
      }
    }
  }

  return { variables, matrix };
}

// -------------------------------------------------------------
// Linear Regression Analysis
// -------------------------------------------------------------

export function computeLinearRegression(
  records: CryptoRecord[],
  xKey: keyof CryptoRecord,
  yKey: keyof CryptoRecord,
  xLabel: string,
  yLabel: string
): RegressionResult {
  const points: { x: number; y: number; crypto: string; date: string }[] = [];

  for (const r of records) {
    const xVal = Number(r[xKey]);
    const yVal = Number(r[yKey]);
    if (!isNaN(xVal) && !isNaN(yVal)) {
      points.push({ x: xVal, y: yVal, crypto: r.cryptocurrency, date: r.date });
    }
  }

  const n = points.length;
  if (n < 2) {
    return {
      xVarName: xLabel,
      yVarName: yLabel,
      slope: 0,
      intercept: 0,
      r: 0,
      rSquared: 0,
      stdError: 0,
      tStat: 0,
      pValue: 1,
      n,
      equation: 'y = 0',
      points: [],
      interpretation: 'Insufficient observations for linear regression estimation.',
    };
  }

  const xVals = points.map((p) => p.x);
  const yVals = points.map((p) => p.y);
  const meanX = calculateMean(xVals);
  const meanY = calculateMean(yVals);

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - meanX;
    const dy = yVals[i] - meanY;
    ssXX += dx * dx;
    ssYY += dy * dy;
    ssXY += dx * dy;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const r = (Math.sqrt(ssXX * ssYY) === 0) ? 0 : ssXY / Math.sqrt(ssXX * ssYY);
  const rSquared = Math.max(0, Math.min(1, r * r));

  // Residual sum of squares & Standard Error of estimate
  let ssResidual = 0;
  const regressionPoints = points.map((p) => {
    const fitted = intercept + slope * p.x;
    ssResidual += Math.pow(p.y - fitted, 2);
    return {
      x: p.x,
      y: p.y,
      fitted: Math.round(fitted * 1000) / 1000,
      crypto: p.crypto,
      date: p.date,
    };
  });

  const df = n - 2;
  const stdError = df > 0 && ssXX > 0 ? Math.sqrt(ssResidual / df) / Math.sqrt(ssXX) : 0;
  const tStat = stdError > 0 ? slope / stdError : 0;
  const pValue = df > 0 ? approximateTwoTailedPValue(Math.abs(tStat), df) : 1;

  // Format equation
  const sign = intercept >= 0 ? '+' : '-';
  const slopeFormatted = Math.abs(slope) < 0.0001 ? slope.toExponential(3) : slope.toFixed(4);
  const interceptFormatted = Math.abs(intercept) < 0.0001 ? Math.abs(intercept).toExponential(3) : Math.abs(intercept).toFixed(4);
  const equation = `ŷ = ${slopeFormatted}x ${sign} ${interceptFormatted}`;

  // Academic interpretation
  let strength = 'negligible';
  const absR = Math.abs(r);
  if (absR >= 0.7) strength = 'strong';
  else if (absR >= 0.4) strength = 'moderate';
  else if (absR >= 0.2) strength = 'weak';

  const direction = r >= 0 ? 'positive' : 'negative';
  const sigText = pValue < 0.05 ? 'statistically significant (p < 0.05)' : 'not statistically significant (p ≥ 0.05)';

  const interpretation = `The fitted model demonstrates a ${strength} ${direction} empirical relationship (r = ${r.toFixed(
    3
  )}, R² = ${(rSquared * 100).toFixed(2)}%), which is ${sigText}. Exactly ${(rSquared * 100).toFixed(
    1
  )}% of the variance in ${yLabel} is statistically explained by ${xLabel}. Note that regression indicates empirical association rather than direct causation.`;

  return {
    xVarName: xLabel,
    yVarName: yLabel,
    slope: Math.round(slope * 1000000) / 1000000,
    intercept: Math.round(intercept * 100000) / 100000,
    r: Math.round(r * 1000) / 1000,
    rSquared: Math.round(rSquared * 10000) / 10000,
    stdError: Math.round(stdError * 100000) / 100000,
    tStat: Math.round(tStat * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    n,
    equation,
    points: regressionPoints,
    interpretation,
  };
}

// -------------------------------------------------------------
// Hypothesis Testing (One-Way ANOVA)
// -------------------------------------------------------------

export function computeOneWayANOVA(
  records: CryptoRecord[],
  metricKey: keyof Pick<CryptoRecord, 'volatility' | 'dailyReturn' | 'dailyRange'>,
  metricLabel: string,
  alpha: number = 0.05
): ANOVAResult {
  const groupsMap = new Map<string, number[]>();

  for (const r of records) {
    const list = groupsMap.get(r.cryptocurrency) || [];
    list.push(Number(r[metricKey]) || 0);
    groupsMap.set(r.cryptocurrency, list);
  }

  const groupKeys = Array.from(groupsMap.keys());
  const k = groupKeys.length;
  let totalN = 0;
  let grandSum = 0;

  const groupStats: ANOVAGroupStat[] = [];

  groupKeys.forEach((crypto) => {
    const vals = groupsMap.get(crypto)!;
    const count = vals.length;
    totalN += count;
    const mean = calculateMean(vals);
    const variance = calculateVariance(vals, true);
    const stdDev = Math.sqrt(variance);
    grandSum += vals.reduce((a, b) => a + b, 0);

    groupStats.push({
      group: crypto,
      count,
      mean: Math.round(mean * 1000) / 1000,
      variance: Math.round(variance * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
    });
  });

  const grandMean = totalN > 0 ? grandSum / totalN : 0;

  if (k < 2 || totalN <= k) {
    return {
      metricName: metricLabel,
      groups: groupKeys,
      dfBetween: 0,
      dfWithin: 0,
      dfTotal: 0,
      ssBetween: 0,
      ssWithin: 0,
      ssTotal: 0,
      msBetween: 0,
      msWithin: 0,
      fStat: 0,
      pValue: 1,
      alpha,
      rejectNull: false,
      decision: 'Insufficient groups or data points to conduct One-Way ANOVA.',
      explanation: 'At least two distinct cryptocurrency groups with multiple observations each are required.',
      groupStats,
    };
  }

  // Sum of Squares Between (SSB)
  let ssBetween = 0;
  groupStats.forEach((g) => {
    ssBetween += g.count * Math.pow(g.mean - grandMean, 2);
  });

  // Sum of Squares Within (SSW)
  let ssWithin = 0;
  groupsMap.forEach((vals, crypto) => {
    const stat = groupStats.find((s) => s.group === crypto);
    const m = stat ? stat.mean : calculateMean(vals);
    for (const v of vals) {
      ssWithin += Math.pow(v - m, 2);
    }
  });

  const ssTotal = ssBetween + ssWithin;
  const dfBetween = k - 1;
  const dfWithin = totalN - k;
  const dfTotal = totalN - 1;

  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const fStat = msWithin > 0 ? msBetween / msWithin : 0;
  const pValue = calculateFDistributionPValue(fStat, dfBetween, dfWithin);

  const rejectNull = pValue < alpha;
  const decision = rejectNull
    ? `Reject Null Hypothesis (H₀) at significance level α = ${alpha}`
    : `Fail to Reject Null Hypothesis (H₀) at significance level α = ${alpha}`;

  const explanation = rejectNull
    ? `The calculated F-statistic of ${fStat.toFixed(3)} corresponds to an empirical p-value of ${
        pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)
      }. Because p < ${alpha}, we reject H₀ and conclude there is a statistically significant difference in ${metricLabel.toLowerCase()} among the observed cryptocurrencies.`
    : `The calculated F-statistic of ${fStat.toFixed(3)} yields a p-value of ${pValue.toFixed(
        4
      )}. Because p ≥ ${alpha}, we fail to reject H₀; the observed differences in ${metricLabel.toLowerCase()} among the cryptocurrencies do not reach statistical significance at the ${
        (1 - alpha) * 100
      }% confidence level.`;

  return {
    metricName: metricLabel,
    groups: groupKeys,
    dfBetween,
    dfWithin,
    dfTotal,
    ssBetween: Math.round(ssBetween * 1000) / 1000,
    ssWithin: Math.round(ssWithin * 1000) / 1000,
    ssTotal: Math.round(ssTotal * 1000) / 1000,
    msBetween: Math.round(msBetween * 1000) / 1000,
    msWithin: Math.round(msWithin * 1000) / 1000,
    fStat: Math.round(fStat * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    alpha,
    rejectNull,
    decision,
    explanation,
    groupStats,
  };
}

// -------------------------------------------------------------
// Statistical Distribution Approximations (t and F distributions)
// -------------------------------------------------------------

// Accurate two-tailed p-value approximation for Student's t distribution
function approximateTwoTailedPValue(t: number, df: number): number {
  if (df <= 0) return 1;
  const x = df / (df + t * t);
  const p = regularizedIncompleteBeta(df / 2, 0.5, x);
  return Math.max(0, Math.min(1, p));
}

// Accurate p-value for F distribution: P(F > f) = 1 - I_x(df1/2, df2/2) where x = (df1*f) / (df1*f + df2)
export function calculateFDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const x = (df1 * f) / (df1 * f + df2);
  const cdf = regularizedIncompleteBeta(df1 / 2, df2 / 2, x);
  return Math.max(0, Math.min(1, 1 - cdf));
}

// Continued fraction approximation for regularized incomplete beta function I_x(a, b)
function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Symmetry transformation
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(b, a, 1 - x);
  }

  // Pre-factor ln(Beta(a, b))
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const factor = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) / a;

  // Continued fraction (Modified Lentz's method)
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  const maxIter = 100;
  const eps = 1e-12;

  for (let m = 1; m <= maxIter; m++) {
    // Even step: 2m
    const a2m = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + a2m * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + a2m / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    // Odd step: 2m + 1
    const a2m1 = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + a2m1 * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + a2m1 / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < eps) break;
  }

  return factor * h;
}

// Lanczos approximation for log Gamma function
function logGamma(z: number): number {
  const c = [
    57.1562356658629235,
    -59.5979603554754912,
    14.1360979747417471,
    -0.491913816097620199,
    0.339946499848118887e-4,
    0.465236289270485756e-4,
    -0.983744753048795646e-4,
    0.158088703224377949e-3,
    -0.210264441724104883e-3,
    0.217439618115212643e-3,
    -0.16431810653676389e-3,
    0.844182239838527433e-4,
    -0.261908384015814087e-4,
    0.368991826595316234e-5,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let base = 0.99999999999999709182;
  for (let i = 0; i < c.length; i++) {
    base += c[i] / (z + i + 1);
  }

  const t = z + c.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(base);
}
