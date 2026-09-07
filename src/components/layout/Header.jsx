import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Wifi, WifiOff, LogOut, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { user, logout, appsScriptUrl } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Case ID, Subject Name, Document #..." 
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Connection Pill & User Info */}
      <div className="flex items-center gap-4">
        {/* Apps Script Connection Status */}
        <button 
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
            appsScriptUrl 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
          }`}
          title={appsScriptUrl ? `Connected to Google Apps Script: ${appsScriptUrl}` : 'Running with local mock engine. Click to connect Google Apps Script Web App.'}
        >
          {appsScriptUrl ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Google Apps Script Connected</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Local Mock Backend Engine</span>
            </>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-200 leading-none">{user?.name || 'Officer'}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
