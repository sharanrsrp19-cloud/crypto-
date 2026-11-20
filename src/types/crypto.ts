export interface CryptoRecord {
  id: string;
  date: string; // ISO YYYY-MM-DD
  cryptocurrency: string; // Symbol or Name e.g. BTC, ETH
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap: number;
  dailyReturn: number; // ((Close - Open) / Open) * 100
  dailyRange: number; // High - Low
  volatility: number; // ((High - Low) / Open) * 100
}

export interface ColumnMapping {
  date: string;
  cryptocurrency: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  marketCap: string;
}

export interface CleaningReport {
  totalRows: number;
  validRows: number;
  duplicateRowsRemoved: number;
  missingValuesFilledOrSkipped: number;
  invalidRowsSkipped: number;
  detectedCryptos: string[];
  startDate: string;
  endDate: string;
}

export interface DescriptiveStats {
  cryptocurrency: string;
  count: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDev: number;
  coefficientOfVariation: number; // (stdDev / mean) * 100
}

export interface ReturnStats {
  cryptocurrency: string;
  count: number;
  avgReturn: number;
  maxReturn: number;
  minReturn: number;
  stdDevReturn: number;
  positiveDays: number;
  negativeDays: number;
  neutralDays: number;
  positivePercentage: number;
}

export interface VolatilityStats {
  cryptocurrency: string;
  count: number;
  avgVolatility: number;
  maxVolatility: number;
  minVolatility: number;
  stdDevVolatility: number;
  avgDailyRange: number;
  annualizedVolatility: number; // stdDevVolatility * sqrt(365)
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: number[][];
}

export interface RegressionPoint {
  x: number;
  y: number;
  fitted: number;
  crypto?: string;
  date?: string;
}

export interface RegressionResult {
  xVarName: string;
  yVarName: string;
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  stdError: number;
  tStat: number;
  pValue: number;
  n: number;
  equation: string;
  points: RegressionPoint[];
  interpretation: string;
}

export interface ANOVAGroupStat {
  group: string;
  count: number;
  mean: number;
  variance: number;
  stdDev: number;
}

export interface ANOVAResult {
  metricName: string;
  groups: string[];
  dfBetween: number;
  dfWithin: number;
  dfTotal: number;
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  msBetween: number;
  msWithin: number;
  fStat: number;
  pValue: number;
  alpha: number;
  rejectNull: boolean;
  decision: string;
  explanation: string;
  groupStats: ANOVAGroupStat[];
}

export interface FilterState {
  selectedCryptos: string[];
  startDate: string;
  endDate: string;
  minPrice?: number;
  maxPrice?: number;
}

export type ActiveTab =
  | 'home'
  | 'dataset'
  | 'statistics'
  | 'returns'
  | 'volatility'
  | 'correlation'
  | 'regression'
  | 'hypothesis'
  | 'visualizations'
  | 'conclusion'
  | 'report';
