import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowRight, UserCheck, ShieldAlert, KeyRound } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('officer@sentinel.id');
  const [role, setRole] = useState('OFFICER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, role);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-md w-full glass-panel border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl" />

        {/* Brand */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">SentinelID Platform</h1>
          <p className="text-xs text-slate-400 font-mono">5-Layer AI-Assisted Risk Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Quick Role Selector Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Select Access Role</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'OFFICER', label: 'Officer', icon: UserCheck },
                { id: 'SUPERVISOR', label: 'Supervisor', icon: ShieldAlert },
                { id: 'ADMIN', label: 'Admin', icon: KeyRound }
              ].map(r => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      setEmail(`${r.id.toLowerCase()}@sentinel.id`);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      role === r.id
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Security PIN / Access Token</label>
            <div className="relative">
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Access Verification Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-4 relative z-10">
          Powered by Google Apps Script API & Google Sheets
        </div>
      </div>
    </div>
  );
};
