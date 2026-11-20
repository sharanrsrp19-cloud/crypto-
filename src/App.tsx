import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  CryptoRecord,
  CleaningReport,
  FilterState,
  ActiveTab,
} from './types/crypto';
import {
  getSampleCryptocurrencyDataset,
  generateSampleCsvString,
} from './utils/sampleData';
import {
  computeDescriptiveStats,
  computeReturnStats,
  computeVolatilityStats,
  computeCorrelationMatrix,
  computeLinearRegression,
  computeOneWayANOVA,
} from './utils/statistics';
import { downloadCsv } from './utils/exportUtils';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { UploadModal } from './components/UploadModal';
import { GuideModal } from './components/GuideModal';

import { HomeSection } from './pages/HomeSection';
import { DatasetSection } from './pages/DatasetSection';
import { StatisticsSection } from './pages/StatisticsSection';
import { ReturnsSection } from './pages/ReturnsSection';
import { VolatilitySection } from './pages/VolatilitySection';
import { CorrelationSection } from './pages/CorrelationSection';
import { RegressionSection } from './pages/RegressionSection';
import { HypothesisSection } from './pages/HypothesisSection';
import { VisualizationSection } from './pages/VisualizationSection';
import { ConclusionSection } from './pages/ConclusionSection';
import { ReportSection } from './pages/ReportSection';
import { CheckCircle2, RotateCcw, FilterX } from 'lucide-react';

