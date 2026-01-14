import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, User, Edit, Trash2, Upload } from 'lucide-react'

const Employees = () => {
  const { userProfile } = useAuth()
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    role: '',
    daily_rate: 0,
    hourly_rate: 0,
    employment_type: 'daily',
    project_id: '',
    status: 'active'
  })

  const employmentTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ]

  const roles = [
    'Laborer',
    'Foreman',
    'Engineer',
    'Supervisor',
    'Admin',
    'Operator',
    'Electrician',
    'Plumber',
    'Carpenter',
    'Mason'
  ]

  useEffect(() => {
    fetchEmployees()
    fetchProjects()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          projects (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', editingEmployee.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([formData])

        if (error) throw error
      }

      await fetchEmployees()
      resetForm()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Error saving employee. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      email: employee.email || '',
      role: employee.role,
      daily_rate: employee.daily_rate || 0,
      hourly_rate: employee.hourly_rate || 0,
      employment_type: employee.employment_type,
      project_id: employee.project_id || '',
      status: employee.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Error deleting employee. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      employee_code: '',
      full_name: '',
      email: '',
      role: '',
      daily_rate: 0,
      hourly_rate: 0,
      employment_type: 'daily',
      project_id: '',
      status: 'active'
    })
    setEditingEmployee(null)
    setShowModal(false)
  }

  const generateEmployeeCode = () => {
    const prefix = 'EMP'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }

  const filteredEmployees = employees.filter(employee =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canManageEmployees = userProfile?.role === 'admin' || userProfile?.role === 'hr'

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage employee records and information</p>
        </div>
        {canManageEmployees && (
          <button
            onClick={() => {
              setFormData({...formData, employee_code: generateEmployeeCode()})
              setShowModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search employees..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{employee.full_name}</h3>
                  <p className="text-sm text-gray-600">{employee.employee_code}</p>
                </div>
              </div>
              {canManageEmployees && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Role:</span>
                <span>{employee.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Employment:</span>
                <span className="capitalize">{employee.employment_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rate:</span>
                <span>
                  {employee.employment_type === 'daily' 
                    ? `$${employee.daily_rate}/day`
                    : `$${employee.hourly_rate}/hr`
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Project:</span>
                <span>{employee.projects?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  employee.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManageEmployees 
              ? 'Get started by adding your first employee.'
              : 'No employees match your search criteria.'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && canManageEmployees && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field mt-1"
                  placeholder="worker@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  required
                  className="input-field mt-1"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select
                  className="input-field mt-1"
                  value={formData.employment_type}
                  onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                >
                  {employmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Daily Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({...formData, daily_rate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  className="input-field mt-1"
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="input-field mt-1"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingEmployee ? 'Update' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees