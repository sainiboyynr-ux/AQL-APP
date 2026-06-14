import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Plus, Minus } from 'lucide-react';

export default function DefectSection({ 
  title, 
  aqlText, 
  defects, 
  defectList, 
  onDefectChange, 
  colorTheme 
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Styling based on colorTheme
  const themeStyles = {
    red: {
      header: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300',
      badge: 'bg-rose-500 text-white',
      border: 'border-rose-100 dark:border-rose-950/50',
      tagline: 'AQL 0% — Rejection on 1 defect'
    },
    orange: {
      header: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300',
      badge: 'bg-amber-500 text-white',
      border: 'border-amber-100 dark:border-amber-950/50',
      tagline: 'AQL 1% — Maximum 1% failure rate allowed'
    },
    blue: {
      header: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-300',
      badge: 'bg-blue-500 text-white',
      border: 'border-blue-100 dark:border-blue-950/50',
      tagline: 'AQL 4% — Maximum 4% failure rate allowed'
    }
  }[colorTheme || 'blue'];

  const toggleOpen = () => setIsOpen(!isOpen);

  const updateCount = (id, newCount) => {
    const validCount = Math.max(0, parseInt(newCount) || 0);
    const existing = defectList.find(d => d.id === id) || { id, count: 0, observation: '' };
    onDefectChange(id, { ...existing, count: validCount });
  };

  const updateObservation = (id, observation) => {
    const existing = defectList.find(d => d.id === id) || { id, count: 0, observation: '' };
    onDefectChange(id, { ...existing, observation });
  };

  return (
    <div className="mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full p-4 flex items-center justify-between border-b text-left font-display font-semibold transition-colors duration-150 ${themeStyles.header}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-black/5 dark:bg-white/10">
            {aqlText}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-normal opacity-80 hidden xs:inline">{themeStyles.tagline}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
          {defects.map((def, index) => {
            const currentData = defectList.find(d => d.id === def.id) || { count: 0, observation: '' };
            return (
              <div 
                key={def.id} 
                className={`pt-4 first:pt-0 flex flex-col gap-3`}
              >
                {/* Defect Name & Label */}
                <div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 mt-0.5">
                      {index + 1}.
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {def.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {def.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Defect Counter with big tap targets */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 w-24">
                      Defect Count:
                    </label>
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner w-36">
                      <button
                        type="button"
                        onClick={() => updateCount(def.id, currentData.count - 1)}
                        className="w-12 h-12 flex items-center justify-center bg-slate-55 text-slate-600 active:bg-slate-150 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 select-none cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <input
                        type="number"
                        min="0"
                        value={currentData.count === 0 ? '' : currentData.count}
                        placeholder="0"
                        onChange={(e) => updateCount(def.id, e.target.value)}
                        className="w-12 h-12 text-center font-mono font-bold text-sm bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button
                        type="button"
                        onClick={() => updateCount(def.id, currentData.count + 1)}
                        className="w-12 h-12 flex items-center justify-center bg-slate-55 text-slate-600 active:bg-slate-150 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 select-none cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Observation Field */}
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      placeholder="Observation / details (optional)..."
                      value={currentData.observation || ''}
                      onChange={(e) => updateObservation(def.id, e.target.value)}
                      className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
