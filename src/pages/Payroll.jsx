import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Download, DollarSign, Calendar, Users, CheckCircle } from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

const Payroll = () => {
  const { userProfile } = useAuth()
  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [payrollItems, setPayrollItems] = useState([])

  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    period_type: 'weekly'
  })

  useEffect(() => {
    fetchPayrolls()
    fetchEmployees()
  }, [])

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayrolls(data || [])
    } catch (error) {
      console.error('Error fetching payrolls:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchPayrollItems = async (payrollId) => {
    try {
      let query = supabase
        .from('payroll_items')
        .select(`
          *,
          employees (
            full_name,
            employee_code,
            role,
            daily_rate,
            hourly_rate,
            employment_type,
            user_id
          )
        `)
        .eq('payroll_id', payrollId)
      
      // If worker, only show their own payroll
      if (userProfile?.role === 'worker') {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userProfile.id)
          .single()
        
        if (employee) {
          query = query.eq('employee_id', employee.id)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setPayrollItems(data || [])
    } catch (error) {
      console.error('Error fetching payroll items:', error)
    }
  }

  const generatePayroll = async () => {
    setLoading(true)
    try {
      // Create payroll record
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll')
        .insert([{
          period_start: formData.period_start,
          period_end: formData.period_end,
          status: 'draft'
        }])
        .select()
        .single()

      if (payrollError) throw payrollError

      // Calculate payroll for each employee
      const payrollItems = []
      
      for (const employee of employees) {
        // Fetch attendance records for the period
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('attendance_date', formData.period_start)
          .lte('attendance_date', formData.period_end)

        if (attendanceError) throw attendanceError

        // Calculate totals
        const daysWorked = attendanceRecords.filter(r => r.time_in && r.time_out).length
        const totalHours = attendanceRecords.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0)
        const overtimeHours = attendanceRecords.reduce((sum, r) => sum + (parseFloat(r.overtime_hours) || 0), 0)

        // Calculate gross pay
        let grossPay = 0
        if (employee.employment_type === 'daily') {
          grossPay = daysWorked * (employee.daily_rate || 0)
        } else {
          grossPay = totalHours * (employee.hourly_rate || 0)
        }

        // Add overtime pay (1.5x rate)
        if (employee.employment_type !== 'daily') {
          grossPay += overtimeHours * (employee.hourly_rate || 0) * 0.5
        }

        // Fetch cash advances
        const { data: cashAdvances, error: advanceError } = await supabase
          .from('cash_advances')
          .select('amount')
          .eq('employee_id', employee.id)
          .eq('status', 'approved')
          .gte('date_requested', formData.period_start)
          .lte('date_requested', formData.period_end)

        if (advanceError) throw advanceError

        const totalAdvances = cashAdvances.reduce((sum, advance) => sum + advance.amount, 0)
        const netPay = grossPay - totalAdvances

        payrollItems.push({
          payroll_id: payroll.id,
          employee_id: employee.id,
          days_worked: daysWorked,
          hours_worked: totalHours,
          overtime_hours: overtimeHours,
          gross_pay: grossPay,
          cash_advance: totalAdvances,
          other_deductions: 0,
          net_pay: netPay
        })
      }

      // Insert payroll items
      const { error: itemsError } = await supabase
        .from('payroll_items')
        .insert(payrollItems)

      if (itemsError) throw itemsError

      await fetchPayrolls()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error generating payroll:', error)
      alert('Error generating payroll. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const approvePayroll = async (payrollId) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', payrollId)

      if (error) throw error
      await fetchPayrolls()
    } catch (error) {
      console.error('Error approving payroll:', error)
      alert('Error approving payroll. Please try again.')
    }
  }

  const exportPayroll = (payroll) => {
    const headers = ['Employee Code', 'Employee Name', 'Role', 'Days Worked', 'Hours Worked', 'Overtime Hours', 'Gross Pay', 'Cash Advance', 'Net Pay']
    const csvContent = [
      `Payroll Period: ${payroll.period_start} to ${payroll.period_end}`,
      '',
      headers.join(','),
      ...payrollItems.map(item => [
        item.employees.employee_code,
        item.employees.full_name,
        item.employees.role,
        item.days_worked,
        item.hours_worked,
        item.overtime_hours,
        item.gross_pay,
        item.cash_advance,
        item.net_pay
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${payroll.period_start}-${payroll.period_end}.csv`
    a.click()
  }

  const resetForm = () => {
    setFormData({
      period_start: '',
      period_end: '',
      period_type: 'weekly'
    })
  }

  const handlePeriodTypeChange = (type) => {
    const today = new Date()
    let start, end

    switch (type) {
      case 'weekly':
        start = startOfWeek(today, { weekStartsOn: 1 })
        end = endOfWeek(today, { weekStartsOn: 1 })
        break
      case 'monthly':
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      default:
        start = today
        end = today
    }

    setFormData({
      ...formData,
      period_type: type,
      period_start: format(start, 'yyyy-MM-dd'),
      period_end: format(end, 'yyyy-MM-dd')
    })
  }

  const canManagePayroll = userProfile?.role === 'admin' || userProfile?.role === 'hr'

  if (loading && payrolls.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Generate and manage employee payroll</p>
        </div>
        {canManagePayroll && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Payroll
          </button>
        )}
      </div>

      {/* Payroll List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Payroll Records</h2>
        
        {payrolls.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll records</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canManagePayroll 
                ? 'Generate your first payroll to get started.'
                : 'No payroll records available.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(payroll.period_start), 'MMM dd')} - {format(new Date(payroll.period_end), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payroll.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : payroll.status === 'paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(payroll.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayroll(payroll)
                          fetchPayrollItems(payroll.id)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                      {canManagePayroll && payroll.status === 'draft' && (
                        <button
                          onClick={() => approvePayroll(payroll.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}
                      {payroll.status === 'approved' && (
                        <button
                          onClick={() => {
                            fetchPayrollItems(payroll.id).then(() => exportPayroll(payroll))
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Export
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payroll Details Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Payroll Details - {format(new Date(selectedPayroll.period_start), 'MMM dd')} to {format(new Date(selectedPayroll.period_end), 'MMM dd, yyyy')}
              </h2>
              <button
                onClick={() => setSelectedPayroll(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.employees.full_name}</div>
                          <div className="text-sm text-gray-500">{item.employees.employee_code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.days_worked}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.hours_worked}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.overtime_hours}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.gross_pay}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.cash_advance}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">${item.net_pay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => exportPayroll(selectedPayroll)}
                className="btn-primary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showModal && canManagePayroll && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Generate New Payroll</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Type</label>
                <div className="mt-2 space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="period_type"
                      value="weekly"
                      checked={formData.period_type === 'weekly'}
                      onChange={(e) => handlePeriodTypeChange(e.target.value)}
                      className="form-radio"
                    />
                    <span className="ml-2">Weekly</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="period_type"
                      value="monthly"
                      checked={formData.period_type === 'monthly'}
                      onChange={(e) => handlePeriodTypeChange(e.target.value)}
                      className="form-radio"
                    />
                    <span className="ml-2">Monthly</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  className="input-field mt-1"
                  value={formData.period_start}
                  onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  required
                  className="input-field mt-1"
                  value={formData.period_end}
                  onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePayroll}
                  disabled={loading || !formData.period_start || !formData.period_end}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Payroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payroll