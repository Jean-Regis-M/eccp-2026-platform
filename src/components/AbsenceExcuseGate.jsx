import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useECCPState } from '../hooks/useECCPState';

export default function AbsenceExcuseGate({ onExcuseSubmitted }) {
  const { user } = useAuth();
  const { scholars, sessions, submitAbsenceExcuse } = useECCPState();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Find the scholar record for the current user
  const scholar = scholars.find(s => s.pfNumber === user.pf_number);

  // If no scholar record, allow access (shouldn't happen in normal flow)
  if (!scholar) {
    onExcuseSubmitted();
    return null;
  }

  // Determine which session was missed (lastMissedSessionId from scholar)
  const missedSession = sessions.find(s => s.id === scholar.lastMissedSessionId);
  const sessionName = missedSession ? `${missedSession.topic} (Week ${missedSession.id})` : 'Previous Session';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 100) {
      setError('Please provide a minimum 100-character explanation for your absence.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Submit the excuse via the hook
      submitAbsenceExcuse(scholar.pfNumber, scholar.lastMissedSessionId || '', reason.trim(), user);

      // Clear the gating flag by submitting excuse
      setSubmitting(false);
      onExcuseSubmitted();
    } catch (err) {
      setSubmitting(false);
      setError('Failed to submit excuse. Please try again.');
    }
  };

  if (!scholar.lastMissedSessionId) {
    // If no missed session recorded, allow access
    onExcuseSubmitted();
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-equity-red/20 flex items-center justify-center mb-4">
            <span className="text-equity-red text-3xl">⚠️</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Responsibility Corner: Missing Sign-Off
          </h2>
          <p className="text-white/80">
            Our registers show you were absent during: {sessionName}
          </p>
          <p className="text-white/80 mt-2">
            Before you can research university portals, review SAT results, or use ECCP dashboards,
            you must submit a formal reason for your absence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-700/50 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-2">Enter Your Professional Explanation:</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="I was down with malaria on Monday and was seeking medical care..."
              className="w-full min-h-[100px] p-3 bg-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-equity-red"
              rows={4}
            ></textarea>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-slate-400">* Minimum 100 characters required.</span>
              <span className="text-slate-300">{reason.length}/500</span>
            </div>
            {error && <p className="mt-2 text-equity-red">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-equity-red hover:bg-equity-red/80 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Formal Excuse & Unlock Platform'}
          </button>
        </form>
      </div>
    </div>
  );
}