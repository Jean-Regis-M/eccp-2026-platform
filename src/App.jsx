import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import MenteeDashboard from './pages/MenteeDashboard';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Sessions from './pages/Sessions';
import QuizPage from './pages/QuizPage';
import Rankings from './pages/Rankings';
import Messages from './pages/Messages';
import KnowYourMentor from './pages/KnowYourMentor';
import SatExams from './pages/SatExams';
import WeeklyReports from './pages/WeeklyReports';
import MentorWeeklyReport from './pages/MentorWeeklyReport';
import Resources from './pages/Resources';
import UserGuide from './pages/UserGuide';
import Layout from './components/Layout';

function ProtectedRoute({ children, roles, blockMentee }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-equity-red border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role}`} />;
  if (blockMentee && user.role === 'mentee') return <Navigate to="/mentee" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/mentee" element={<ProtectedRoute roles={['mentee']}><Layout><MenteeDashboard /></Layout></ProtectedRoute>} />
      <Route path="/mentor" element={<ProtectedRoute roles={['mentor', 'admin']}><Layout><MentorDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><Layout><Sessions /></Layout></ProtectedRoute>} />
      <Route path="/quiz/:id" element={<ProtectedRoute><Layout><QuizPage /></Layout></ProtectedRoute>} />
      <Route path="/rankings" element={<ProtectedRoute roles={['mentor', 'admin']} blockMentee><Layout><Rankings /></Layout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
      <Route path="/mentor-info" element={<ProtectedRoute><Layout><KnowYourMentor /></Layout></ProtectedRoute>} />
      <Route path="/sat" element={<ProtectedRoute><Layout><SatExams /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin']}><Layout><WeeklyReports /></Layout></ProtectedRoute>} />
      <Route path="/mentor-report" element={<ProtectedRoute roles={['mentor', 'admin']}><Layout><MentorWeeklyReport /></Layout></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><Layout><Resources /></Layout></ProtectedRoute>} />
      <Route path="/guide" element={<ProtectedRoute><Layout><UserGuide /></Layout></ProtectedRoute>} />
    </Routes>
  );
}
