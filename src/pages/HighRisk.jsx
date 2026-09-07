import React from 'react';
import { useCases } from '../context/CaseContext';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { SyntheticIssuerBanner } from '../components/verification/SyntheticIssuerBanner';

export const HighRisk = () => {
  const { cases } = useCases();
  const navigate = useNavigate();

  const highRiskCases = cases.filter(c => c.risk_level === 'HIGH' || c.status === 'MANUAL_REVIEW_REQUIRED');

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-rose-400" />
          <h1 className="text-2xl font-bold text-slate-100">High-Risk Case Audit Queue</h1>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">Cases flagged with deterministic overrides or risk scores &gt; 60/100</p>
      </div>

      <SyntheticIssuerBanner />

      <div className="glass-card rounded-xl border border-rose-500/30 overflow-hidden">
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs font-mono flex items-center justify-between">
          <span>Priority Queue Length: {highRiskCases.length} Cases Requiring Senior Officer Review</span>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>

        <div className="divide-y divide-slate-800">
          {highRiskCases.map(c => (
            <div key={c.case_id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-800/40 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-rose-400">{c.case_id}</span>
                  <span className="font-bold text-slate-100 text-base">{c.subject_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    HIGH RISK ({c.risk_score}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Assigned: {c.assigned_to} • Created: {new Date(c.created_at).toLocaleString()}</p>
              </div>

              <button
                onClick={() => navigate(`/verification/${c.case_id}`)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                <span>Audit Evidence</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}

          {highRiskCases.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No high risk cases currently pending review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
