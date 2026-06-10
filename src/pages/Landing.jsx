import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-equity-red border-t-transparent rounded-full" />
      </div>
    );
  }
  if (user) return <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role}`} replace />;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-equity-dark via-equity-navy to-equity-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-equity-red rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-equity-gold rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="mb-8 flex justify-center">
            <Logo className="w-28 h-28 bg-white/10 p-2 shadow-2xl" />
          </div>
          <p className="text-equity-gold font-semibold tracking-widest text-sm mb-4">EQUITY COLLEGE COUNSELLING PROGRAM</p>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            ECCP <span className="text-equity-red">2026</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Empowering Rwanda's brightest scholars to achieve their university dreams through mentorship, technology, and unwavering support.
          </p>
          <p className="text-white/50 text-sm mb-12">67 Scholars • 6 Mentors • One Mission</p>

          {/* Login Portals */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Link to="/login/mentee" className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-display font-bold text-xl mb-2">Scholar</h3>
              <p className="text-white/60 text-sm">Login with your PF Number</p>
              <div className="mt-4 text-equity-gold text-sm font-medium group-hover:underline">Enter Portal →</div>
            </Link>
            <Link to="/login/mentor" className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🧑‍🏫</div>
              <h3 className="font-display font-bold text-xl mb-2">Mentor</h3>
              <p className="text-white/60 text-sm">Login with your email</p>
              <div className="mt-4 text-equity-gold text-sm font-medium group-hover:underline">Enter Portal →</div>
            </Link>
            <Link to="/login/admin" className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-display font-bold text-xl mb-2">Admin</h3>
              <p className="text-white/60 text-sm">Program coordination</p>
              <div className="mt-4 text-equity-gold text-sm font-medium group-hover:underline">Enter Portal →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center text-equity-dark mb-12">Everything You Need to Succeed</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📊', title: 'Progress Tracking', desc: 'Real-time attendance, quiz scores, and daily rankings' },
              { icon: '📝', title: 'Daily Sessions', desc: 'Topics, presentations, feedback, and comprehension ratings' },
              { icon: '🏆', title: 'Scholar Rankings', desc: 'Motivating leaderboard updated daily based on performance' },
              { icon: '🎯', title: 'SAT Coordination', desc: 'Timed practice exams with mentor monitoring' },
              { icon: '💬', title: 'Direct Messaging', desc: 'Stay connected with your mentor and program updates' },
              { icon: '📋', title: 'Weekly Reports', desc: 'Downloadable reports for supervisors and evaluation' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Your data is confidential and protected' },
              { icon: '🤖', title: 'AI Career Insights', desc: 'Personalized guidance based on your academic profile' },
            ].map((f, i) => (
              <div key={i} className="card hover:shadow-lg transition text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-equity-dark mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Timeline */}
      <section className="py-20 bg-equity-light">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center text-equity-dark mb-12">ECCP 2026 Timeline</h2>
          <div className="space-y-4">
            {[
              { period: 'May 25–30', event: 'SGL & Mentor Induction' },
              { period: 'Jun 1–6', event: 'Scholar Induction' },
              { period: 'Jun 8–Jul 4', event: 'Bootcamp' },
              { period: 'Jul 6–27', event: 'Workshop + SAT Prep' },
              { period: 'Aug–Dec 2026', event: 'Mentor–Mentee Sessions & Applications' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-4 card">
                <div className="w-32 text-sm font-semibold text-equity-red shrink-0">{t.period}</div>
                <div className="w-3 h-3 rounded-full bg-equity-red shrink-0" />
                <div className="font-medium">{t.event}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
