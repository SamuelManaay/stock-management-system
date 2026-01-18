import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Package, Users, Clock, DollarSign, AlertTriangle } from 'lucide-react'

const Dashboard = () => {
  const { userProfile, preloadedData, dataLoading } = useAuth()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    lowStockItems: 0,
    todayAttendance: 0,
    roleCounts: {}
  })
  const [loading, setLoading] = useState(true)

  const isAdmin = userProfile?.role === 'admin'

  useEffect(() => {
    if (preloadedData.inventory.length > 0 || !dataLoading) {
      calculateStats()
    }
  }, [preloadedData, dataLoading])

  const calculateStats = () => {
    try {
      // Calculate stats from preloaded data
      const lowStockCount = preloadedData.inventory.filter(
        item => item.current_quantity < item.minimum_quantity
      ).length

      const activeEmployees = preloadedData.employees.filter(
        emp => emp.status === 'active'
      ).length

      const activeProjects = preloadedData.projects.filter(
        proj => proj.status === 'active'
      ).length

      // Calculate role counts
      const roleCounts = preloadedData.users.reduce((acc, user) => {
        if (user.role) {
          acc[user.role] = (acc[user.role] || 0) + 1
        }
        return acc
      }, {})

      setStats({
        totalEmployees: activeEmployees,
        activeProjects: activeProjects,
        lowStockItems: lowStockCount,
        todayAttendance: preloadedData.attendance.length,
        roleCounts
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = isAdmin ? [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Package,
      color: 'bg-green-500'
    },
    {
      title: 'Today\'s Attendance',
      value: stats.todayAttendance,
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ] : [
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your construction management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/attendance" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
            <Clock className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium">Clock In/Out</h3>
            <p className="text-sm text-gray-600">Record attendance</p>
          </Link>
          
          <Link to="/inventory" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
            <Package className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-medium">Add Inventory</h3>
            <p className="text-sm text-gray-600">Manage stock items</p>
          </Link>
          
          {isAdmin && (
            <Link to="/payroll" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
              <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium">Generate Payroll</h3>
              <p className="text-sm text-gray-600">Process payments</p>
            </Link>
          )}
        </div>
      </div>

      {/* Active Roles */}
      {isAdmin && Object.keys(stats.roleCounts).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Roles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.roleCounts).map(([role, count]) => (
              <div key={role} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{role}s</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-600">System initialized successfully</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Ready for employee registration</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Inventory system active</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard