import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Database, Save, CheckCircle2, AlertTriangle, ExternalLink, Code, Layers } from 'lucide-react';
import { SyntheticIssuerBanner } from '../components/verification/SyntheticIssuerBanner';

export const Settings = () => {
  const { appsScriptUrl, setAppsScriptUrl } = useAuth();
  const [urlInput, setUrlInput] = useState(appsScriptUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setAppsScriptUrl(urlInput.trim());
    setTestResult({ type: 'success', message: 'Apps Script Web App URL updated successfully!' });
  };

  const handleTestConnection = async () => {
    if (!urlInput) {
      setTestResult({ type: 'error', message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${urlInput}?action=getDashboardStats`);
      const data = await res.json();
      if (data.success) {
        setTestResult({ type: 'success', message: 'Connection Successful! Connected to Apps Script & Google Sheets database.' });
      } else {
        setTestResult({ type: 'error', message: `Apps Script error: ${data.message}` });
      }
    } catch (err) {
      setTestResult({ type: 'error', message: `Connection failed: ${err.message}. Verify Web App deployment access is set to "Anyone".` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Configuration & Integration Settings</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Manage Google Apps Script API endpoint & database connections</p>
      </div>

      <SyntheticIssuerBanner />

      {/* Google Apps Script Integration Section */}
      <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Google Apps Script Web App Endpoint</h3>
            <p className="text-xs text-slate-400 font-mono">Connect React frontend to your Google Sheets backend API</p>
          </div>
        </div>

        <form onSubmit={handleSaveUrl} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Web App Deployment URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              testResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Migration to FastAPI + PostgreSQL Info Card */}
      <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">Architecture Migration Guide (FastAPI + PostgreSQL)</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          This system uses an abstract API service layer (<code className="text-indigo-400 font-mono">src/services/api.js</code>).
          To migrate from Google Sheets/Apps Script to FastAPI + PostgreSQL:
        </p>

        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 font-mono bg-slate-950 p-4 rounded-lg border border-slate-800">
          <li>Deploy FastAPI microservice with PostgreSQL ORM models matching the 10 Google Sheets tables.</li>
          <li>Update endpoint URLs inside <code className="text-indigo-300">src/services/api.js</code>.</li>
          <li>No React components or page controllers require modification.</li>
        </ol>
      </div>
    </div>
  );
};
