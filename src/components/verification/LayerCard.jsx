import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, FileText, UserCheck, ShieldAlert, Database, Scale } from 'lucide-react';

export const LayerCard = ({ layerNumber, title, status, badgeText, score, children }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'PASS':
      case 'MATCH':
      case 'NORMAL':
      case 'CONSISTENT':
      case 'VERIFIED':
      case 'LOW':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        };
      case 'WARNING':
      case 'REVIEW':
      case 'SUSPICIOUS':
      case 'INCONSISTENT':
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'FAIL':
      case 'MISMATCH':
      case 'HIGH':
      case 'REJECTED':
      case 'REVOKED':
      case 'EXPIRED':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <XCircle className="w-5 h-5 text-rose-400" />
        };
      default:
        return {
          bg: 'bg-slate-800/40',
          border: 'border-slate-700',
          badge: 'bg-slate-700 text-slate-300 border-slate-600',
          icon: <Info className="w-5 h-5 text-slate-400" />
        };
    }
  };

  const getLayerIcon = () => {
    switch (layerNumber) {
      case 1: return <FileText className="w-4 h-4 text-indigo-400" />;
      case 2: return <UserCheck className="w-4 h-4 text-indigo-400" />;
      case 3: return <ShieldAlert className="w-4 h-4 text-indigo-400" />;
      case 4: return <Database className="w-4 h-4 text-indigo-400" />;
      case 5: return <Scale className="w-4 h-4 text-indigo-400" />;
      default: return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  const style = getStatusColor();

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-5 backdrop-blur-sm transition-all hover:border-slate-600/80`}>
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
            {getLayerIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">Layer {layerNumber}</span>
              <h3 className="font-semibold text-sm text-slate-100">{title}</h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {score !== undefined && score !== null && (
            <span className="text-xs font-mono font-medium text-slate-400">
              Score: <strong className="text-slate-200">{Math.round(score * 100)}%</strong>
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${style.badge} flex items-center gap-1.5`}>
            {style.icon}
            {badgeText || status}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-300 space-y-2">
        {children}
      </div>
    </div>
  );
};
