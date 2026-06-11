import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useECCPState } from '../hooks/useECCPState';

export default function Rankings() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.getRankings().then(data => {
      setRankings(data);
      // Log rankings viewed (academic progress)
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Rankings viewed',
        details: {
          userRole: user.role,
          rankingsCount: data.length,
          topScore: data.length > 0 ? data[0].score : 0
        },
        user
      });
    }).catch(() => {});
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.exportRankings();
      // Log rankings exported (system action)
      logAuditEvent({
        category: 'SYSTEM',
        action: 'Rankings exported',
        details: {
          userRole: user.role,
          rankingsCount: rankings.length
        },
        user
      );
    } catch (e) { alert(e.message); }
    setExporting(false);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">🏆 Scholar Rankings</h1>
          <p className="text-gray-500 mt-1">
            {user.role === 'mentor' ? 'Rankings for your assigned scholars only' : 'All ECCP 2026 scholars — updated daily'}
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-primary shrink-0">
          {exporting ? 'Exporting...' : '📥 Export Rankings (CSV)'}
        </button>
      </div>

      {rankings.length >= 3 && (
        <div className="flex justify-center items-end gap-4 md:gap-8 mb-8">
          {[1, 0, 2].map(idx => {
            const r = rankings[idx];
            if (!r) return null;
            const heights = ['h-28 md:h-36', 'h-36 md:h-44', 'h-24 md:h-32'];
            return (
              <div key={r.id} className={`text-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                <div className={`${heights[idx]} w-24 md:w-32 bg-gradient-to-t from-equity-red to-red-400 rounded-t-2xl flex flex-col items-center justify-end pb-3 text-white shadow-xl`}>
                  <span className="text-3xl">{medals[idx]}</span>
                  <p className="font-bold text-sm mt-1 px-2 truncate w-full">{r.name.split(' ').pop()}</p>
                  <p className="text-xs opacity-90">{r.score} pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-equity-dark text-white">
              <tr>
                <th className="py-3 px-4 text-left">Rank</th>
                <th className="py-3 px-4 text-left">PF</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">School</th>
                {user.role === 'admin' && <th className="py-3 px-4 text-left">Mentor</th>}
                <th className="py-3 px-4 text-left">Attendance</th>
                <th className="py-3 px-4 text-left">Quizzes</th>
                <th className="py-3 px-4 text-left">Feedback</th>
                <th className="py-3 px-4 text-left">Score</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(r => (
                <tr key={r.id} className={`border-b border-gray-50 hover:bg-red-50/30 transition ${r.rank <= 3 ? 'bg-yellow-50/40' : ''}`}>
                  <td className="py-3 px-4 font-bold">{r.rank <= 3 ? medals[r.rank - 1] : `#${r.rank}`}</td>
                  <td className="py-3 px-4 font-mono text-xs">{r.pf_number}</td>
                  <td className="py-3 px-4 font-medium">{r.name}</td>
                  <td className="py-3 px-4 text-gray-500">{r.school || '—'}</td>
                  {user.role === 'admin' && <td className="py-3 px-4">{r.mentor_name || '—'}</td>}
                  <td className="py-3 px-4">{r.attendance}</td>
                  <td className="py-3 px-4">{r.quizzes_taken}</td>
                  <td className="py-3 px-4">{r.feedback_given}</td>
                  <td className="py-3 px-4"><span className="badge bg-equity-red/10 text-equity-red font-bold text-sm">{r.score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
