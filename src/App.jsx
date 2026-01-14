import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import Roles from './pages/Roles'
import Projects from './pages/Projects'
import Scanner from './pages/Scanner'
import DailyLogs from './pages/DailyLogs'
import Payroll from './pages/Payroll'
import Payslip from './pages/Payslip'
import LoadingSpinner from './components/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />
  
  return children
}

const AppRoutes = () => {
  const { user, userProfile, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <Layout>
            <Inventory />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout>
            <Attendance />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute>
          <Layout>
            <Employees />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/roles" element={
        <ProtectedRoute>
          <Layout>
            <Roles />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <Layout>
            <Projects />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/scanner" element={
        <ProtectedRoute>
          <Layout>
            <Scanner />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/daily-logs" element={
        <ProtectedRoute>
          <Layout>
            <DailyLogs />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/payroll" element={
        <ProtectedRoute>
          <Layout>
            {userProfile?.role === 'worker' ? <Payslip /> : <Payroll />}
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App