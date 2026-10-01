import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState, Suspense } from 'react';
import Layout from './components/Layout';
import { FocusModeProvider } from './context/FocusModeContext';
import branding from './config/branding.json';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ExpertLogin from './components/expert/ExpertLogin';

const ClassSubjectSelection = React.lazy(() => import('./pages/ClassSubjectSelection'));
const PersonaSelection = React.lazy(() => import('./pages/PersonaSelection'));
const ChapterList = React.lazy(() => import('./pages/ChapterList'));
const StudyTable = React.lazy(() => import('./pages/StudyTable'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Profile = React.lazy(() => import('./pages/Profile'));
const GlobalLeaderboard = React.lazy(() => import('./pages/GlobalLeaderboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Subjects = React.lazy(() => import('./pages/Subjects'));
const ConfigPage = React.lazy(() => import('./pages/ConfigPage'));
const ExaminerConsole = React.lazy(() => import('./pages/ExaminerConsole'));
const ExpertPanel = React.lazy(() => import('./pages/ExpertPanel'));
const ResourceTabs = React.lazy(() => import('./pages/ResourceTabs'));
const Questionnaire = React.lazy(() => import('./pages/Questionnaire'));
const AssessmentComplete = React.lazy(() => import('./pages/AssessmentComplete'));
const PreviousYearQuestions = React.lazy(() => import('./pages/PreviousYearQuestions'));

/** Returns true if the user has passed the login screen */
function isAuthenticated() {
  return localStorage.getItem('app_authenticated') === 'true';
}

/** Protects admin/expert routes with a simple password prompt */
function AdminGuard({ children }: { children: JSX.Element }) {
  const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem('expert_access') === 'true');
  if (!isUnlocked) {
    return <ExpertLogin onLogin={() => setIsUnlocked(true)} />;
  }
  return children;
}

/** Redirect to /login if not authenticated */
function AuthGuard({ children }: { children: JSX.Element }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return children;
}

/** Redirect to / if already authenticated (for login page) */
function GuestOnly({ children }: { children: JSX.Element }) {
  if (isAuthenticated()) return <Navigate to="/" replace />;
  return children;
}

/** Enforce onboarding after authentication */
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const username = localStorage.getItem('username');
  const questionnaireCompleted = localStorage.getItem('questionnaire_completed') === 'true';
  const profileCompleted = !!localStorage.getItem('saral_student_profile');
  const location = useLocation();

  if (!username && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (username) {
    // 1. Enforce student profile details completion first
    if (!profileCompleted && location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />;
    }

    // 2. Once profile is completed, enforce questionnaire completion
    if (profileCompleted && !questionnaireCompleted && 
        location.pathname !== '/questionnaire' && 
        location.pathname !== '/profile') {
      return <Navigate to="/questionnaire" replace />;
    }

    // 3. Redirect back to home if trying to access questionnaires when completed
    if (questionnaireCompleted && 
        location.pathname === '/questionnaire') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default function App() {
  const [initDone, setInitDone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = `${branding.appName} – Student Learning`;
    const savedTheme = localStorage.getItem('user_theme') || 'light-blue';
    const savedFont  = localStorage.getItem('user_font')  || 'sans-serif';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-font', savedFont);

    // (Removed aggressive stale auth clearing that was breaking manual URL navigation/refreshes during onboarding)

    setInitDone(true);
  }, []);

  if (!initDone) return null;

  return (
    <FocusModeProvider>
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* ── Config & Admin: Protected by AdminGuard ── */}
            <Route path="/config" element={
              <AdminGuard>
                <ConfigPage />
              </AdminGuard>
            } />
            <Route path="/examiner" element={
              <AdminGuard>
                <ExaminerConsole />
              </AdminGuard>
            } />
            <Route path="/x" element={
              <AdminGuard>
                <ExpertPanel />
              </AdminGuard>
            } />

            {/* ── Public: Login ── */}
            <Route path="/login" element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            } />

            {/* /expert route disabled for MVP — re-enable by uncommenting ExpertDashboard import above */}

            {/* ── Onboarding (authenticated but no profile yet) ── */}
            <Route path="/onboarding" element={
              <AuthGuard>
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              </AuthGuard>
            } />

            {/* ── Main app (authenticated + onboarded) ── */}
            <Route element={<Layout />}>
              <Route path="/" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <ClassSubjectSelection />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/subjects" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <Subjects />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/subjects/:subjectId" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <ChapterList />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/subjects/:subjectId/chapter/:chapterNumber" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <ResourceTabs />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/leaderboard" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <GlobalLeaderboard />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/persona" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <PersonaSelection />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/questionnaire" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <Questionnaire />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/assessment-complete" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <AssessmentComplete />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/study-table" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <StudyTable />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/previous-year-questions" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <PreviousYearQuestions />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="/chapters" element={
                <AuthGuard>
                  <ProtectedRoute>
                    <ChapterList />
                  </ProtectedRoute>
                </AuthGuard>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </FocusModeProvider>
  );
}
