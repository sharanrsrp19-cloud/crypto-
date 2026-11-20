import { CryptoRecord, DescriptiveStats, ReturnStats, VolatilityStats, RegressionResult, ANOVAResult } from '../types/crypto';

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDatasetCsv(records: CryptoRecord[], filename = 'cleaned_cryptocurrency_dataset.csv'): void {
  const headers = [
    'Date',
    'Cryptocurrency',
    'Open Price',
    'High Price',
    'Low Price',
    'Close Price',
    'Trading Volume',
    'Market Capitalization',
    'Daily Return (%)',
    'Daily Range',
    'Volatility (%)',
  ];

  const rows = records.map((r) => [
    r.date,
    `"${r.cryptocurrency}"`,
    r.open,
    r.high,
    r.low,
    r.close,
    r.volume,
    r.marketCap,
    r.dailyReturn,
    r.dailyRange,
    r.volatility,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadCsv(filename, csv);
}

export function exportDescriptiveStatsCsv(stats: DescriptiveStats[], metricName: string): void {
  const headers = [
    'Cryptocurrency',
    'Sample Size (N)',
    `Mean ${metricName}`,
    `Median ${metricName}`,
    `Mode ${metricName}`,
    `Minimum ${metricName}`,
    `Maximum ${metricName}`,
    `Range ${metricName}`,
    'Sample Variance',
    'Sample Standard Deviation',
    'Coefficient of Variation (CV %)',
  ];

  const rows = stats.map((s) => [
    `"${s.cryptocurrency}"`,
    s.count,
    s.mean,
    s.median,
    `"${s.mode.join('; ')}"`,
    s.min,
    s.max,
    s.range,
    s.variance,
    s.stdDev,
    s.coefficientOfVariation,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadCsv(`descriptive_statistics_${metricName.toLowerCase().replace(/\s+/g, '_')}.csv`, csv);
}

export function exportReturnsCsv(stats: ReturnStats[]): void {
  const headers = [
    'Cryptocurrency',
    'Trading Days',
    'Mean Daily Return (%)',
    'Max Return (%)',
    'Min Return (%)',
    'Std Dev of Returns',
    'Positive Days',
    'Negative Days',
    'Neutral Days',
    'Win Ratio (% Positive)',
  ];

  const rows = stats.map((s) => [
    `"${s.cryptocurrency}"`,
    s.count,
    s.avgReturn,
    s.maxReturn,
    s.minReturn,
    s.stdDevReturn,
    s.positiveDays,
    s.negativeDays,
    s.neutralDays,
    s.positivePercentage,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadCsv('cryptocurrency_daily_returns_analysis.csv', csv);
}

export function exportVolatilityCsv(stats: VolatilityStats[]): void {
  const headers = [
    'Cryptocurrency',
    'Observations',
    'Mean Daily Volatility (%)',
    'Max Volatility (%)',
    'Min Volatility (%)',
    'Daily Volatility Std Dev',
    'Mean Daily Range',
    'Annualized Volatility (%)',
  ];

  const rows = stats.map((s) => [
    `"${s.cryptocurrency}"`,
    s.count,
    s.avgVolatility,
    s.maxVolatility,
    s.minVolatility,
    s.stdDevVolatility,
    s.avgDailyRange,
    s.annualizedVolatility,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadCsv('cryptocurrency_volatility_analysis.csv', csv);
}

export function exportANOVACsv(anova: ANOVAResult): void {
  const lines: string[] = [];
  lines.push(`One-Way Analysis of Variance (ANOVA): ${anova.metricName}`);
  lines.push(`Significance Level (alpha):,${anova.alpha}`);
  lines.push(`Decision:,${anova.decision}`);
  lines.push('');
  lines.push('Source of Variation,SS (Sum of Squares),df (Degrees of Freedom),MS (Mean Square),F-Statistic,p-Value');
  lines.push(`Between Groups,${anova.ssBetween},${anova.dfBetween},${anova.msBetween},${anova.fStat},${anova.pValue}`);
  lines.push(`Within Groups (Error),${anova.ssWithin},${anova.dfWithin},${anova.msWithin},,`);
  lines.push(`Total,${anova.ssTotal},${anova.dfTotal},,,`);
  lines.push('');
  lines.push('Group Statistics');
  lines.push('Group,Count,Mean,Variance,Std Dev');
  anova.groupStats.forEach((g) => {
    lines.push(`"${g.group}",${g.count},${g.mean},${g.variance},${g.stdDev}`);
  });

  downloadCsv(`anova_test_${anova.metricName.toLowerCase().replace(/\s+/g, '_')}.csv`, lines.join('\n'));
}

export function exportChartElementAsPng(
  elementId: string,
  filename = 'chart.png',
  onResult?: (success: boolean, message: string) => void
): void {
  const container = document.getElementById(elementId);
  if (!container) {
    onResult?.(false, 'Chart container not found.');
    return;
  }

  const svg = container.querySelector('svg');
  if (!svg) {
    onResult?.(false, 'No chart graphic available to export yet.');
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const svgSize = svg.getBoundingClientRect();
  canvas.width = (svgSize.width || 800) * 2;
  canvas.height = (svgSize.height || 450) * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    onResult?.(false, 'Unable to initialize image canvas.');
    return;
  }

  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, svgSize.width || 800, svgSize.height || 450);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onResult?.(true, `Saved ${filename}`);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    onResult?.(false, 'Could not render chart image.');
  };
  img.src = url;
}
