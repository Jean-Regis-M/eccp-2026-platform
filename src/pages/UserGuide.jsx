import { useAuth } from '../context/AuthContext';

const GUIDES = {
  mentee: {
    title: 'Scholar User Guide — ECCP 2026',
    steps: [
      { n: 1, t: 'First Login', d: 'Go to the home page → click Scholar → enter your PF Number and password Cohort@2026. Change your password immediately in Profile.' },
      { n: 2, t: 'Complete Your Profile', d: 'Fill every field seriously: school, subjects, career interests, target universities, application status. Acknowledge AI policy and mentor contact.' },
      { n: 3, t: 'Daily Session Routine', d: 'Check Dashboard for today\'s topic → join session link → wait for mentor to mark attendance → submit mandatory reflection → take timed quiz before it closes.' },
      { n: 4, t: 'Application Tracker', d: 'In Profile, update your application status: universities you are applying to, and if admitted, which university accepted you.' },
      { n: 5, t: 'Messages', d: 'Filter messages from Org Admin vs Your Mentor. Reply to your mentor when you have questions.' },
      { n: 6, t: 'Resources', d: 'Browse SAT Prep, Essay Writing, and other categories. Use materials wisely for your applications.' },
      { n: 7, t: 'SAT Hub', d: 'Complete practice exams posted by your mentor before deadlines. Submit your scores.' },
      { n: 8, t: 'If You Need Help', d: 'Message your mentor or email eccpmentor.regismukiza@gmail.com. Use password reset if locked out (email sent to your registered address).' },
    ],
  },
  mentor: {
    title: 'Mentor User Guide — ECCP 2026',
    steps: [
      { n: 1, t: 'Login & Setup', d: 'Login with your email and Equity@2026. Update your Know Your Mentor bio, LinkedIn, and Instagram in Profile.' },
      { n: 2, t: 'Mark Attendance', d: 'Sessions → select today\'s session → Mark Attendance → click each scholar who attended → Confirm. Only mark on/after session date.' },
      { n: 3, t: 'Create Sessions', d: 'Add sessions for your group with topic, description, Zoom link, Google Drive URL. Upload presentation files.' },
      { n: 4, t: 'Post Timed Quizzes', d: 'After session, create quiz with 5–60 minute time limit. Scholars who miss it lose ranking points automatically.' },
      { n: 5, t: 'Weekly Report PDF', d: 'Weekly Report → select week → fill Sections 4–8 → Save → Download PDF → sign and email to org admin.' },
      { n: 6, t: 'Follow-up Scholars', d: 'Dashboard highlights scholars needing intervention. Message them directly.' },
      { n: 7, t: 'Reset Scholar Password', d: 'Upon scholar request, use mentor dashboard or contact admin. You can reset your own mentees\' passwords.' },
      { n: 8, t: 'Resource Library', d: 'Upload materials by category (SAT, Essays, Recommendations) for your scholars.' },
    ],
  },
  admin: {
    title: 'Org Admin User Guide — ECCP 2026',
    steps: [
      { n: 1, t: 'Command Center', d: 'Monitor scholar count, profiles completed, attendance, and mentor performance from the dashboard.' },
      { n: 2, t: 'User Management', d: 'Add/remove scholars, assign mentors, reset any password, send credentials and reminders.' },
      { n: 3, t: 'Session Control', d: 'Create global sessions, edit/delete any session, set topics from bootcamp schedule.' },
      { n: 4, t: 'Program Timeline', d: 'Edit ECCP 2026 phases visible to all mentors and scholars for alignment.' },
      { n: 5, t: 'Broadcast Messages', d: 'Send announcements to all scholars or all mentors.' },
      { n: 6, t: 'Audit & History', d: 'Review Audit Log and Platform History to see who did what and when. Investigate incidents.' },
      { n: 7, t: 'Email Settings', d: 'Configure SMTP for automatic reminders and password reset emails.' },
      { n: 8, t: 'Export Data', d: 'Export scholar profiles, rankings CSV, and weekly reports for supervisors.' },
    ],
  },
};

export default function UserGuide() {
  const { user } = useAuth();
  const guide = GUIDES[user?.role] || GUIDES.mentee;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">{guide.title}</h1>
      <div className="space-y-4">
        {guide.steps.map(s => (
          <div key={s.n} className="card flex gap-4">
            <div className="w-10 h-10 rounded-full bg-equity-red text-white flex items-center justify-center font-bold shrink-0">{s.n}</div>
            <div>
              <h3 className="font-semibold text-lg">{s.t}</h3>
              <p className="text-gray-600 mt-1">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400">Contact: eccpmentor.regismukiza@gmail.com</p>
    </div>
  );
}
