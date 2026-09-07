import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  PlusCircle, 
  FolderKanban, 
  AlertOctagon, 
  BarChart3, 
  History, 
  Users, 
  Settings, 
  UserCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, switchRole, isAdmin, isSupervisor } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Verification', path: '/new-verification', icon: PlusCircle },
    { label: 'Cases History', path: '/cases', icon: FolderKanban },
    { label: 'High Risk Cases', path: '/high-risk', icon: AlertOctagon, badge: 'Priority' },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/audit-logs', icon: History },
  ];

  if (isAdmin) {
    navItems.push({ label: 'User Management', path: '/users', icon: Users });
  }

  navItems.push({ label: 'System Settings', path: '/settings', icon: Settings });

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              Sentinel<span className="text-indigo-400">ID</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">5-Layer Risk Engine</p>
          </div>
        </div>

        {/* User Role Indicator & Quick Role Switcher */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">Active Session Role</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              user?.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              user?.role === 'SUPERVISOR' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {user?.role || 'OFFICER'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800 text-[11px]">
            <button 
              onClick={() => switchRole('OFFICER')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-all ${user?.role === 'OFFICER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Officer
            </button>
            <button 
              onClick={() => switchRole('SUPERVISOR')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-all ${user?.role === 'SUPERVISOR' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Supervisor
            </button>
            <button 
              onClick={() => switchRole('ADMIN')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-all ${user?.role === 'ADMIN' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-300">5-Layer Architecture</span>
        </div>
        <p className="leading-tight">Google Apps Script & Sheets Powered Engine</p>
      </div>
    </aside>
  );
};
