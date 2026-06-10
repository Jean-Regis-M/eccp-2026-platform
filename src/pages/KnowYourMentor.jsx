import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function KnowYourMentor() {
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);

  useEffect(() => {
    if (user?.mentor) {
      setMentor(user.mentor);
    } else if (user?.mentor_id) {
      api.getUser(user.mentor_id).then(u => setMentor(u)).catch(() => {});
    }
  }, [user]);

  if (!mentor) return <div className="text-center py-12 text-gray-400">Loading mentor information...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center py-12">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-equity-red to-equity-navy flex items-center justify-center text-5xl text-white font-display font-bold mb-6 shadow-xl">
          {mentor.mentor_photo ? (
            <img src={mentor.mentor_photo} alt={mentor.name} className="w-full h-full rounded-full object-cover" />
          ) : mentor.name.charAt(0)}
        </div>
        <h1 className="font-display text-3xl font-bold text-equity-dark mb-2">{mentor.name}</h1>
        <p className="text-equity-red font-medium mb-6">Your ECCP 2026 Mentor</p>

        <div className="text-left max-w-md mx-auto mb-8">
          <p className="text-gray-600 leading-relaxed">{mentor.mentor_bio || 'Your dedicated mentor committed to guiding you through the college application journey. Reach out anytime!'}</p>
        </div>

        <div className="flex justify-center gap-4">
          {mentor.mentor_linkedin && (
            <a href={mentor.mentor_linkedin} target="_blank" rel="noopener"
              className="flex items-center gap-2 bg-[#0077B5] text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
              <span>🔗</span> LinkedIn
            </a>
          )}
          {mentor.mentor_instagram && (
            <a href={mentor.mentor_instagram} target="_blank" rel="noopener"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
              <span>📸</span> Instagram
            </a>
          )}
        </div>

        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">📧 {mentor.email}</p>
          <a href={`mailto:${mentor.email}`} className="btn-primary mt-4 inline-block">Send Email</a>
        </div>
      </div>

      <div className="card mt-6 bg-equity-light">
        <h3 className="font-semibold mb-3">Mentor Guidelines Reminder</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Mentors are available Mon–Fri 6–10 PM, Sat 8 AM–5 PM</li>
          <li>• Reach out for essay review, SAT prep guidance, and motivation</li>
          <li>• All communications are confidential</li>
          <li>• Your mentor will write your recommendation letter</li>
        </ul>
      </div>
    </div>
  );
}
