import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertOctagon, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DecisionModal = ({ isOpen, onClose, onSubmitDecision, caseId, currentStatus }) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('APPROVED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmitDecision(caseId, selectedStatus, notes);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">Human Determination</span>
          <h3 className="text-lg font-bold text-slate-100 mt-0.5">Submit Officer Decision</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">Case ID: {caseId}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">Select Decision</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('APPROVED')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  selectedStatus === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('MANUAL_REVIEW_REQUIRED')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  selectedStatus === 'MANUAL_REVIEW_REQUIRED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                <span>Escalate</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('REJECTED')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  selectedStatus === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Officer Review Notes & Justification</span>
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter audit justification notes for your decision..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
            Signed by: <span className="text-slate-200 font-semibold">{user?.email}</span> ({user?.role})
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Save Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
