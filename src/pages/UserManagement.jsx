import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Shield, KeyRound, UserCheck } from 'lucide-react';

export const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await authService.getUsers();
        setUsers(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-rose-400">Access Restricted</h2>
        <p className="text-xs text-slate-400 font-mono">User Management is accessible only to ADMIN role accounts.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User & Role Management</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Manage verification officers, supervisors, and administrative personnel</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Add New Officer</span>
        </button>
      </div>

      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">USER ID</th>
                <th className="p-3.5">FULL NAME</th>
                <th className="p-3.5">EMAIL ADDRESS</th>
                <th className="p-3.5">ASSIGNED ROLE</th>
                <th className="p-3.5">STATUS</th>
                <th className="p-3.5">LAST LOGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {users.map(u => (
                <tr key={u.user_id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3.5 text-indigo-400">{u.user_id}</td>
                  <td className="p-3.5 font-semibold text-slate-200">{u.name}</td>
                  <td className="p-3.5 text-slate-300">{u.email}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                      u.role === 'SUPERVISOR' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-emerald-400 font-semibold">{u.status}</span>
                  </td>
                  <td className="p-3.5 text-slate-400">{new Date(u.last_login).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
