import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { safeJsonParse, ensureArray } from '../utils/safe';
import { useAutosave } from '../hooks/useAutosave';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [insights, setInsights] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const restoredRef = useRef(false);
  const { draft, lastSaved, clearDraft } = useAutosave('profile', form, { enabled: !!user && Object.keys(form).length > 0 });

  useEffect(() => {
    if (user) {
      const pd = safeJsonParse(user.profile_data, {});
      const baseForm = {
        phone: user.phone || '', school: user.school || '',
        career_interests: pd.career_interests || '', subjects: pd.subjects || '', goals: pd.goals || '',
        strengths: pd.strengths || '', challenges: pd.challenges || '', extracurriculars: pd.extracurriculars || '',
        dream_universities: pd.dream_universities || '', hobbies: pd.hobbies || '', languages: pd.languages || '',
        application_status: pd.application_status || 'planning',
        target_universities: pd.target_universities || '',
        universities_applying: pd.universities_applying || '',
        admitted_university: pd.admitted_university || '',
        ai_acknowledgment: pd.ai_acknowledgment || false, mentor_contact_ack: pd.mentor_contact_ack || false,
        mentor_bio: user.mentor_bio || '', mentor_linkedin: user.mentor_linkedin || '', mentor_instagram: user.mentor_instagram || '',
      };
      if (!restoredRef.current) {
        setForm(draft ? { ...baseForm, ...draft } : baseForm);
        restoredRef.current = true;
      }
      if (user.role === 'mentee') api.getCareerInsights(user.id).then(setInsights).catch(() => {});
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (user.role === 'mentee') {
      if (!form.ai_acknowledgment) { setError('Please acknowledge the ethical AI use policy'); return; }
      if (!form.mentor_contact_ack) { setError('Please confirm you understand you can reach out to your mentor'); return; }
      await api.updateProfile({
        phone: form.phone, school: form.school,
        profile_data: {
          career_interests: form.career_interests, subjects: form.subjects, goals: form.goals,
          strengths: form.strengths, challenges: form.challenges, extracurriculars: form.extracurriculars,
          dream_universities: form.dream_universities, hobbies: form.hobbies, languages: form.languages,
          application_status: form.application_status, target_universities: form.target_universities,
          universities_applying: form.universities_applying, admitted_university: form.admitted_university,
          ai_acknowledgment: form.ai_acknowledgment, mentor_contact_ack: form.mentor_contact_ack,
        },
      });
    } else if (user.role === 'mentor') {
      await api.updateProfile({ mentor_bio: form.mentor_bio, mentor_linkedin: form.mentor_linkedin, mentor_instagram: form.mentor_instagram });
    } else if (user.role === 'admin') {
      await api.updateSettings(form);
      alert('Settings saved!');
      return;
    }
    await refreshUser();
    clearDraft();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">My Profile</h1>
      {saved && <div className="bg-green-50 text-green-700 p-4 rounded-xl">✅ Profile saved successfully!</div>}
      {lastSaved && !saved && <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs p-2 rounded-lg">💾 Draft autosaved at {lastSaved.toLocaleTimeString()}</div>}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      <form onSubmit={handleSave} className="card-glow space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-equity-red to-equity-navy flex items-center justify-center text-2xl font-bold text-white">{user?.name?.charAt(0)}</div>
          <div>
            <h2 className="font-semibold text-xl">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.role === 'mentee' ? `PF ${user.pf_number}` : user?.email}</p>
          </div>
        </div>

        {user?.role === 'mentee' && (
          <>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-900">
              <strong>Take this seriously!</strong> Your profile helps mentors write recommendation letters and tailor guidance. Incomplete profiles delay your application progress.
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Phone *</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field mt-1" required /></div>
              <div><label className="text-sm font-medium">High School *</label><input value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} className="input-field mt-1" required /></div>
            </div>
            <div><label className="text-sm font-medium">Subjects in High School *</label><input value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} placeholder="Math, Physics, Chemistry, English..." className="input-field mt-1" required /></div>
            <div><label className="text-sm font-medium">Career Interests *</label><input value={form.career_interests} onChange={e => setForm({ ...form, career_interests: e.target.value })} className="input-field mt-1" required /></div>
            <div><label className="text-sm font-medium">University Goals *</label><textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} className="input-field mt-1 h-20" required /></div>
            <div><label className="text-sm font-medium">Strengths</label><textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} className="input-field mt-1 h-16" /></div>
            <div><label className="text-sm font-medium">Areas for Growth</label><textarea value={form.challenges} onChange={e => setForm({ ...form, challenges: e.target.value })} className="input-field mt-1 h-16" /></div>
            <div><label className="text-sm font-medium">Extracurricular Activities</label><textarea value={form.extracurriculars} onChange={e => setForm({ ...form, extracurriculars: e.target.value })} className="input-field mt-1 h-16" /></div>
            <div><label className="text-sm font-medium">Hobbies & Interests</label><input value={form.hobbies} onChange={e => setForm({ ...form, hobbies: e.target.value })} className="input-field mt-1" /></div>
            <div><label className="text-sm font-medium">Languages Spoken</label><input value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} placeholder="English, Kinyarwanda, French..." className="input-field mt-1" /></div>
            <div><label className="text-sm font-medium">Dream Universities</label><input value={form.dream_universities} onChange={e => setForm({ ...form, dream_universities: e.target.value })} className="input-field mt-1" /></div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-equity-red mb-3">🎓 Application Status Tracker</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Status *</label>
                  <select value={form.application_status} onChange={e => setForm({ ...form, application_status: e.target.value })} className="input-field mt-1">
                    <option value="planning">Planning / Researching</option>
                    <option value="preparing">Preparing Documents</option>
                    <option value="applying">Actively Applying</option>
                    <option value="submitted">Applications Submitted</option>
                    <option value="admitted">Admitted to University</option>
                    <option value="deferred">Deferred / Waitlisted</option>
                  </select>
                </div>
                {form.application_status === 'admitted' && (
                  <div>
                    <label className="text-sm font-medium">University Admitted To</label>
                    <input value={form.admitted_university} onChange={e => setForm({ ...form, admitted_university: e.target.value })} placeholder="e.g. Stanford University" className="input-field mt-1" />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium">Universities You Plan to Apply To *</label>
                <textarea value={form.target_universities} onChange={e => setForm({ ...form, target_universities: e.target.value })} placeholder="List target universities and programs..." className="input-field mt-1 h-20" required />
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium">Universities Currently Applying To</label>
                <textarea value={form.universities_applying} onChange={e => setForm({ ...form, universities_applying: e.target.value })} placeholder="Universities where you have started or submitted applications..." className="input-field mt-1 h-16" />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3">
              <h4 className="font-semibold text-red-900">🤖 Ethical AI Use Policy</h4>
              <p className="text-sm text-red-800">AI tools may help brainstorm ideas, but all essays, personal statements, and application materials must be your authentic work. Plagiarism or undisclosed AI-generated content may result in loss of mentor support and recommendation letters.</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.ai_acknowledgment} onChange={e => setForm({ ...form, ai_acknowledgment: e.target.checked })} className="mt-1 w-5 h-5 accent-equity-red" required />
                <span className="text-sm">I understand and agree to use AI ethically in my college application process *</span>
              </label>
            </div>

            <label className="flex items-start gap-3 cursor-pointer bg-blue-50 p-4 rounded-xl">
              <input type="checkbox" checked={form.mentor_contact_ack} onChange={e => setForm({ ...form, mentor_contact_ack: e.target.checked })} className="mt-1 w-5 h-5 accent-equity-red" required />
              <span className="text-sm">I understand I can reach out to my mentor anytime via Messages or email if I encounter any problem *</span>
            </label>
          </>
        )}

        {user?.role === 'mentor' && (
          <>
            <div><label className="text-sm font-medium">Bio (Know Your Mentor)</label><textarea value={form.mentor_bio} onChange={e => setForm({ ...form, mentor_bio: e.target.value })} className="input-field mt-1 h-24" /></div>
            <div><label className="text-sm font-medium">LinkedIn URL</label><input value={form.mentor_linkedin} onChange={e => setForm({ ...form, mentor_linkedin: e.target.value })} className="input-field mt-1" /></div>
            <div><label className="text-sm font-medium">Instagram URL</label><input value={form.mentor_instagram} onChange={e => setForm({ ...form, mentor_instagram: e.target.value })} className="input-field mt-1" /></div>
          </>
        )}

        <button type="submit" className="btn-primary">Save Profile</button>
      </form>

      {insights && (
        <div className="card bg-gradient-to-br from-equity-navy/5 to-equity-red/5">
          <h3 className="font-semibold mb-3">🤖 AI Career Insights</h3>
          <p className="text-sm text-gray-600 mb-3">{insights.pacing_advice}</p>
          {ensureArray(insights.insights).map((ins, i) => (
            <div key={i} className="mb-3 p-3 bg-white rounded-xl"><p className="font-medium text-equity-red">{ins.field}</p><p className="text-sm">{ins.recommendation}</p></div>
          ))}
        </div>
      )}

      <form onSubmit={async (e) => { e.preventDefault(); await api.changePassword(passwords.current, passwords.new); setPasswords({ current: '', new: '' }); alert('Password updated!'); }} className="card space-y-4">
        <h3 className="font-semibold">Change Password</h3>
        <input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} placeholder="Current password" className="input-field" required />
        <input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} placeholder="New password (min 8 chars)" className="input-field" minLength={8} required />
        <button type="submit" className="btn-outline">Update Password</button>
      </form>
    </div>
  );
}
