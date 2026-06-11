import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useECCPState } from '../hooks/useECCPState';

export default function AttendanceModal({ session, open, onClose, onSaved }) {
  const [scholars, setScholars] = useState([]);
  const [canMark, setCanMark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { logAuditEvent } = useECCPState();

  useEffect(() => {
    if (!open || !session) return;
    setLoading(true);
    api.getAttendance(session.id).then(data => {
      setScholars(data.scholars || []);
      setCanMark(data.can_mark);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, session]);

  const toggle = (id) => {
    setScholars(prev => prev.map(s => s.id === id ? { ...s, attended: s.attended ? 0 : 1 } : s));
  };

  const markAll = (val) => setScholars(prev => prev.map(s => ({ ...s, attended: val ? 1 : 0 })));

  const save = async () => {
    setSaving(true);
    try {
      const payload = scholars.map(s => ({ user_id: s.id, attended: s.attended ? 1 : 0 }));
      const result = await api.markAttendance(session.id, payload);
      const present = payload.filter(s => s.attended).length;
      alert(result.message || `Attendance saved — ${present} of ${scholars.length} scholars marked present.`);
      // Log attendance marked (academic progress)
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Attendance marked',
        details: {
          sessionId: session.id,
          sessionTopic: session.topic,
          presentCount: present,
          totalScholars: scholars.length
        },
        user
      });
      onSaved?.();
      onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const present = scholars.filter(s => s.attended).length;

  return (
    <Modal open={open} onClose={onClose} title={`Mark Attendance — ${session?.topic}`} wide>
      {loading ? <p className="animate-pulse text-gray-400">Loading scholars...</p> : (
        <>
          <div className="bg-equity-navy/5 rounded-xl p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-equity-dark">{session?.date}</p>
              <p className="text-sm text-gray-500">Select scholars who attended this session</p>
            </div>
            <span className="badge bg-green-100 text-green-800 text-lg px-4 py-2">{present}/{scholars.length} Present</span>
          </div>

          {!canMark && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl mb-4 text-sm">
              This session is in the future. Attendance can only be marked on or after the session date.
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => markAll(true)} className="text-sm text-green-600 hover:underline">Mark All Present</button>
            <button type="button" onClick={() => markAll(false)} className="text-sm text-red-600 hover:underline">Mark All Absent</button>
          </div>

          <div className="grid md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {scholars.map(s => (
              <button key={s.id} type="button" onClick={() => canMark && toggle(s.id)} disabled={!canMark}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  s.attended ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                } ${!canMark ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${s.attended ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {s.attended ? '✓' : ''}
                </div>
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400 font-mono">PF {s.pf_number}</p>
                </div>
              </button>
            ))}
          </div>

          {canMark && (
            <button onClick={save} disabled={saving} className="btn-primary w-full mt-6">
              {saving ? 'Saving...' : `Confirm Attendance (${present} scholars)`}
            </button>
          )}
        </>
      )}
    </Modal>
  );
}