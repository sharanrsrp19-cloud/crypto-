import React, { useState, useMemo } from 'react';
import { CryptoRecord, CorrelationMatrix } from '../types/crypto';
import { computeCorrelationMatrix, CORRELATION_VARIABLES } from '../utils/statistics';
import { GitCommit, AlertCircle, Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { PlainEnglishCallout } from '../components/PlainEnglishCallout';

interface CorrelationSectionProps {
  records: CryptoRecord[];
}

export const CorrelationSection: React.FC<CorrelationSectionProps> = ({ records }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 4, col: 7 });

  const correlation = useMemo(() => {
    return computeCorrelationMatrix(records);
  }, [records]);

  // Color generator for correlation cell (-1 to +1)
  const getCellColor = (r: number) => {
    if (r === 1) return 'bg-emerald-700 text-white font-bold';
    if (r >= 0.7) return 'bg-emerald-600/90 text-white';
    if (r >= 0.4) return 'bg-emerald-500/70 text-emerald-950 font-medium';
    if (r >= 0.2) return 'bg-emerald-100 text-emerald-900';
    if (r > -0.2) return 'bg-slate-100 text-slate-700';
    if (r > -0.4) return 'bg-amber-100 text-amber-900';
    if (r > -0.7) return 'bg-rose-400 text-white font-medium';
    return 'bg-rose-700 text-white font-bold';
  };

  const getInterpretationText = (r: number, var1: string, var2: string) => {
    const absR = Math.abs(r);
    let intensity = 'negligible or virtually non-existent linear';
    if (absR >= 0.8) intensity = 'very strong';
    else if (absR >= 0.6) intensity = 'strong';
    else if (absR >= 0.4) intensity = 'moderate';
    else if (absR >= 0.2) intensity = 'weak';

    const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'neutral';

    let explanation = '';
    if (r === 1) {
      explanation = 'Identity correlation: A variable is perfectly correlated with itself.';
    } else if (r > 0) {
      explanation = `As ${var1} increases, ${var2} tends to increase proportionally.`;
    } else if (r < 0) {
      explanation = `As ${var1} increases, ${var2} tends to decrease systematically.`;
    } else {
      explanation = `No observable linear co-movement between ${var1} and ${var2}.`;
    }

    return { intensity, direction, explanation };
  };

  const activeInterpretation = useMemo(() => {
    if (!selectedCell) return null;
    const { row, col } = selectedCell;
    const r = correlation.matrix[row][col];
    const var1 = correlation.variables[row];
    const var2 = correlation.variables[col];
    const interp = getInterpretationText(r, var1, var2);
    return { r, var1, var2, ...interp };
  }, [selectedCell, correlation]);

  return (
    <div className="space-y-6">
      <PlainEnglishCallout
        title="How to read the Correlation Heatmap"
        summary="Each square shows how strongly two variables move together on a scale from -1.00 to +1.00. Green means they rise together; red means one rises while the other falls; gray near 0.00 means no linear link."
        tips={[
          'Click any square in the grid below to read an instant plain-English explanation of that pair.',
          'Remember: even a strong correlation does not prove one variable causes the other.',
        ]}
      />

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Pearson Bivariate Correlation Matrix
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical Pearson product-moment correlation coefficient r ∈ [-1, +1] measuring linear co-movement.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Academic Principle: Correlation does not establish causation.</span>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 mr-1 text-[11px]">Legend:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[11px] font-mono">+1.0 Perfect</span>
          <span className="px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[11px] font-mono">+0.7 Strong Positive</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/70 text-emerald-950 text-[11px] font-mono">+0.4 Moderate Positive</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-mono">+0.2 Weak Positive</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">0.0 Neutral</span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-mono">-0.3 Moderate Negative</span>
          <span className="px-2 py-0.5 rounded bg-rose-700 text-white text-[11px] font-mono">-1.0 Strong Negative</span>
        </div>
      </div>

      {/* Correlation Heatmap Grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Interactive Correlation Heatmap Matrix
          </h2>
          <span className="text-xs text-slate-400">
            Click any cell to inspect mathematical interpretation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-500 font-semibold bg-slate-50/50"></th>
                {correlation.variables.map((v) => (
                  <th
                    key={v}
                    className="p-2 text-center text-slate-700 font-semibold bg-slate-50/80 whitespace-nowrap min-w-[75px]"
                  >
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlation.variables.map((rowVar, rIdx) => (
                <tr key={rowVar}>
                  <th className="p-2.5 text-left text-slate-700 font-semibold bg-slate-50/50 whitespace-nowrap border-b border-slate-100">
                    {rowVar}
                  </th>
                  {correlation.matrix[rIdx].map((rVal, cIdx) => {
                    const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                    return (
                      <td
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                        className={`p-2.5 text-center font-mono tabular-nums text-xs border border-white cursor-pointer transition-transform hover:scale-105 ${getCellColor(
                          rVal
                        )} ${isSelected ? 'ring-2 ring-slate-900 z-10' : ''}`}
                        title={`${rowVar} vs ${correlation.variables[cIdx]}: r = ${rVal}`}
                      >
                        {rVal.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Inspector & Academic Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Statistical Interpretation of Selected Correlation</span>
          </h3>

          {activeInterpretation ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Variable 1</span>
                  <span className="font-bold text-slate-900 text-sm">{activeInterpretation.var1}</span>
                </div>
                <div className="text-slate-400 font-light">⟷</div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Variable 2</span>
                  <span className="font-bold text-slate-900 text-sm">{activeInterpretation.var2}</span>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pearson r</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {activeInterpretation.r.toFixed(3)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
                <p>
                  <strong>Academic Finding:</strong> The empirical coefficient of <strong>r = {activeInterpretation.r.toFixed(3)}</strong> demonstrates a <strong>{activeInterpretation.intensity} {activeInterpretation.direction} correlation</strong> between {activeInterpretation.var1} and {activeInterpretation.var2}.
                </p>
                <p className="mt-1 text-slate-600">
                  {activeInterpretation.explanation}
                </p>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                R² Coefficient of Determination: {(Math.pow(activeInterpretation.r, 2) * 100).toFixed(1)}% of the variance in one variable is linearly shared with the other.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Click any cell in the heatmap matrix above to inspect the bivariate correlation coefficient and academic interpretation.
            </div>
          )}
        </div>

        {/* Reference Guide */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900">
            Pearson Interpretation Scale
          </h3>
          <ul className="space-y-2 text-[11px] text-slate-600">
            <li className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-emerald-700 shrink-0">0.70 to 1.00:</span>
              <span>Strong positive correlation; variables move tightly in tandem.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-emerald-600 shrink-0">0.40 to 0.69:</span>
              <span>Moderate positive relationship; noticeable co-movement with dispersion.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-slate-700 shrink-0">0.20 to 0.39:</span>
              <span>Weak correlation; subtle linear alignment.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-slate-500 shrink-0">-0.19 to 0.19:</span>
              <span>Negligible relationship; variables behave essentially independently.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-rose-700 shrink-0">-0.40 to -1.00:</span>
              <span>Inverse co-movement; one variable expands as the other contracts.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
