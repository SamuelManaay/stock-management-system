import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Download, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const Payslip = () => {
  const { userProfile } = useAuth()
  const [payslips, setPayslips] = useState([])
  const [selectedPayslip, setSelectedPayslip] = useState(null)
  const [employeeData, setEmployeeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayslips()
  }, [])

  const fetchPayslips = async () => {
    try {
      // Get employee record
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userProfile.id)
        .single()

      if (empError) throw empError
      setEmployeeData(employee)

      // Get payroll items for this employee
      const { data, error } = await supabase
        .from('payroll_items')
        .select(`
          *,
          payroll (
            period_start,
            period_end,
            status,
            created_at
          )
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayslips(data || [])
    } catch (error) {
      console.error('Error fetching payslips:', error)
    } finally {
      setLoading(false)
    }
  }

  const printPayslip = () => {
    window.print()
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600">View and download your payment records</p>
        </div>
      </div>

      {!selectedPayslip ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payslips.map((payslip) => (
            <div
              key={payslip.id}
              onClick={() => setSelectedPayslip(payslip)}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">
                    {format(new Date(payslip.payroll.period_start), 'MMM dd')} - {format(new Date(payslip.payroll.period_end), 'MMM dd, yyyy')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(payslip.payroll.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Net Pay:</span>
                  <span className="font-bold text-green-600">${payslip.net_pay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payslip.payroll.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payslip.payroll.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex justify-between items-center print:hidden">
            <button
              onClick={() => setSelectedPayslip(null)}
              className="btn-secondary"
            >
              ← Back to List
            </button>
            <button
              onClick={printPayslip}
              className="btn-primary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Print / Download
            </button>
          </div>

          {/* Payslip Document */}
          <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 text-center">PAYSLIP</h1>
              <p className="text-center text-gray-600 mt-2">
                Pay Period: {format(new Date(selectedPayslip.payroll.period_start), 'MMMM dd, yyyy')} - {format(new Date(selectedPayslip.payroll.period_end), 'MMMM dd, yyyy')}
              </p>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Employee Information</h2>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">Name:</span> {employeeData?.full_name}</p>
                  <p className="text-sm"><span className="font-medium">Employee ID:</span> {employeeData?.employee_code}</p>
                  <p className="text-sm"><span className="font-medium">Position:</span> {employeeData?.role}</p>
                  <p className="text-sm"><span className="font-medium">Employment Type:</span> <span className="capitalize">{employeeData?.employment_type}</span></p>
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Information</h2>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">Pay Date:</span> {format(new Date(selectedPayslip.payroll.created_at), 'MMMM dd, yyyy')}</p>
                  <p className="text-sm"><span className="font-medium">Payment Status:</span> <span className="capitalize">{selectedPayslip.payroll.status}</span></p>
                  <p className="text-sm"><span className="font-medium">Days Worked:</span> {selectedPayslip.days_worked}</p>
                  <p className="text-sm"><span className="font-medium">Hours Worked:</span> {selectedPayslip.hours_worked}</p>
                </div>
              </div>
            </div>

            {/* Earnings */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 bg-gray-100 px-4 py-2 mb-3">EARNINGS</h2>
              <div className="space-y-2 px-4">
                <div className="flex justify-between text-sm">
                  <span>Basic Pay ({selectedPayslip.days_worked} days × ${employeeData?.daily_rate || employeeData?.hourly_rate}/day)</span>
                  <span className="font-medium">${(selectedPayslip.gross_pay - (selectedPayslip.overtime_hours * (employeeData?.hourly_rate || 0) * 0.5)).toFixed(2)}</span>
                </div>
                {selectedPayslip.overtime_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Overtime Pay ({selectedPayslip.overtime_hours} hrs × ${(employeeData?.hourly_rate * 1.5).toFixed(2)}/hr)</span>
                    <span className="font-medium">${(selectedPayslip.overtime_hours * employeeData?.hourly_rate * 0.5).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                  <span>GROSS PAY</span>
                  <span>${selectedPayslip.gross_pay.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 bg-gray-100 px-4 py-2 mb-3">DEDUCTIONS</h2>
              <div className="space-y-2 px-4">
                {selectedPayslip.cash_advance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Cash Advance</span>
                    <span className="font-medium text-red-600">-${selectedPayslip.cash_advance.toFixed(2)}</span>
                  </div>
                )}
                {selectedPayslip.other_deductions > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Other Deductions</span>
                    <span className="font-medium text-red-600">-${selectedPayslip.other_deductions.toFixed(2)}</span>
                  </div>
                )}
                {selectedPayslip.cash_advance === 0 && selectedPayslip.other_deductions === 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>No deductions</span>
                    <span>$0.00</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                  <span>TOTAL DEDUCTIONS</span>
                  <span className="text-red-600">-${(selectedPayslip.cash_advance + selectedPayslip.other_deductions).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">NET PAY</span>
                <span className="text-3xl font-bold text-green-600">${selectedPayslip.net_pay.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>This is a computer-generated payslip. No signature is required.</p>
              <p className="mt-1">For any queries, please contact the HR department.</p>
            </div>
          </div>
        </div>
      )}

      {payslips.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payslips available</h3>
          <p className="mt-1 text-sm text-gray-500">Your payslips will appear here once payroll is processed.</p>
        </div>
      )}
    </div>
  )
}

export default Payslip