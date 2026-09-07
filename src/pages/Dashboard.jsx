import React from 'react';
import { useCases } from '../context/CaseContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  FolderKanban, 
  PlusCircle, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { SyntheticIssuerBanner } from '../components/verification/SyntheticIssuerBanner';

export const Dashboard = () => {
  const { cases, stats, loading } = useCases();
  const navigate = useNavigate();

  const totalCases = stats?.total_cases || cases.length || 0;
  const lowRisk = stats?.low_risk || cases.filter(c => c.risk_level === 'LOW').length || 0;
  const mediumRisk = stats?.medium_risk || cases.filter(c => c.risk_level === 'MEDIUM').length || 0;
  const highRisk = stats?.high_risk || cases.filter(c => c.risk_level === 'HIGH').length || 0;
  const pendingReview = stats?.pending_review || cases.filter(c => c.status === 'MANUAL_REVIEW_REQUIRED' || c.status === 'PROCESSING').length || 0;

  const pieData = [
    { name: 'Low Risk', value: lowRisk, color: '#10b981' },
    { name: 'Medium Risk', value: mediumRisk, color: '#f59e0b' },
    { name: 'High Risk', value: highRisk, color: '#f43f5e' }
  ];

  const barData = [
    { day: 'Mon', verifications: 14, highRisk: 2 },
    { day: 'Tue', verifications: 22, highRisk: 4 },
    { day: 'Wed', verifications: 18, highRisk: 1 },
    { day: 'Thu', verifications: 29, highRisk: 5 },
    { day: 'Fri', verifications: 25, highRisk: 3 },
    { day: 'Sat', verifications: 12, highRisk: 1 },
    { day: 'Sun', verifications: 8, highRisk: 0 }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Verification Intelligence Dashboard</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Real-time metrics from 5-Layer Rule Engine</p>
        </div>

        <button
          onClick={() => navigate('/new-verification')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Verification Case</span>
        </button>
      </div>

      <SyntheticIssuerBanner compact />

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Cases', value: totalCases, icon: FolderKanban, color: 'text-indigo-400', bg: 'border-slate-800' },
          { label: 'Low Risk (Verified)', value: lowRisk, icon: ShieldCheck, color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/5' },
          { label: 'Medium Risk', value: mediumRisk, icon: AlertTriangle, color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/5' },
          { label: 'High Risk (Flagged)', value: highRisk, icon: AlertOctagon, color: 'text-rose-400', bg: 'border-rose-500/30 bg-rose-500/5' },
          { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/5' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`glass-card rounded-xl p-4 border ${card.bg} space-y-2`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-medium uppercase tracking-wider">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-slate-100 font-mono">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Breakdown Pie Chart */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Risk Distribution Breakdown</span>
          </h3>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low ({lowRisk})</span>
            <span className="text-amber-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Medium ({mediumRisk})</span>
            <span className="text-rose-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> High ({highRisk})</span>
          </div>
        </div>

        {/* Verification Activity Weekly Bar Chart */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4 lg:col-span-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>Verification Volume & High Risk Trends</span>
          </h3>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="verifications" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Cases" />
                <Bar dataKey="highRisk" fill="#f43f5e" radius={[4, 4, 0, 0]} name="High Risk Flagged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Verification Activity Table */}
      <div className="glass-card rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recent Verification Cases</h3>
          <button onClick={() => navigate('/cases')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">CASE ID</th>
                <th className="p-3">SUBJECT NAME</th>
                <th className="p-3">RISK SCORE</th>
                <th className="p-3">RISK LEVEL</th>
                <th className="p-3">DECISION STATUS</th>
                <th className="p-3">CREATED</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cases.slice(0, 5).map((item) => (
                <tr key={item.case_id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3 font-mono font-medium text-indigo-300">{item.case_id}</td>
                  <td className="p-3 font-semibold text-slate-200">{item.subject_name}</td>
                  <td className="p-3 font-mono font-bold">{item.risk_score}/100</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      item.risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      item.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-mono text-[11px]">{item.status.replace(/_/g, ' ')}</td>
                  <td className="p-3 text-slate-400 font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigate(`/verification/${item.case_id}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-all"
                    >
                      Review Evidence
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
