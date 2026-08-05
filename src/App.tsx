import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DashboardPage } from './pages/Dashboard'
import { DocumentPage } from './pages/Document'
import { DocumentDetailsPage } from './pages/DocumentDetailsPage'
import { AnalyzePage } from './pages/AnalyzePage'
import { AnalysisResultDetailsPage } from './pages/AnalysisResultDetailsPage'
import { ChatPage } from './pages/ChatPage'
import { ProfilePage } from './pages/ProfilePage'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SurgeryPage } from './pages/SurgaryPage'
import { VaccinationPage } from './pages/VaccinationPage'
import { AllergyPage } from './pages/AllergyPage'
import { TimelinePage } from './pages/TimelinePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<AuthPage />} />
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
        <Route path="allergy" element={<AllergyPage />} />
        <Route path="vaccination" element={<VaccinationPage />} />
        <Route path="/surgery" element={<SurgeryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
