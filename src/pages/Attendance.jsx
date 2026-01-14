import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Clock, Calendar, Users, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

const Attendance = () => {
  const { userProfile } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchEmployees()
    fetchAttendanceRecords()
    fetchTodayAttendance()
  }, [selectedDate])

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

  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          employees (
            full_name,
            employee_code,
            role
          )
        `)
        .eq('attendance_date', selectedDate)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttendanceRecords(data || [])
    } catch (error) {
      console.error('Error fetching attendance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayAttendance = async () => {
    if (userProfile?.role === 'worker') {
      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userProfile.id)
          .single()

        if (employee) {
          const today = new Date().toISOString().split('T')[0]
          const { data, error } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('employee_id', employee.id)
            .eq('attendance_date', today)
            .single()

          if (error && error.code !== 'PGRST116') throw error
          setTodayAttendance(data)
        }
      } catch (error) {
        console.error('Error fetching today attendance:', error)
      }
    }
  }

  const handleClockIn = async () => {
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, project_id')
        .eq('user_id', userProfile.id)
        .single()

      if (!employee) {
        alert('Employee record not found')
        return
      }

      const now = new Date()
      const timeIn = format(now, 'HH:mm:ss')
      const today = now.toISOString().split('T')[0]

      const { error } = await supabase
        .from('attendance_logs')
        .insert([{
          employee_id: employee.id,
          project_id: employee.project_id,
          attendance_date: today,
          time_in: timeIn,
          attendance_type: 'regular'
        }])

      if (error) throw error
      
      await fetchTodayAttendance()
      await fetchAttendanceRecords()
    } catch (error) {
      console.error('Error clocking in:', error)
      alert('Error clocking in. Please try again.')
    }
  }

  const handleClockOut = async () => {
    try {
      const now = new Date()
      const timeOut = format(now, 'HH:mm:ss')
      
      // Calculate total hours
      const timeInDate = new Date(`${todayAttendance.attendance_date}T${todayAttendance.time_in}`)
      const timeOutDate = new Date(`${todayAttendance.attendance_date}T${timeOut}`)
      const totalHours = (timeOutDate - timeInDate) / (1000 * 60 * 60)
      const overtimeHours = Math.max(0, totalHours - 8)

      const { error } = await supabase
        .from('attendance_logs')
        .update({
          time_out: timeOut,
          total_hours: totalHours.toFixed(2),
          overtime_hours: overtimeHours.toFixed(2)
        })
        .eq('id', todayAttendance.id)

      if (error) throw error
      
      await fetchTodayAttendance()
      await fetchAttendanceRecords()
    } catch (error) {
      console.error('Error clocking out:', error)
      alert('Error clocking out. Please try again.')
    }
  }

  const getAttendanceStatus = (record) => {
    if (record.attendance_type === 'absent') return 'Absent'
    if (record.attendance_type === 'half_day') return 'Half Day'
    if (record.time_in && record.time_out) return 'Complete'
    if (record.time_in) return 'Clocked In'
    return 'Not Started'
  }

  const getStatusColor = (record) => {
    const status = getAttendanceStatus(record)
    switch (status) {
      case 'Complete': return 'text-green-600 bg-green-100'
      case 'Clocked In': return 'text-blue-600 bg-blue-100'
      case 'Absent': return 'text-red-600 bg-red-100'
      case 'Half Day': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600">Track daily time in/out and manage attendance records</p>
      </div>

      {/* Worker Clock In/Out */}
      {userProfile?.role === 'worker' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
          
          {!todayAttendance ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Ready to start your day?</p>
              <button
                onClick={handleClockIn}
                className="btn-primary flex items-center mx-auto"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Clock In
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Clocked in at</p>
                <p className="text-2xl font-bold text-green-600">{todayAttendance.time_in}</p>
              </div>
              
              {todayAttendance.time_out ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Clocked out at</p>
                  <p className="text-2xl font-bold text-blue-600">{todayAttendance.time_out}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Total Hours: {todayAttendance.total_hours}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="btn-danger flex items-center mx-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clock Out
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Date Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            className="input-field"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <span className="text-sm text-gray-600">
            {attendanceRecords.length} records found
          </span>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Attendance Records</h2>
        
        {attendanceRecords.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
            <p className="mt-1 text-sm text-gray-500">No attendance recorded for this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employees?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employees?.employee_code} • {record.employees?.role}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time_in || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time_out || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_hours ? `${record.total_hours}h` : '-'}
                      {record.overtime_hours > 0 && (
                        <span className="text-orange-600 ml-1">
                          (+{record.overtime_hours}h OT)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record)}`}>
                        {getAttendanceStatus(record)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Attendance