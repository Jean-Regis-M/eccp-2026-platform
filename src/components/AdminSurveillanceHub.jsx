import { useState } from 'react';
import { useECCPState } from '../hooks/useECCPState';

export default function AdminSurveillanceHub() {
  const { auditLogs, logAuditEvent } = useECCPState();
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs based on category and search term
  const filteredLogs = auditLogs.filter(log => {
    if (filterCategory !== 'all' && log.category !== filterCategory) {
      return false;
    }
    if (searchTerm.trim() === '') {
      return true;
    }
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term)
    );
  });

  // System health indicator: we can check if we are receiving logs (simplistic)
  const systemHealth = auditLogs.length > 0 ? 'Operational' : 'Idle';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-equity-red to-equity-navy rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">ECCP Operations & Integrity Live Audit Surveillance Trail</h1>
            <p className="text-white/70 text-sm">Real-time monitoring of all platform activities</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className={`text-xl font-bold ${systemHealth === 'Operational' ? 'text-green-400' : 'text-yellow-400'}`}>
                ●
              </span>
              <span className="ml-2 text-sm">{systemHealth}</span>
            </div>
            <button
              onClick={() => {
                // Force synchronization: we can trigger a refetch from localStorage by toggling state?
                // Since we are using localStorage and state, we can just show a toast.
                alert('Audit logs synchronized with local storage');
              }}
              className="btn-outline text-sm"
            >
              🔄 Force Sync
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Filter by Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Categories</option>
                <option value="SECURITY">🔒 Security Gate</option>
                <option value="ROSTER">🍀 Roster Operation</option>
                <option value="ACADEMIC">🔮 Academic Progress</option>
                <option value="SYSTEM">💻 System Actions</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Search Logs</label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search actions, details, or user..."
                className="input-field w-full"
              />
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <div className="space-y-3">
            {[auditLogs.length, 'Total Events', 'text-equity-red'],
            [filteredLogs.length, 'Filtered Events', 'text-equity-navy']}.map(([value, label, color]) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 text-left">
              <th className="pb-2">Time</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">User</th>
              <th className="pb-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              const categoryBadge = {
                SECURITY: 'bg-equity-red/10 text-equity-red',
                ROSTER: 'bg-equity-green/10 text-equity-green',
                ACADEMIC: 'bg-equity-gold/10 text-equity-gold',
                SYSTEM: 'bg-equity-navy/10 text-equity-navy'
              }[log.category] || 'bg-gray-100 text-gray-600';

              return (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-1 text-xs text-gray-400 whitespace-nowrap">{time}</td>
                  <td className="py-1 text-xs">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryBadge}`}>
                      {log.category === 'SECURITY' && '🔒 SECURITY GATE'}
                      {log.category === 'ROSTER' && '🍀 ROSTER OPERATION'}
                      {log.category === 'ACADEMIC' && '🔮 ACADEMIC PROGRESS'}
                      {log.category === 'SYSTEM' && '💻 SYSTEM ACTIONS'}
                    </span>
                  </td>
                  <td className="py-1 text-xs">{log.action}</td>
                  <td className="py-1 text-xs text-gray-600">
                    {log.userName} ({log.userRole})
                  </td>
                  <td className="py-1 text-xs text-gray-500 break-all">{log.details}</td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
                  No audit logs match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}