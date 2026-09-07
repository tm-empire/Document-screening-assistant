import React from 'react';
import { BarChart3, Activity, Zap, CheckCircle2, Clock } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

export const Analytics = () => {
  const layerPerformanceData = [
    { layer: 'L1: OCR', passRate: 96, avgTimeSec: 1.2 },
    { layer: 'L2: Face', passRate: 88, avgTimeSec: 1.4 },
    { layer: 'L3: Forensics', passRate: 92, avgTimeSec: 1.5 },
    { layer: 'L4: Issuer', passRate: 84, avgTimeSec: 1.3 },
    { layer: 'L5: Risk Engine', passRate: 98, avgTimeSec: 0.2 }
  ];

  const throughputData = [
    { time: '08:00', casesProcessed: 12 },
    { time: '10:00', casesProcessed: 28 },
    { time: '12:00', casesProcessed: 45 },
    { time: '14:00', casesProcessed: 38 },
    { time: '16:00', casesProcessed: 52 },
    { time: '18:00', casesProcessed: 30 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Verification Analytics & Performance</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Layer performance metrics, processing latencies, and verification accuracy</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Average Processing Latency</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100 font-mono">5.6 sec</p>
          <p className="text-[11px] text-emerald-400 font-mono">End-to-End Across All 5 Layers</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Overall Verification Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100 font-mono">98.4%</p>
          <p className="text-[11px] text-slate-400 font-mono">Validated Against Ground Truth</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>System Uptime</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100 font-mono">99.9%</p>
          <p className="text-[11px] text-indigo-400 font-mono">Google Apps Script Web Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Pass Rate by Verification Layer (%)</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={layerPerformanceData}>
                <XAxis dataKey="layer" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="passRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Hourly Verification Throughput</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="casesProcessed" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1' }} name="Cases Processed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
