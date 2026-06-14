import React from 'react';
import { ShieldCheck, AlertTriangle, XOctagon } from 'lucide-react';

export default function DecisionBadge({ metrics }) {
  const { decision, reason, totalCritical, defectPctMajor, defectPctMinor } = metrics;

  const config = {
    ACCEPT: {
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50',
      badge: 'bg-emerald-500 text-white',
      icon: ShieldCheck,
      text: 'ACCEPT',
      desc: 'All defects are within acceptance limits. Approved for finished goods release.'
    },
    HOLD: {
      color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50',
      badge: 'bg-amber-500 text-white',
      icon: AlertTriangle,
      text: 'HOLD',
      desc: 'Defect ratios exceed standard limits. A QA Manager must review the batch.'
    },
    REJECT: {
      color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50',
      badge: 'bg-rose-500 text-white',
      icon: XOctagon,
      text: 'REJECT',
      desc: 'Critical defects detected or extreme failure. Batch is rejected immediately.'
    }
  };

  const current = config[decision] || config.HOLD;
  const Icon = current.icon;

  return (
    <div className={`p-5 rounded-2xl border ${current.color} transition-all duration-300 shadow-md`}>
      <div className="flex items-center gap-3">
        <span className={`p-2.5 rounded-xl ${current.badge} shadow-sm`}>
          <Icon className="w-6 h-6 animate-pulse" />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-75 block">
            AQL Evaluation Decision
          </span>
          <h3 className="text-xl font-bold tracking-tight font-display">
            {current.text}
          </h3>
        </div>
      </div>
      
      <p className="mt-3 text-xs leading-relaxed opacity-90">
        {reason || current.desc}
      </p>

      {/* Mini-metrics overview */}
      <div className="mt-4 pt-3 border-t border-current/10 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="block font-medium opacity-75">Critical (AQL 0%)</span>
          <span className={`block font-bold mt-0.5 ${totalCritical > 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
            {totalCritical} Found
          </span>
        </div>
        <div>
          <span className="block font-medium opacity-75">Major (AQL 1%)</span>
          <span className={`block font-bold mt-0.5 ${defectPctMajor > 1 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
            {defectPctMajor.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="block font-medium opacity-75">Minor (AQL 4%)</span>
          <span className={`block font-bold mt-0.5 ${defectPctMinor > 4 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
            {defectPctMinor.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