export default function App() {
  // Initialize baseline dataset
  const initialRecords = useMemo(() => getSampleCryptocurrencyDataset(), []);

  const [records, setRecords] = useState<CryptoRecord[]>(initialRecords);
  const [datasetSourceLabel, setDatasetSourceLabel] = useState<string>('Built-in 5-Asset Sample');
  const [cleaningReport, setCleaningReport] = useState<CleaningReport>({
    totalRows: initialRecords.length,
    validRows: initialRecords.length,
    duplicateRowsRemoved: 0,
    missingValuesFilledOrSkipped: 0,
    invalidRowsSkipped: 0,
    detectedCryptos: Array.from(new Set(initialRecords.map((r) => r.cryptocurrency))),
    startDate: initialRecords[0]?.date || '2026-05-01',
    endDate: initialRecords[initialRecords.length - 1]?.date || '2026-08-28',
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Derive unique cryptos and overall date bounds from current records
  const availableCryptos = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.cryptocurrency))).sort();
  }, [records]);

  const minAvailableDate = useMemo(() => {
    if (records.length === 0) return '';
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0].date;
  }, [records]);

  const maxAvailableDate = useMemo(() => {
    if (records.length === 0) return '';
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[sorted.length - 1].date;
  }, [records]);

  // Global filters
  const [filterState, setFilterState] = useState<FilterState>({
    selectedCryptos: availableCryptos,
    startDate: minAvailableDate,
    endDate: maxAvailableDate,
  });

  // Keep filter selectedCryptos in sync when new dataset is loaded
  const handleDataLoaded = (newRecords: CryptoRecord[], report: CleaningReport, fileName?: string) => {
    setRecords(newRecords);
    setCleaningReport(report);
    setDatasetSourceLabel(fileName ? `Uploaded: ${fileName}` : 'Custom Dataset');
    const newCryptos = Array.from(new Set(newRecords.map((r) => r.cryptocurrency))).sort();
    const sorted = [...newRecords].sort((a, b) => a.date.localeCompare(b.date));
    const start = sorted[0]?.date || '';
    const end = sorted[sorted.length - 1]?.date || '';

    setFilterState({
      selectedCryptos: newCryptos,
      startDate: start,
      endDate: end,
      minPrice: undefined,
      maxPrice: undefined,
    });
    setActiveTab('dataset');
    showToast(`Loaded ${newRecords.length.toLocaleString()} cleaned rows from ${fileName || 'your dataset'}.`);
  };

  const handleResetSample = () => {
    const sample = getSampleCryptocurrencyDataset();
    const cryptos = Array.from(new Set(sample.map((r) => r.cryptocurrency))).sort();
    setRecords(sample);
    setDatasetSourceLabel('Built-in 5-Asset Sample');
    setCleaningReport({
      totalRows: sample.length,
      validRows: sample.length,
      duplicateRowsRemoved: 0,
      missingValuesFilledOrSkipped: 0,
      invalidRowsSkipped: 0,
      detectedCryptos: cryptos,
      startDate: sample[0]?.date || '',
      endDate: sample[sample.length - 1]?.date || '',
    });
    setFilterState({
      selectedCryptos: cryptos,
      startDate: sample[0]?.date || '',
      endDate: sample[sample.length - 1]?.date || '',
      minPrice: undefined,
      maxPrice: undefined,
    });
    showToast('Restored built-in 5-asset sample dataset.');
  };

  const handleClearFilters = () => {
    setFilterState({
      selectedCryptos: availableCryptos,
      startDate: minAvailableDate,
      endDate: maxAvailableDate,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const handleDownloadSampleCsv = () => {
    const csv = generateSampleCsvString();
    downloadCsv('cryptocurrency_sample_dataset_template.csv', csv);
    showToast('Downloaded sample CSV template.');
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterState.selectedCryptos.length > 0 && !filterState.selectedCryptos.includes(r.cryptocurrency)) {
        return false;
      }
      if (filterState.startDate && r.date < filterState.startDate) {
        return false;
      }
      if (filterState.endDate && r.date > filterState.endDate) {
        return false;
      }
      if (filterState.minPrice !== undefined && !isNaN(filterState.minPrice) && r.close < filterState.minPrice) {
        return false;
      }
      if (filterState.maxPrice !== undefined && !isNaN(filterState.maxPrice) && r.close > filterState.maxPrice) {
        return false;
      }
      return true;
    });
  }, [records, filterState]);

  // Derived statistical datasets
  const activeCryptos = useMemo(() => {
    return Array.from(new Set(filteredRecords.map((r) => r.cryptocurrency))).sort();
  }, [filteredRecords]);

  const descriptiveStats = useMemo(() => {
    return computeDescriptiveStats(filteredRecords, 'close');
  }, [filteredRecords]);

  const returnStats = useMemo(() => {
    return computeReturnStats(filteredRecords);
  }, [filteredRecords]);

  const volatilityStats = useMemo(() => {
    return computeVolatilityStats(filteredRecords);
  }, [filteredRecords]);

  const correlation = useMemo(() => {
    return computeCorrelationMatrix(filteredRecords);
  }, [filteredRecords]);

  const regressionVolReturn = useMemo(() => {
    return computeLinearRegression(filteredRecords, 'volume', 'dailyReturn', 'Trading Volume ($)', 'Daily Return (%)');
  }, [filteredRecords]);

  const regressionVolPrice = useMemo(() => {
    return computeLinearRegression(filteredRecords, 'volume', 'close', 'Trading Volume ($)', 'Close Price ($)');
  }, [filteredRecords]);

  const regressionVolatReturn = useMemo(() => {
    return computeLinearRegression(filteredRecords, 'volatility', 'dailyReturn', 'Volatility (%)', 'Daily Return (%)');
  }, [filteredRecords]);

  const anovaVolatility = useMemo(() => {
    return computeOneWayANOVA(filteredRecords, 'volatility', 'Volatility (%)', 0.05);
  }, [filteredRecords]);

  const anovaReturns = useMemo(() => {
    return computeOneWayANOVA(filteredRecords, 'dailyReturn', 'Daily Return (%)', 0.05);
  }, [filteredRecords]);

  const currentTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return 'Overview';
      case 'dataset':
        return 'Dataset & Cleaning';
      case 'statistics':
        return 'Descriptive Statistics';
      case 'returns':
        return 'Daily Return Analysis';
      case 'volatility':
        return 'Volatility Analysis';
      case 'correlation':
        return 'Correlation Heatmap';
      case 'regression':
        return 'Linear Regression';
      case 'hypothesis':
        return 'Hypothesis Testing';
      case 'visualizations':
        return 'Visualizations Gallery';
      case 'conclusion':
        return 'Statistical Summary';
      case 'report':
        return 'Academic Project Report';
      default:
        return 'Dashboard';
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        recordCount={filteredRecords.length}
        cryptoCount={activeCryptos.length}
        datasetSourceLabel={datasetSourceLabel}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          tabTitle={currentTabLabel}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onResetSample={handleResetSample}
          onPrintReport={() => {
            setActiveTab('report');
            setTimeout(() => window.print(), 150);
          }}
          onDownloadSampleCsv={handleDownloadSampleCsv}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Global Filter Bar */}
        {activeTab !== 'report' && (
          <FilterBar
            availableCryptos={availableCryptos}
            filterState={filterState}
            onFilterChange={setFilterState}
            minAvailableDate={minAvailableDate}
            maxAvailableDate={maxAvailableDate}
            totalRecordsCount={records.length}
            filteredRecordsCount={filteredRecords.length}
          />
        )}

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {filteredRecords.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FilterX className="w-6 h-6 text-slate-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                No rows match your current filters
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Your selected date range, price range, or cryptocurrency filter excluded all {records.length.toLocaleString()} records. Reset filters to view your data again.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeSection
                  records={filteredRecords}
                  cryptos={activeCryptos}
                  dateRange={{
                    start: filterState.startDate || minAvailableDate,
                    end: filterState.endDate || maxAvailableDate,
                  }}
                  datasetSourceLabel={datasetSourceLabel}
                  returnStats={returnStats}
                  volatilityStats={volatilityStats}
                  anovaVolatility={anovaVolatility}
                  onNavigate={setActiveTab}
                  onOpenUpload={() => setIsUploadModalOpen(true)}
                  onOpenGuide={() => setIsGuideOpen(true)}
                />
              )}

              {activeTab === 'dataset' && (
                <DatasetSection
                  records={filteredRecords}
                  report={cleaningReport}
                  onOpenUpload={() => setIsUploadModalOpen(true)}
                  onDownloadSample={handleDownloadSampleCsv}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'statistics' && (
                <StatisticsSection records={filteredRecords} />
              )}

              {activeTab === 'returns' && (
                <ReturnsSection records={filteredRecords} />
              )}

              {activeTab === 'volatility' && (
                <VolatilitySection records={filteredRecords} />
              )}

              {activeTab === 'correlation' && (
                <CorrelationSection records={filteredRecords} />
              )}

              {activeTab === 'regression' && (
                <RegressionSection records={filteredRecords} />
              )}

              {activeTab === 'hypothesis' && (
                <HypothesisSection records={filteredRecords} />
              )}

              {activeTab === 'visualizations' && (
                <VisualizationSection records={filteredRecords} onNotify={showToast} />
              )}

              {activeTab === 'conclusion' && (
                <ConclusionSection
                  records={filteredRecords}
                  cryptos={activeCryptos}
                  returnStats={returnStats}
                  volatilityStats={volatilityStats}
                  anovaVolatility={anovaVolatility}
                  anovaReturns={anovaReturns}
                  regressionVolReturn={regressionVolReturn}
                  regressionVolPrice={regressionVolPrice}
                  correlation={correlation}
                />
              )}

              {activeTab === 'report' && (
                <ReportSection
                  records={filteredRecords}
                  cryptos={activeCryptos}
                  dateRange={{
                    start: filterState.startDate || minAvailableDate,
                    end: filterState.endDate || maxAvailableDate,
                  }}
                  descriptiveStats={descriptiveStats}
                  returnStats={returnStats}
                  volatilityStats={volatilityStats}
                  correlation={correlation}
                  regressionVolReturn={regressionVolReturn}
                  regressionVolPrice={regressionVolPrice}
                  regressionVolatReturn={regressionVolatReturn}
                  anovaVolatility={anovaVolatility}
                  anovaReturns={anovaReturns}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 text-xs font-medium flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Upload and Column Mapping Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleDataLoaded}
        onLoadSample={handleResetSample}
      />

      {/* Plain-English User Guide & Glossary Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />
    </div>
  );
}
