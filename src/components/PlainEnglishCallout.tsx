import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface PlainEnglishCalloutProps {
  title: string;
  summary: string;
  tips?: string[];
  defaultOpen?: boolean;
}

export const PlainEnglishCallout: React.FC<PlainEnglishCalloutProps> = ({
  title,
  summary,
  tips = [],
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{title}</span>
        </div>
        <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium shrink-0">
          <span>{isOpen ? 'Hide guide' : 'Show guide'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 pl-6 space-y-1.5 text-slate-600 leading-relaxed">
          <p>{summary}</p>
          {tips.length > 0 && (
            <ul className="space-y-1 text-[11px] text-slate-600 pt-1">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
