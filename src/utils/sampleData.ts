import { CryptoRecord } from '../types/crypto';

// Deterministic pseudo-random seed to generate authentic, realistic daily price series
function generateCryptoSeries(
  crypto: string,
  startPrice: number,
  startVol: number,
  startCap: number,
  volatilityScale: number,
  drift: number,
  startDateStr: string,
  days: number
): CryptoRecord[] {
  const records: CryptoRecord[] = [];
  let price = startPrice;
  const startDate = new Date(startDateStr);

  // Seeded linear congruential generator for reproducible academic data
  let seed = 0;
  for (let i = 0; i < crypto.length; i++) {
    seed = (seed * 31 + crypto.charCodeAt(i)) % 100000;
  }
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < days; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];

    // Daily percentage return with mean drift and normal-like random shock
    const u1 = Math.max(0.0001, random());
    const u2 = random();
    const shock = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const pctChange = drift + shock * volatilityScale;

    const open = Math.round(price * 100) / 100;
    const close = Math.round(open * (1 + pctChange) * 100) / 100;

    // High and Low bounds based on intraday fluctuation
    const intradayUpper = Math.max(open, close) * (1 + Math.abs(shock) * (volatilityScale * 0.7) + 0.002);
    const intradayLower = Math.min(open, close) * (1 - Math.abs(shock) * (volatilityScale * 0.7) - 0.002);

    const high = Math.round(intradayUpper * 100) / 100;
    const low = Math.max(0.01, Math.round(intradayLower * 100) / 100);

    // Volume scales with price movement (volume-volatility relationship)
    const volNoise = 0.8 + random() * 0.5;
    const volShock = 1 + Math.abs(pctChange) * 10;
    const volume = Math.round(startVol * volNoise * volShock);
    const marketCap = Math.round(close * (startCap / startPrice));

    const dailyReturn = Math.round((((close - open) / open) * 100) * 1000) / 1000;
    const dailyRange = Math.round((high - low) * 100) / 100;
    const volatility = Math.round((((high - low) / open) * 100) * 1000) / 1000;

    records.push({
      id: `${crypto}-${dateStr}`,
      date: dateStr,
      cryptocurrency: crypto,
      open,
      high,
      low,
      close,
      volume,
      marketCap,
      dailyReturn,
      dailyRange,
      volatility,
    });

    price = close;
  }

  return records;
}

export function getSampleCryptocurrencyDataset(): CryptoRecord[] {
  const days = 120;
  // Starting 120 days prior to ~September 2026
  const startDateStr = '2026-05-01';

  const btc = generateCryptoSeries('Bitcoin (BTC)', 64200, 28000000000, 1260000000000, 0.024, 0.0008, startDateStr, days);
  const eth = generateCryptoSeries('Ethereum (ETH)', 3450, 16000000000, 415000000000, 0.031, 0.0006, startDateStr, days);
  const sol = generateCryptoSeries('Solana (SOL)', 148, 4200000000, 68000000000, 0.048, 0.0012, startDateStr, days);
  const ada = generateCryptoSeries('Cardano (ADA)', 0.46, 520000000, 16500000000, 0.042, -0.0002, startDateStr, days);
  const xrp = generateCryptoSeries('Ripple (XRP)', 0.54, 890000000, 30000000000, 0.038, 0.0004, startDateStr, days);

  const combined = [...btc, ...eth, ...sol, ...ada, ...xrp];
  // Sort by date ascending, then crypto
  return combined.sort((a, b) => a.date.localeCompare(b.date) || a.cryptocurrency.localeCompare(b.cryptocurrency));
}

export function generateSampleCsvString(): string {
  const data = getSampleCryptocurrencyDataset();
  const headers = ['Date', 'Cryptocurrency', 'Open Price', 'High Price', 'Low Price', 'Close Price', 'Trading Volume', 'Market Capitalization'];
  const rows = data.map((d) => [
    d.date,
    `"${d.cryptocurrency}"`,
    d.open,
    d.high,
    d.low,
    d.close,
    d.volume,
    d.marketCap,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
