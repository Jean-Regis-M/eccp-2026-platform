import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user
    ? `/${user.role === 'admin' ? 'admin' : user.role}`
    : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full card text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h1 className="font-display text-2xl font-bold text-equity-dark">Page Not Found</h1>
        <p className="text-sm text-gray-500">The page you are looking for does not exist or has been moved.</p>
        <Link to={home} className="btn-primary inline-block">Go to {user ? 'Dashboard' : 'Home'}</Link>
      </div>
    </div>
  );
}
