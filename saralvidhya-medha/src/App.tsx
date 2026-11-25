import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import { FocusModeProvider } from './context/FocusModeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import branding from './config/branding.json';
import { SLUG_TO_TOOL_ID, getPathForTool, getMoocsStudySession } from './utils/courseNavigation';

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      const isChunkError =
        /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i.test(
          msg,
        );
      if (isChunkError && typeof window !== 'undefined') {
        try {
          const last = Number(sessionStorage.getItem('sv_chunk_reload_at') || '0');
          if (Date.now() - last > 15_000) {
            sessionStorage.setItem('sv_chunk_reload_at', String(Date.now()));
            window.location.reload();
            return new Promise<never>(() => {});
          }
        } catch {
          window.location.reload();
          return new Promise<never>(() => {});
        }
      }
      throw err;
    }
  });
}

import Login from './pages/Login';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import CourseRegister from './pages/CourseRegister';
import CoursePayment from './pages/CoursePayment';

const StudyTable = lazyWithRetry(() => import('./pages/StudyTable'));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const GlobalLeaderboard = lazyWithRetry(() => import('./pages/GlobalLeaderboard'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const ConfigPage = lazyWithRetry(() => import('./pages/ConfigPage'));
const ExaminerConsole = lazyWithRetry(() => import('./pages/ExaminerConsole'));
const ExpertPanel = lazyWithRetry(() => import('./pages/ExpertPanel'));
const ResourceTabs = lazyWithRetry(() => import('./pages/ResourceTabs'));
const Questionnaire = lazyWithRetry(() => import('./pages/Questionnaire'));
const Questionnaire2 = lazyWithRetry(() => import('./pages/Questionnaire2'));
const Questionnaire3 = lazyWithRetry(() => import('./pages/Questionnaire3'));
const AssessmentComplete = lazyWithRetry(() => import('./pages/AssessmentComplete'));
const PreviousYearQuestions = lazyWithRetry(() => import('./pages/PreviousYearQuestions'));
const ManagementMindmap = lazyWithRetry(() => import('./pages/ManagementMindmap'));
/** Returns true if the user has passed the login screen in this session */
export function isAuthenticated() {
  return (
    (sessionStorage.getItem('sv_moocs_session_v4') === 'true' ||
      sessionStorage.getItem('sv_medha_session_v4') === 'true') &&
    localStorage.getItem('app_authenticated') === 'true'
  );
}

/** Redirect to /login if not authenticated */
function AuthGuard({ children }: { children: JSX.Element }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return children;
}
/** Maps clean tool-name routes (e.g. /watch, /essentials, /assessments, /ask) to StudyTable without remounting */
function StudyToolRoute() {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const location = useLocation();
  const slug = (toolSlug || '').toLowerCase();

  if (slug === 'study-table') {
    const sp = new URLSearchParams(location.search);
    const targetTool = sp.get('tool') || getMoocsStudySession().tool || 'videos';
    return <Navigate to={`${getPathForTool(targetTool)}${location.search}`} replace />;
  }

  if (!SLUG_TO_TOOL_ID[slug]) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthGuard>
      <StudyTable />
    </AuthGuard>
  );
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
    if (!profileCompleted && location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />;
    }

    if (
      profileCompleted &&
      !questionnaireCompleted &&
      location.pathname !== '/questionnaire' &&
      location.pathname !== '/questionnaire2' &&
      location.pathname !== '/questionnaire3' &&
      location.pathname !== '/profile'
    ) {
      return <Navigate to="/questionnaire" replace />;
    }

    if (
      questionnaireCompleted &&
      (location.pathname === '/questionnaire' ||
        location.pathname === '/questionnaire2' ||
        location.pathname === '/questionnaire3')
    ) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default function App() {
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    document.title = `${branding.appName} – MOOCs`;
    const savedTheme = localStorage.getItem('user_theme') || 'light-blue';
    const savedFont = localStorage.getItem('user_font') || 'sans-serif';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-font', savedFont);

    if (sessionStorage.getItem('sv_moocs_mode') === null) {
      sessionStorage.setItem('sv_moocs_mode', 'true');
    }

    setInitDone(true);
  }, []);

  if (!initDone) return null;

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <FocusModeProvider>
          <Routes>
            {/* ── Config: URL-only, no auth required ── */}
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/config/examiner" element={<ExaminerConsole />} />
            <Route path="/examiner" element={<ExaminerConsole />} />
            <Route path="/x" element={<ExpertPanel />} />

            {/* ── Public: Course Catalog (Default First Page), About Course & Login ── */}
            <Route path="/" element={<CourseCatalog />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
            <Route path="/login" element={<Login />} />

            {/* ── Onboarding ── */}
            <Route
              path="/onboarding"
              element={
                <AuthGuard>
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                </AuthGuard>
              }
            />
            <Route
              path="/course/:courseId/register"
              element={
                <AuthGuard>
                  <CourseRegister />
                </AuthGuard>
              }
            />
            <Route
              path="/course/:courseId/payment"
              element={
                <AuthGuard>
                  <CoursePayment />
                </AuthGuard>
              }
            />
            <Route
              path="/mindmap/management"
              element={
                <AuthGuard>
                  <ManagementMindmap />
                </AuthGuard>
              }
            />

            {/* ── Main app (authenticated + onboarded) ── */}
            <Route element={<Layout />}>
              <Route path="/my-learning" element={<Navigate to="/" replace />} />
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route path="/subjects" element={<Navigate to="/" replace />} />
              <Route path="/subjects/:subjectId" element={<Navigate to="/" replace />} />
              <Route
                path="/subjects/:subjectId/chapter/:chapterNumber"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <ResourceTabs />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthGuard>
                    <Profile />
                  </AuthGuard>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <GlobalLeaderboard />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route path="/persona" element={<Navigate to="/" replace />} />
              <Route
                path="/questionnaire"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <Questionnaire />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route
                path="/questionnaire2"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <Questionnaire2 />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route
                path="/questionnaire3"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <Questionnaire3 />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route
                path="/assessment-complete"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <AssessmentComplete />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route path="/chapters" element={<Navigate to="/" replace />} />
              <Route path="/:toolSlug" element={<StudyToolRoute />} />
              <Route
                path="/previous-year-questions"
                element={
                  <AuthGuard>
                    <ProtectedRoute>
                      <PreviousYearQuestions />
                    </ProtectedRoute>
                  </AuthGuard>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </FocusModeProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
