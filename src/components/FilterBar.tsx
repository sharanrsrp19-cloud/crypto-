import React from 'react';
import { Calendar, RotateCcw, Coins, DollarSign } from 'lucide-react';
import { FilterState } from '../types/crypto';

interface FilterBarProps {
  availableCryptos: string[];
  filterState: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  minAvailableDate: string;
  maxAvailableDate: string;
  totalRecordsCount: number;
  filteredRecordsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  availableCryptos,
  filterState,
  onFilterChange,
  minAvailableDate,
  maxAvailableDate,
  totalRecordsCount,
  filteredRecordsCount,
}) => {
  const toggleCrypto = (crypto: string) => {
    let next: string[];
    if (filterState.selectedCryptos.includes(crypto)) {
      if (filterState.selectedCryptos.length === 1) {
        // Re-select all when clicking the last active coin
        next = availableCryptos;
      } else {
        next = filterState.selectedCryptos.filter((c) => c !== crypto);
      }
    } else {
      next = [...filterState.selectedCryptos, crypto];
    }
    onFilterChange({ ...filterState, selectedCryptos: next });
  };

  const isolateCrypto = (crypto: string) => {
    onFilterChange({ ...filterState, selectedCryptos: [crypto] });
  };

  const selectAllCryptos = () => {
    onFilterChange({ ...filterState, selectedCryptos: availableCryptos });
  };

  const setQuickDateRange = (days: number | 'all') => {
    if (days === 'all' || !maxAvailableDate) {
      onFilterChange({
        ...filterState,
        startDate: minAvailableDate,
        endDate: maxAvailableDate,
      });
      return;
    }
    const end = new Date(maxAvailableDate);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];
    onFilterChange({
      ...filterState,
      startDate: startStr < minAvailableDate ? minAvailableDate : startStr,
      endDate: maxAvailableDate,
    });
  };

  const resetAllFilters = () => {
    onFilterChange({
      selectedCryptos: availableCryptos,
      startDate: minAvailableDate,
      endDate: maxAvailableDate,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const isFiltered =
    filterState.selectedCryptos.length < availableCryptos.length ||
    (filterState.startDate && filterState.startDate !== minAvailableDate) ||
    (filterState.endDate && filterState.endDate !== maxAvailableDate) ||
    filterState.minPrice !== undefined ||
    filterState.maxPrice !== undefined;

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Crypto selection */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mr-1">
            <Coins className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Coins:</span>
          </div>

          <button
            onClick={selectAllCryptos}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              filterState.selectedCryptos.length === availableCryptos.length
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({availableCryptos.length})
          </button>

          {availableCryptos.map((crypto) => {
            const isSelected = filterState.selectedCryptos.includes(crypto);
            return (
              <button
                key={crypto}
                onClick={() => toggleCrypto(crypto)}
                onDoubleClick={() => isolateCrypto(crypto)}
                title="Click to toggle · Double-click to focus only this coin"
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {crypto}
              </button>
            );
          })}
        </div>

        {/* Right side: Date pickers, Price Range & Presets */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              aria-label="Start date"
              value={filterState.startDate}
              min={minAvailableDate}
              max={filterState.endDate || maxAvailableDate}
              onChange={(e) => onFilterChange({ ...filterState, startDate: e.target.value })}
              className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-400"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              aria-label="End date"
              value={filterState.endDate}
              min={filterState.startDate || minAvailableDate}
              max={maxAvailableDate}
              onChange={(e) => onFilterChange({ ...filterState, endDate: e.target.value })}
              className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
            <button
              onClick={() => setQuickDateRange(30)}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
            >
              30D
            </button>
            <button
              onClick={() => setQuickDateRange(90)}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
            >
              90D
            </button>
            <button
              onClick={() => setQuickDateRange('all')}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
            >
              All
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Min $"
              aria-label="Minimum closing price"
              value={filterState.minPrice ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                onFilterChange({ ...filterState, minPrice: val });
              }}
              className="w-20 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-400 font-mono"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Max $"
              aria-label="Maximum closing price"
              value={filterState.maxPrice ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                onFilterChange({ ...filterState, maxPrice: val });
              }}
              className="w-20 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-400 font-mono"
            />
          </div>

          {/* Records Counter & Reset */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">
              <strong className="text-slate-800">{filteredRecordsCount}</strong> / {totalRecordsCount} rows
            </span>

            {isFiltered && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
