import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import AttendancePage from './pages/attendance/AttendancePage'
import UsersPage from './pages/users/UsersPage'
import UserFormPage from './pages/users/UserFormPage'
import SchedulesPage from './pages/schedules/SchedulesPage'
import ScheduleFormPage from './pages/schedules/ScheduleFormPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import LeavesPage from './pages/leaves/LeavesPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import PayrollPage from './pages/payroll/PayrollPage'
import AnnouncementsPage from './pages/announcements/AnnouncementsPage'
import HolidaysPage from './pages/holidays/HolidaysPage'
import OvertimePage from './pages/overtime/OvertimePage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><i className="fa-solid fa-spinner fa-spin text-3xl text-primary-500"></i></div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><i className="fa-solid fa-spinner fa-spin text-3xl text-primary-500"></i></div>
  if (!user) return <Navigate to="/login" />
  if (user.role === 'member') return <Navigate to="/dashboard" />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="users/new" element={<AdminRoute><UserFormPage /></AdminRoute>} />
        <Route path="users/:id/edit" element={<AdminRoute><UserFormPage /></AdminRoute>} />
        <Route path="schedules" element={<AdminRoute><SchedulesPage /></AdminRoute>} />
        <Route path="schedules/new" element={<AdminRoute><ScheduleFormPage /></AdminRoute>} />
        <Route path="schedules/:id/edit" element={<AdminRoute><ScheduleFormPage /></AdminRoute>} />
        <Route path="departments" element={<AdminRoute><DepartmentsPage /></AdminRoute>} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="overtime" element={<OvertimePage />} />
        <Route path="analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
        <Route path="payroll" element={<AdminRoute><PayrollPage /></AdminRoute>} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="holidays" element={<AdminRoute><HolidaysPage /></AdminRoute>} />
        <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      </Route>
    </Routes>
  )
}

export default App
