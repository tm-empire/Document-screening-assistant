import React from 'react';
import { ShieldCheck, AlertOctagon, Info, AlertTriangle, ArrowRight } from 'lucide-react';

export const EvidenceSummary = ({ riskResult, onOpenDecisionModal }) => {
  if (!riskResult) return null;

  const { risk_score = 0, risk_level = 'LOW', decision, reasons = [], overrides = [] } = riskResult;

  const getRiskColor = () => {
    switch (risk_level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          bar: 'bg-emerald-500',
          icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          bar: 'bg-amber-500',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />
        };
      case 'HIGH':
      default:
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          bar: 'bg-rose-500',
          icon: <AlertOctagon className="w-6 h-6 text-rose-400" />
        };
    }
  };

  const style = getRiskColor();

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-6 space-y-6 backdrop-blur-md`}>
      {/* Top Header metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">Layer 5 Decision</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${style.badge}`}>
                {risk_level} RISK
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">
              {decision ? decision.replace(/_/g, ' ') : 'MANUAL REVIEW REQUIRED'}
            </h2>
          </div>
        </div>

        {/* Risk Score Gauge Meter */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Overall Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold font-mono ${style.text}`}>{risk_score}</span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
          </div>
          
          <div className="w-28 space-y-1">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${style.bar} transition-all duration-700 rounded-full`} 
                style={{ width: `${risk_score}%` }} 
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0 (Safe)</span>
              <span>100 (Critical)</span>
            </div>
          </div>

          {onOpenDecisionModal && (
            <button
              onClick={onOpenDecisionModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <span>Officer Action</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Critical Overrides alert if present */}
      {overrides.length > 0 && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-200 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="font-semibold block text-rose-300">Deterministic Override Engaged:</strong>
            <span className="font-mono text-[11px] text-rose-300/80">{overrides.join(' • ')}</span>
          </div>
        </div>
      )}

      {/* Explainable Reasons */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Why was this risk level assigned?</span>
        </h4>

        <ul className="space-y-2">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal & System Disclaimer */}
      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>Automated analysis identified evidence. Manual review is recommended.</span>
        <span className="text-slate-500">Human Officer holds final decision authority</span>
      </div>
    </div>
  );
};
