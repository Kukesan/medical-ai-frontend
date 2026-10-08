import { lazy, Suspense } from 'react'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AboutPage } from './pages/AboutPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { Route, Routes } from 'react-router-dom'
import { Spinner } from './components/ui'
import { ErrorBoundary } from './components/ErrorBoundary'

// Public pages are imported eagerly because they are pre-rendered at build time (see vite-plugin-seo.ts).
// The authenticated app is code-split so the public landing page ships only what it renders.
const AppLayout = lazy(() => import('./components/AppLayout').then((m) => ({ default: m.AppLayout })))
const DashboardPage = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.DashboardPage })))
const DocumentPage = lazy(() => import('./pages/Document').then((m) => ({ default: m.DocumentPage })))
const DocumentDetailsPage = lazy(() =>
  import('./pages/DocumentDetailsPage').then((m) => ({ default: m.DocumentDetailsPage })),
)
const AnalyzePage = lazy(() => import('./pages/AnalyzePage').then((m) => ({ default: m.AnalyzePage })))
const AnalysisResultDetailsPage = lazy(() =>
  import('./pages/AnalysisResultDetailsPage').then((m) => ({ default: m.AnalysisResultDetailsPage })),
)
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const SurgeryPage = lazy(() => import('./pages/SurgeryPage').then((m) => ({ default: m.SurgeryPage })))
const VaccinationPage = lazy(() => import('./pages/VaccinationPage').then((m) => ({ default: m.VaccinationPage })))
const AllergyPage = lazy(() => import('./pages/AllergyPage').then((m) => ({ default: m.AllergyPage })))
const TimelinePage = lazy(() => import('./pages/TimelinePage').then((m) => ({ default: m.TimelinePage })))
const MedicalRecordsPage = lazy(() =>
  import('./pages/MedicalRecordsPage').then((m) => ({ default: m.MedicalRecordsPage })),
)
const RecordIntakePage = lazy(() => import('./pages/RecordIntakePage').then((m) => ({ default: m.RecordIntakePage })))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* The homepage is the public landing page; AuthPage sends signed-in users on to the app. */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage/>} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/document" element={<DocumentPage />} />
            <Route path="/document/:documentId" element={<DocumentDetailsPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/analyze/:resultId" element={<AnalysisResultDetailsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/medical-records" element={<MedicalRecordsPage />} />
            <Route path="/record-intake" element={<RecordIntakePage />} />
            <Route path="allergy" element={<AllergyPage />} />
            <Route path="vaccination" element={<VaccinationPage />} />
            <Route path="/surgery" element={<SurgeryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
