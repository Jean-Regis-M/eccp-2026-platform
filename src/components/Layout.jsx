import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const navItems = {
  mentee: [
    { to: '/mentee', label: 'Dashboard', icon: '🏠' },
    { to: '/sessions', label: 'Sessions', icon: '📚' },
    { to: '/resources', label: 'Resources', icon: '📁' },
    { to: '/mentor-info', label: 'Know Your Mentor', icon: '👤' },
    { to: '/sat', label: 'SAT Prep', icon: '📝' },
    { to: '/messages', label: 'Messages', icon: '💬' },
    { to: '/profile', label: 'My Profile', icon: '⚙️' },
    { to: '/guide', label: 'User Guide', icon: '📖' },
  ],
  mentor: [
    { to: '/mentor', label: 'Dashboard', icon: '🏠' },
    { to: '/sessions', label: 'Sessions', icon: '📚' },
    { to: '/resources', label: 'Resources', icon: '📁' },
    { to: '/rankings', label: 'My Scholars Rank', icon: '🏆' },
    { to: '/mentor-report', label: 'Weekly Report', icon: '📋' },
    { to: '/sat', label: 'SAT Coordination', icon: '📝' },
    { to: '/messages', label: 'Messages', icon: '💬' },
    { to: '/profile', label: 'My Profile', icon: '⚙️' },
    { to: '/guide', label: 'User Guide', icon: '📖' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '🏠' },
    { to: '/sessions', label: 'Sessions', icon: '📚' },
    { to: '/resources', label: 'Resources', icon: '📁' },
    { to: '/rankings', label: 'All Rankings', icon: '🏆' },
    { to: '/reports', label: 'Reports', icon: '📊' },
    { to: '/sat', label: 'SAT Coordination', icon: '📝' },
    { to: '/messages', label: 'Messages', icon: '💬' },
    { to: '/profile', label: 'Settings', icon: '⚙️' },
    { to: '/guide', label: 'User Guide', icon: '📖' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = navItems[user?.role] || navItems.mentee;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gradient-to-b from-equity-dark to-equity-navy text-white flex flex-col fixed h-full z-30 shadow-2xl">
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="w-11 h-11 bg-white/10 p-1" />
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">ECCP 2026</h1>
              <p className="text-[10px] text-equity-gold/80">College Counselling</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                location.pathname === item.to
                  ? 'bg-equity-red text-white shadow-lg shadow-red-900/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-lg">{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="text-sm mb-2">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/50 capitalize">{user?.role}{user?.pf_number ? ` • PF ${user.pf_number}` : ''}</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-white/60 hover:text-white">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 ml-64">
        <header className="bg-white/80 backdrop-blur border-b px-8 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-equity-dark text-lg">
              {items.find(i => i.to === location.pathname)?.label || 'ECCP Platform'}
            </h2>
            <span className="text-xs text-gray-400 hidden md:block">Equity College Counselling Program • Rwanda</span>
          </div>
        </header>
        <div className="p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
