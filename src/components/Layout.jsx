import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Package, 
  Clock, 
  Users, 
  DollarSign,
  Briefcase,
  FolderOpen,
  Scan,
  FileText,
  Menu, 
  X, 
  LogOut 
} from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { userProfile, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    ...(userProfile?.role === 'admin' || userProfile?.role === 'hr' ? [{ name: 'Employees', href: '/employees', icon: Users }] : []),
    ...(userProfile?.role === 'admin' || userProfile?.role === 'hr' ? [{ name: 'Projects', href: '/projects', icon: FolderOpen }] : []),
    ...(userProfile?.role === 'admin' ? [{ name: 'Roles', href: '/roles', icon: Briefcase }] : []),
    { name: 'Scanner', href: '/scanner', icon: Scan },
    { name: 'Daily Logs', href: '/daily-logs', icon: FileText },
    { name: userProfile?.role === 'worker' ? 'Payslip' : 'Payroll', href: '/payroll', icon: DollarSign },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
          <h1 className="text-white text-lg font-semibold">ConstructionMS</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-gray-900 text-white border-r-2 border-blue-500' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="flex items-center justify-between text-gray-300 text-sm">
            <span>{userProfile?.role || 'User'}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {userProfile?.role || 'User'}
              </span>
              {/* Debug: Show user email on mobile */}
              <span className="text-xs text-gray-400 lg:hidden">
                ({userProfile?.email || 'no email'})
              </span>
              <button
                onClick={handleSignOut}
                className="lg:hidden flex items-center text-gray-500 hover:text-gray-700"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout