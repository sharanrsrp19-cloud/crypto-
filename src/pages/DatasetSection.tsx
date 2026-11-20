import React, { useState, useMemo } from 'react';
import {
  CryptoRecord,
  CleaningReport,
} from '../types/crypto';
import {
  Download,
  Upload,
  Search,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { exportDatasetCsv } from '../utils/exportUtils';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';

interface DatasetSectionProps {
  records: CryptoRecord[];
  report: CleaningReport;
  onOpenUpload: () => void;
  onDownloadSample: () => void;
  onNotify?: (message: string) => void;
}

type SortField = keyof CryptoRecord;

const COLUMN_SCHEMA = [
  { name: 'Date', type: 'Date (YYYY-MM-DD)' },
  { name: 'Cryptocurrency', type: 'Text (Category)' },
  { name: 'Open / High / Low / Close', type: 'Decimal Currency ($)' },
  { name: 'Volume / Market Cap', type: 'Integer Currency ($)' },
  { name: 'Daily Return / Volatility', type: 'Calculated Float (%)' },
];

export const DatasetSection: React.FC<DatasetSectionProps> = ({
  records,
  report,
  onOpenUpload,
  onDownloadSample,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cryptoFilter, setCryptoFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const availableTableCryptos = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.cryptocurrency))).sort();
  }, [records]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter and Sort records
  const filteredAndSortedRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let result = records;

    if (cryptoFilter !== 'all') {
      result = result.filter((r) => r.cryptocurrency === cryptoFilter);
    }

    if (term) {
      result = result.filter(
        (r) =>
          r.cryptocurrency.toLowerCase().includes(term) ||
          r.date.includes(term) ||
          r.close.toString().includes(term)
      );
    }

    return [...result].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [records, searchTerm, cryptoFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  const handleExportCleaned = () => {
    exportDatasetCsv(records);
    onNotify?.('Cleaned dataset exported as CSV.');
  };

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="What happens on this page?"
        summary="Whenever you upload a CSV or Excel file, the app automatically removes duplicate dates, strips currency symbols ($ or commas), fixes invalid High/Low bounds, and calculates Daily Return % and Volatility % for every row."
        tips={[
          'Use the search box or Cryptocurrency dropdown below to inspect specific rows.',
          'Click any column header (like Close, Daily Return, or Volatility) to sort highest to lowest.',
          'Click "Download Cleaned CSV" to save the standardized dataset for your own records.',
        ]}
      />

      {/* Top Banner & Cleaning Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Dataset Management & Preprocessing Summary
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {records.length.toLocaleString()} active rows · 11 columns (8 source fields + 3 calculated metrics)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onDownloadSample}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
            >
              Download Template CSV
            </button>
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / Excel</span>
            </button>
            <button
              onClick={handleExportCleaned}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Cleaned CSV</span>
            </button>
          </div>
        </div>

        {/* Cleaning Report Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Total Raw Rows</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              {report.totalRows.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Valid Cleaned Rows</span>
            <span className="text-base font-bold font-mono text-emerald-700 tabular-nums">
              {report.validRows.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Duplicates Removed</span>
            <span className="text-base font-bold font-mono text-slate-700 tabular-nums">
              {report.duplicateRowsRemoved}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Invalid / Skipped</span>
            <span className="text-base font-bold font-mono text-amber-700 tabular-nums">
              {report.invalidRowsSkipped}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Total Columns</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              11
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Date Window</span>
            <span className="text-[11px] font-mono text-slate-700 truncate block mt-1" title={`${report.startDate} to ${report.endDate}`}>
              {report.startDate ? `${report.startDate} → ${report.endDate}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Detected Column Data Types */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-700 mb-2">
            Column Data Types & Cleaning Rules Applied:
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-slate-600 mb-3">
            {COLUMN_SCHEMA.map((col) => (
              <span key={col.name}>
                <strong className="text-slate-800">{col.name}:</strong> {col.type}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ISO 8601 Date Standardization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Currency & Comma Cleansing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>High/Low Boundary Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Interactive Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search coin, date, or price..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter table by cryptocurrency"
                value={cryptoFilter}
                onChange={(e) => {
                  setCryptoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="all">All Cryptocurrencies</option>
                {availableTableCryptos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="font-mono tabular-nums">
              {filteredAndSortedRecords.length === 0
                ? '0 results'
                : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                    currentPage * pageSize,
                    filteredAndSortedRecords.length
                  )} of ${filteredAndSortedRecords.length}`}
            </span>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'cryptocurrency', label: 'Cryptocurrency' },
                  { key: 'open', label: 'Open ($)', align: 'right' },
                  { key: 'high', label: 'High ($)', align: 'right' },
                  { key: 'low', label: 'Low ($)', align: 'right' },
                  { key: 'close', label: 'Close ($)', align: 'right' },
                  { key: 'volume', label: 'Volume ($)', align: 'right' },
                  { key: 'marketCap', label: 'Market Cap ($)', align: 'right' },
                  { key: 'dailyReturn', label: 'Daily Return (%)', align: 'right' },
                  { key: 'volatility', label: 'Volatility (%)', align: 'right' },
                ].map(({ key, label, align }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key as SortField)}
                    className={`py-2.5 px-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors ${
                      align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
                      <span>{label}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No matching records found. Try clearing your search or adjusting the top filter bar.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors text-slate-700">
                    <td className="py-2 px-3 text-slate-900 font-sans font-medium whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900 whitespace-nowrap">
                      {r.cryptocurrency}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {r.open >= 1 ? r.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : r.open.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {r.high >= 1 ? r.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : r.high.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {r.low >= 1 ? r.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : r.low.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900">
                      {r.close >= 1 ? r.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : r.close.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      ${(r.volume / 1e6).toFixed(1)}M
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      ${(r.marketCap / 1e9).toFixed(2)}B
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      <span className={r.dailyReturn >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {r.dailyReturn > 0 ? '+' : ''}
                        {r.dailyReturn.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-800">
                      {r.volatility.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
