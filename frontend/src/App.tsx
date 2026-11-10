import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProfileProvider } from './components/layout/ProfileContext'
import { PublicLayout } from './components/layout/PublicLayout'
import { Spinner } from './components/ui/primitives'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import ResumePage from './pages/ResumePage'

// The admin bundle is only downloaded when someone visits /admin.
const AdminRoot = lazy(() => import('./admin/AdminLayout').then((m) => ({ default: m.AdminRoot })))
const AdminShell = lazy(() => import('./admin/AdminLayout'))
const LoginPage = lazy(() => import('./admin/pages/LoginPage'))
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage'))
const ProjectsAdminPage = lazy(() => import('./admin/pages/ProjectsAdminPage'))
const ProjectEditorPage = lazy(() => import('./admin/pages/ProjectEditorPage'))
const ProjectPreviewPage = lazy(() => import('./admin/pages/ProjectPreviewPage'))
const ResumeAdminPage = lazy(() => import('./admin/pages/ResumeAdminPage'))
const ExperienceAdminPage = lazy(() => import('./admin/pages/ExperienceAdminPage'))
const SkillsAdminPage = lazy(() => import('./admin/pages/SkillsAdminPage'))
const ProfileAdminPage = lazy(() => import('./admin/pages/ProfileAdminPage'))
const MessagesAdminPage = lazy(() => import('./admin/pages/MessagesAdminPage'))

export default function App() {
  return (
    <ProfileProvider>
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center">
            <Spinner />
          </div>
        }
      >
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:slug" element={<ProjectDetailPage />} />
            <Route path="resume" element={<ResumePage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="admin" element={<AdminRoot />}>
            <Route path="login" element={<LoginPage />} />
            <Route element={<AdminShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsAdminPage />} />
              <Route path="projects/new" element={<ProjectEditorPage />} />
              <Route path="projects/:id" element={<ProjectEditorPage />} />
              <Route path="projects/:id/preview" element={<ProjectPreviewPage />} />
              <Route path="resume" element={<ResumeAdminPage />} />
              <Route path="experience" element={<ExperienceAdminPage />} />
              <Route path="skills" element={<SkillsAdminPage />} />
              <Route path="profile" element={<ProfileAdminPage />} />
              <Route path="messages" element={<MessagesAdminPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ProfileProvider>
  )
}
