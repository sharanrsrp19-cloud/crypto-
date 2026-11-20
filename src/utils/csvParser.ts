import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CryptoRecord, ColumnMapping, CleaningReport } from '../types/crypto';

export interface ParseResult {
  records: CryptoRecord[];
  report: CleaningReport;
  rawHeaders: string[];
  detectedMapping: ColumnMapping;
  previewRows: Record<string, unknown>[];
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const mapping: ColumnMapping = {
    date: '',
    cryptocurrency: '',
    open: '',
    high: '',
    low: '',
    close: '',
    volume: '',
    marketCap: '',
  };

  const normHeaders = headers.map((h) => ({ original: h, norm: normalize(h) }));

  for (const { original, norm } of normHeaders) {
    if (!mapping.date && (norm === 'date' || norm.includes('date') || norm === 'time' || norm === 'timestamp')) {
      mapping.date = original;
    } else if (
      !mapping.cryptocurrency &&
      (norm === 'cryptocurrency' || norm === 'crypto' || norm === 'symbol' || norm === 'coin' || norm === 'name' || norm === 'ticker' || norm === 'currency')
    ) {
      mapping.cryptocurrency = original;
    } else if (!mapping.open && (norm === 'open' || norm === 'openprice' || norm === 'openingprice')) {
      mapping.open = original;
    } else if (!mapping.high && (norm === 'high' || norm === 'highprice' || norm === 'highestprice' || norm === 'highest')) {
      mapping.high = original;
    } else if (!mapping.low && (norm === 'low' || norm === 'lowprice' || norm === 'lowestprice' || norm === 'lowest')) {
      mapping.low = original;
    } else if (!mapping.close && (norm === 'close' || norm === 'closeprice' || norm === 'closingprice' || norm === 'adjclose' || norm === 'adjustedclose')) {
      mapping.close = original;
    } else if (!mapping.volume && (norm.includes('volume') || norm === 'vol' || norm === 'tradingvol' || norm === 'volumeusd' || norm === '24hvol')) {
      mapping.volume = original;
    } else if (!mapping.marketCap && (norm.includes('marketcap') || norm.includes('mcap') || norm.includes('capitalization') || norm === 'cap')) {
      mapping.marketCap = original;
    }
  }

  // Fallback defaults if not perfectly matched
  if (!mapping.date && headers.length > 0) mapping.date = headers[0];
  if (!mapping.cryptocurrency) {
    const candidate = headers.find((h) => normalize(h).includes('name') || normalize(h).includes('crypto'));
    mapping.cryptocurrency = candidate || (headers.length > 1 ? headers[1] : 'Cryptocurrency');
  }

  return mapping;
}

export function parseNumber(val: unknown): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (!val) return null;
  const str = String(val).replace(/[\$,\s%]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export function parseDate(val: unknown): string | null {
  if (!val) return null;
  try {
    if (typeof val === 'number') {
      // Excel serial date format
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const d = new Date(String(val));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    return null;
  }
  return null;
}

export function cleanAndProcessRecords(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping
): { records: CryptoRecord[]; report: CleaningReport } {
  let duplicateCount = 0;
  let missingOrInvalidCount = 0;
  const seenKeys = new Set<string>();
  const records: CryptoRecord[] = [];
  const detectedCryptos = new Set<string>();

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];

    // Extract date
    const rawDate = row[mapping.date];
    const dateStr = parseDate(rawDate);
    if (!dateStr) {
      missingOrInvalidCount++;
      continue;
    }

    // Extract crypto identifier
    let crypto = String(row[mapping.cryptocurrency] || 'Asset').trim();
    if (!crypto || crypto === 'undefined' || crypto === 'null') {
      crypto = 'Crypto-1';
    }

    // Deduplication check
    const dedupKey = `${crypto.toUpperCase()}__${dateStr}`;
    if (seenKeys.has(dedupKey)) {
      duplicateCount++;
      continue;
    }
    seenKeys.add(dedupKey);

    // Extract numeric fields
    const open = parseNumber(row[mapping.open]);
    const close = parseNumber(row[mapping.close]);
    let high = parseNumber(row[mapping.high]);
    let low = parseNumber(row[mapping.low]);
    const volume = parseNumber(row[mapping.volume]) ?? 0;
    const marketCap = parseNumber(row[mapping.marketCap]) ?? 0;

    if (open === null || close === null || open <= 0 || close <= 0) {
      missingOrInvalidCount++;
      continue;
    }

    // Validate or calibrate High and Low
    if (high === null || high < Math.max(open, close)) {
      high = Math.max(open, close);
    }
    if (low === null || low > Math.min(open, close) || low <= 0) {
      low = Math.min(open, close);
    }

    // Calculate statistical metrics
    const dailyReturn = Math.round((((close - open) / open) * 100) * 1000) / 1000;
    const dailyRange = Math.round((high - low) * 100) / 100;
    const volatility = Math.round((((high - low) / open) * 100) * 1000) / 1000;

    detectedCryptos.add(crypto);

    records.push({
      id: `${crypto}-${dateStr}-${idx}`,
      date: dateStr,
      cryptocurrency: crypto,
      open: Math.round(open * 10000) / 10000,
      high: Math.round(high * 10000) / 10000,
      low: Math.round(low * 10000) / 10000,
      close: Math.round(close * 10000) / 10000,
      volume: Math.round(volume),
      marketCap: Math.round(marketCap),
      dailyReturn,
      dailyRange,
      volatility,
    });
  }

  // Sort ascending by date, then crypto
  records.sort((a, b) => a.date.localeCompare(b.date) || a.cryptocurrency.localeCompare(b.cryptocurrency));

  const sortedDates = records.map((r) => r.date).filter(Boolean);
  const startDate = sortedDates.length > 0 ? sortedDates[0] : '';
  const endDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : '';

  const report: CleaningReport = {
    totalRows: rawRows.length,
    validRows: records.length,
    duplicateRowsRemoved: duplicateCount,
    missingValuesFilledOrSkipped: missingOrInvalidCount,
    invalidRowsSkipped: missingOrInvalidCount,
    detectedCryptos: Array.from(detectedCryptos),
    startDate,
    endDate,
  };

  return { records, report };
}

export async function parseFile(file: File): Promise<{
  rawRows: Record<string, unknown>[];
  headers: string[];
}> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'xlsx' || fileExt === 'xls') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    return { rawRows, headers };
  } else {
    // CSV
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawRows = results.data as Record<string, unknown>[];
          const headers = results.meta.fields || (rawRows.length > 0 ? Object.keys(rawRows[0]) : []);
          resolve({ rawRows, headers });
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
