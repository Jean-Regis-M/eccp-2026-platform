import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/ScrollToTop';
import RoutePersistence from './components/RoutePersistence';
import ForcePasswordChange from './components/ForcePasswordChange';
import { useECCPState } from './hooks/useECCPState';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const MenteeDashboard = lazy(() => import('./pages/MenteeDashboard'));
const MentorDashboard = lazy(() => import('./pages/MentorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Sessions = lazy(() => import('./pages/Sessions'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Messages = lazy(() => import('./pages/Messages'));
const KnowYourMentor = lazy(() => import('./pages/KnowYourMentor'));
const SatExams = lazy(() => import('./pages/SatExams'));
const WeeklyReports = lazy(() => import('./pages/WeeklyReports'));
const MentorWeeklyReport = lazy(() => import('./pages/MentorWeeklyReport'));
const Resources = lazy(() => import('./pages/Resources'));
const UserGuide = lazy(() => import('./pages/UserGuide'));
const NotFound = lazy(() => import('./pages/NotFound'));
const GlobalOpportunitiesTracker = lazy(() => import('./components/GlobalOpportunitiesTracker'));
const SuspensionGate = lazy(() => import('./components/SuspensionGate'));
const AbsenceExcuseGate = lazy(() => import('./components/AbsenceExcuseGate'));

function ProtectedRoute({ children, roles, blockMentee }) {
  const { user, loading, serverUnreachable, retrySession } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-equity-red border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user && serverUnreachable && localStorage.getItem('eccp_token')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <p className="text-4xl mb-4">⏳</p>
          <h2 className="font-display text-xl font-bold mb-2">Reconnecting to ECCP...</h2>
          <p className="text-sm text-gray-500 mb-4">The server is starting up. Your session is preserved — please wait.</p>
          <button onClick={retrySession} className="btn-primary">Retry Connection</button>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role}`} replace />;
  }
  if (blockMentee && user.role === 'mentee') return <Navigate to="/mentee" replace />;
  return children;
}

function withLayout(Page, guardProps = {}) {
  return (
    <ProtectedRoute {...guardProps}>
      <Layout>
        <Page />
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { user } = useAuth();
  const { scholars } = useECCPState();

  // Check if user is a mentee and needs gating
  const menteeScholar = user && user.role === 'mentee' ? scholars.find(s => s.pfNumber === user.pf_number) : null;
  const isSuspended = menteeScholar && menteeScholar.isSuspended;
  const hasMissedSession = menteeScholar && menteeScholar.lastMissedSessionId && !menteeScholar.absenceExcuseSubmitted;

  return (
    <>
      <ScrollToTop />
      <RoutePersistence />
      <ForcePasswordChange />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login/:role" element={<Login />} />

          {/* Gating Screens - these take precedence over regular routes */}
          {user && user.role === 'mentee' && (
            <>
              {/* Suspension Gate - takes highest priority */}
              {isSuspended && (
                <Route path="/mentee" element={
                  <SuspensionGate />
                } />
              )}

              {/* Absence Excuse Gate - checked if not suspended */}
              {!isSuspended && hasMissedSession && (
                <Route path="/mentee" element={
                  <AbsenceExcuseGate onExcuseSubmitted={() => {
                    // In a real implementation, this would trigger a refresh or redirect
                    // For now, we'll rely on the useEffect in mentee dashboard to re-check
                  }} />
                } />
              )}
            </>
          )}

          {/* Regular Routes */}
          <Route path="/mentee" element={withLayout(MenteeDashboard, { roles: ['mentee'] })} />
          <Route path="/mentor" element={withLayout(MentorDashboard, { roles: ['mentor', 'admin'] })} />
          <Route path="/admin" element={withLayout(AdminDashboard, { roles: ['admin'] })} />
          <Route path="/profile" element={withLayout(Profile)} />
          <Route path="/sessions" element={withLayout(Sessions)} />
          <Route path="/quiz/:id" element={withLayout(QuizPage)} />
          <Route path="/rankings" element={withLayout(Rankings, { roles: ['mentor', 'admin'], blockMentee: true })} />
          <Route path="/messages" element={withLayout(Messages)} />
          <Route path="/mentor-info" element={withLayout(KnowYourMentor)} />
          <Route path="/sat" element={withLayout(SatExams)} />
          <Route path="/reports" element={withLayout(WeeklyReports, { roles: ['admin'] })} />
          <Route path="/mentor-report" element={withLayout(MentorWeeklyReport, { roles: ['mentor', 'admin'] })} />
          <Route path="/resources" element={withLayout(Resources)} />
          <Route path="/opportunities" element={withLayout(GlobalOpportunitiesTracker, {})} />
          <Route path="/guide" element={withLayout(UserGuide)} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
