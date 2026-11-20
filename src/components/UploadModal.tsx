import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';
import { parseFile, detectColumnMapping, cleanAndProcessRecords } from '../utils/csvParser';
import { CryptoRecord, CleaningReport, ColumnMapping } from '../types/crypto';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: CryptoRecord[], report: CleaningReport, fileName?: string) => void;
  onLoadSample: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onLoadSample,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    cryptocurrency: '',
    open: '',
    high: '',
    low: '',
    close: '',
    volume: '',
    marketCap: '',
  });
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      setFile(selectedFile);
      const parsed = await parseFile(selectedFile);
      if (parsed.headers.length === 0 || parsed.rawRows.length === 0) {
        throw new Error('The selected file appears to be empty or could not be parsed.');
      }
      setRawHeaders(parsed.headers);
      setRawRows(parsed.rawRows);
      const autoMapping = detectColumnMapping(parsed.headers);
      setMapping(autoMapping);
      setStep('mapping');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to read file. Please ensure it is a valid CSV or Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFinalProcess = () => {
    if (!mapping.date || !mapping.close || !mapping.open) {
      setErrorMsg('Please map at least Date, Open Price, and Close Price columns.');
      return;
    }

    try {
      const { records, report } = cleanAndProcessRecords(rawRows, mapping);
      if (records.length === 0) {
        setErrorMsg('No valid records could be processed. Please check your column mappings and date/numeric values.');
        return;
      }
      onDataLoaded(records, report, file?.name);
      onClose();
      // Reset state
      setStep('upload');
      setFile(null);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'An error occurred during dataset cleaning.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {step === 'upload' && 'Upload Cryptocurrency Dataset'}
              {step === 'mapping' && 'Verify Column Mappings'}
            </h2>
            <p className="text-xs text-slate-500">
              Supports CSV (.csv) and Microsoft Excel (.xlsx, .xls) files
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100/80 rounded-lg p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                <div className="w-12 h-12 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to select or drag and drop dataset file
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  CSV or Excel (.xlsx / .xls) with Date, Open, High, Low, Close, Volume, Market Cap
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Want to test without your own file?</span>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSample();
                    onClose();
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  Load 5-Asset Academic Sample Dataset
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Loaded <strong>{file?.name}</strong> ({rawRows.length.toLocaleString()} rows detected)
                  </span>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-emerald-700 underline text-xs cursor-pointer font-medium"
                >
                  Change file
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Our parser automatically mapped column headers. Review and adjust if your dataset uses alternate names:
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'date', label: 'Date Column *', desc: 'Date or Timestamp (YYYY-MM-DD)' },
                  { key: 'cryptocurrency', label: 'Cryptocurrency *', desc: 'Asset symbol or name (BTC, ETH, etc.)' },
                  { key: 'open', label: 'Open Price *', desc: 'Day opening price' },
                  { key: 'high', label: 'High Price *', desc: 'Day peak price' },
                  { key: 'low', label: 'Low Price *', desc: 'Day floor price' },
                  { key: 'close', label: 'Close Price *', desc: 'Day closing price' },
                  { key: 'volume', label: 'Trading Volume', desc: '24h trading volume' },
                  { key: 'marketCap', label: 'Market Capitalization', desc: 'Total market valuation' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <label className="block font-semibold text-slate-800 mb-0.5">{label}</label>
                    <p className="text-[10px] text-slate-500 mb-1.5">{desc}</p>
                    <select
                      value={mapping[key as keyof ColumnMapping] || ''}
                      onChange={(e) =>
                        setMapping({ ...mapping, [key]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                    >
                      <option value="">-- Not in dataset --</option>
                      {rawHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>

          {step === 'mapping' && (
            <button
              onClick={handleFinalProcess}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isProcessing ? 'Processing & Cleaning...' : 'Clean & Analyze Dataset'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
