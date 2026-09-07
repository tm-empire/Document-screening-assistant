import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import { History, Search, Shield, Filter } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await auditService.getLogs();
        setLogs(data || []);
      } catch (e) {
        console.error('Failed to load audit logs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Audit Trail</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Immutable security & operational log table stored in Google Sheets (AUDIT_LOGS)</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Action, User ID, Case ID, or Details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredLogs.length} audit entries
        </div>
      </div>

      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">LOG ID</th>
                <th className="p-3.5">TIMESTAMP</th>
                <th className="p-3.5">USER / ACTOR</th>
                <th className="p-3.5">CASE ID</th>
                <th className="p-3.5">ACTION</th>
                <th className="p-3.5">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map(item => (
                <tr key={item.log_id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3.5 text-indigo-400">{item.log_id}</td>
                  <td className="p-3.5 text-slate-400">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="p-3.5 font-semibold text-slate-200">{item.user_id}</td>
                  <td className="p-3.5 text-indigo-300">{item.case_id}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {item.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-xs truncate">{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
