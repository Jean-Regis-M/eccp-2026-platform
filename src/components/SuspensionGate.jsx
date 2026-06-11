import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useECCPState } from '../hooks/useECCPState';

export default function SuspensionGate() {
  const { user } = useAuth();
  const { scholars } = useECCPState();

  // Find the scholar record for the current user
  const scholar = scholars.find(s => s.pfNumber === user.pf_number);

  if (!scholar || !scholar.isSuspended) {
    // If not suspended, redirect to appropriate dashboard
    return null; // This will be handled by routing logic
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-equity-red/20 flex items-center justify-center mb-4">
            <span className="text-equity-red text-3xl">🔒</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Administrative Account Security Gate
          </h2>
          <p className="text-white/80">
            A administrative hold has been applied to PF Number: {scholar.pfNumber}
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-2">Reason for Hold:</h3>
          <p className="text-slate-300">{scholar.suspensionReason || "Standard Administrative Hold"}</p>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-2">Action Required:</h3>
          <p className="text-slate-300">
            Please schedule an advising review session with your assigned mentor,
            {scholar.mentorName || 'your assigned mentor'} ({scholar.mentorEmail || 'contact available in dashboard'}),
            to restore your authorization credentials.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              // In a real app, this might open a contact form or show mentor contact info
              alert(`Contact your mentor: ${scholar.mentorName || 'Your assigned mentor'} at ${scholar.mentorEmail || 'available in dashboard'}`);
            }}
            className="w-full bg-equity-red hover:bg-equity-red/80 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            [ Contact Counselor Support ]
          </button>
        </div>
      </div>
    </div>
  );
}