import React, { useState } from 'react';
import { useCases } from '../context/CaseContext';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FolderKanban, PlusCircle, ArrowUpRight } from 'lucide-react';

export const Cases = () => {
  const { cases, loading } = useCases();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.case_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Verification Cases Registry</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Full historical case repository stored in Google Sheets</p>
        </div>

        <button
          onClick={() => navigate('/new-verification')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Case</span>
        </button>
      </div>

      {/* Search & Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by Case ID or Subject Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">Risk Filter:</span>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(rf => (
            <button
              key={rf}
              onClick={() => setRiskFilter(rf)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                riskFilter === rf ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">CASE ID</th>
                <th className="p-3.5">SUBJECT NAME</th>
                <th className="p-3.5">ASSIGNED OFFICER</th>
                <th className="p-3.5">RISK SCORE</th>
                <th className="p-3.5">RISK LEVEL</th>
                <th className="p-3.5">DECISION STATUS</th>
                <th className="p-3.5">UPDATED AT</th>
                <th className="p-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map(item => (
                <tr key={item.case_id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3.5 font-mono font-medium text-indigo-300">{item.case_id}</td>
                  <td className="p-3.5 font-semibold text-slate-200">{item.subject_name}</td>
                  <td className="p-3.5 font-mono text-slate-400">{item.assigned_to}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-200">{item.risk_score}/100</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono border ${
                      item.risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      item.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300 font-mono text-[11px]">{item.status.replace(/_/g, ' ')}</td>
                  <td className="p-3.5 text-slate-400 font-mono">{new Date(item.updated_at).toLocaleDateString()}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => navigate(`/verification/${item.case_id}`)}
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-all"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
