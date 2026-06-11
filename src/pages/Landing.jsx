import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { getSavedPath } from '../components/RoutePersistence';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const fallbackTimeline = [
  { period: 'May 25–30, 2026', event: 'SGL & Mentor Induction' },
  { period: 'Jun 1–6, 2026', event: 'Scholar Induction' },
  { period: 'Jun 8–Jul 4, 2026', event: 'Bootcamp' },
  { period: 'Jul 6–27, 2026', event: 'Workshop + SAT Prep' },
  { period: 'Aug–Dec 2026', event: 'Mentor–Mentee Sessions & Applications' },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const [timeline, setTimeline] = useState(fallbackTimeline);

  useEffect(() => {
    api.getPublicTimeline()
      .then(items => {
        if (items?.length) setTimeline(items.map(t => ({ period: t.period, event: t.event, description: t.description })));
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-equity-red border-t-transparent rounded-full" />
      </div>
    );
  }
  if (user) {
    const saved = getSavedPath();
    const dashboard = `/${user.role === 'admin' ? 'admin' : user.role}`;
    return <Navigate to={saved && saved !== '/' ? saved : dashboard} replace />;
  }

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-equity-dark via-equity-navy to-equity-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-equity-red rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-equity-gold rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-equity-red/10 rounded-full blur-3xl animate-shimmer" />
        </div>
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle className="bg-white/10 text-white border border-white/20 hover:bg-white/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="mb-8 flex justify-center">
            <Logo className="w-28 h-28 bg-white/10 p-2 shadow-2xl ring-2 ring-equity-gold/30" />
          </div>
          <p className="text-equity-gold font-semibold tracking-widest text-sm mb-4">EQUITY COLLEGE COUNSELLING PROGRAM</p>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            ECCP <span className="text-transparent bg-clip-text bg-gradient-to-r from-equity-red to-equity-gold">2026</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Empowering Rwanda&apos;s brightest scholars to achieve their university dreams through mentorship, technology, and unwavering support.
          </p>
          <p className="text-white/50 text-sm mb-12">67 Scholars • 6 Mentors • One Mission</p>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { to: '/login/mentee', icon: '🎓', title: 'Scholar', desc: 'Login with your PF Number' },
              { to: '/login/mentor', icon: '🧑‍🏫', title: 'Mentor', desc: 'Login with your email' },
              { to: '/login/admin', icon: '🛡️', title: 'Admin', desc: 'Program coordination' },
            ].map(portal => (
              <Link key={portal.to} to={portal.to} className="group shine-card bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:scale-105 hover:border-equity-gold/40 transition-all duration-300 shadow-xl">
                <div className="text-4xl mb-4">{portal.icon}</div>
                <h3 className="font-display font-bold text-xl mb-2">{portal.title}</h3>
                <p className="text-white/60 text-sm">{portal.desc}</p>
                <div className="mt-4 text-equity-gold text-sm font-medium group-hover:underline">Enter Portal →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-equity-dark">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center text-equity-dark dark:text-white mb-12">Everything You Need to Succeed</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📊', title: 'Progress Tracking', desc: 'Real-time attendance, quiz scores, and personal progress' },
              { icon: '📝', title: 'Daily Sessions', desc: 'Topics, presentations, feedback, and comprehension ratings' },
              { icon: '🏆', title: 'Scholar Rankings', desc: 'Motivating leaderboard for mentors and administrators' },
              { icon: '🎯', title: 'SAT Coordination', desc: 'Timed practice exams with mentor monitoring' },
              { icon: '💬', title: 'Direct Messaging', desc: 'Stay connected with your mentor and program updates' },
              { icon: '📋', title: 'Weekly Reports', desc: 'Downloadable PDF reports for supervisors' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Your data is confidential and protected' },
              { icon: '🤖', title: 'AI Career Insights', desc: 'Personalized guidance based on your academic profile' },
            ].map((f, i) => (
              <div key={i} className="card shine-card hover:shadow-lg transition text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-equity-dark dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-equity-light dark:bg-equity-navy/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center text-equity-dark dark:text-white mb-4">ECCP 2026 Timeline</h2>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-12">Program milestones — editable by administrators</p>
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div key={i} className="flex items-center gap-4 card shine-card group hover:border-equity-red/30">
                <div className="w-36 text-sm font-semibold text-equity-red shrink-0">{t.period}</div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-equity-red to-equity-gold shrink-0 group-hover:scale-125 transition-transform" />
                <div>
                  <div className="font-medium dark:text-white">{t.event}</div>
                  {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-equity-dark text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="font-display text-2xl font-bold mb-2">ECCP 2026</h3>
          <p className="text-white/60 mb-4">Equity College Counselling Program — Rwanda</p>
          <p className="text-sm text-white/40 mb-6">
            Contact: <a href="mailto:eccpmentor.regismukiza@gmail.com" className="text-equity-gold hover:underline">eccpmentor.regismukiza@gmail.com</a>
          </p>
          <p className="text-xs text-white/30">
            Persistence, self-paced drive, and dedication lead to acceptance. We provide the highest quality content — the work is yours to level up.
          </p>
        </div>
      </footer>
    </div>
  );
}
