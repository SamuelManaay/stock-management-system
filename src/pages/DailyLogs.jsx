import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Download, Calendar, Package } from 'lucide-react'
import { format } from 'date-fns'

const DailyLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({
    totalItems: 0,
    totalAdded: 0,
    totalUpdated: 0
  })

  useEffect(() => {
    fetchLogs()
  }, [selectedDate])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_item_logs')
        .select('*')
        .eq('log_date', selectedDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLogs(data || [])
      
      // Calculate stats
      const totalItems = data?.length || 0
      const totalAdded = data?.filter(log => log.action_type === 'add').length || 0
      const totalUpdated = data?.filter(log => log.action_type === 'update').length || 0
      
      setStats({ totalItems, totalAdded, totalUpdated })
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert('No logs to export')
      return
    }

    const headers = ['Date', 'Time', 'Item Code', 'Item Name', 'Category', 'Quantity', 'Unit', 'Action', 'Notes']
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd'),
      format(new Date(log.created_at), 'HH:mm:ss'),
      log.item_code,
      log.item_name,
      log.category,
      log.quantity,
      log.unit,
      log.action_type,
      log.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liquidation-logs-${selectedDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    if (logs.length === 0) {
      alert('No logs to export')
      return
    }

    // Create Excel-compatible CSV with UTF-8 BOM
    const headers = ['Date', 'Time', 'Item Code', 'Item Name', 'Category', 'Quantity', 'Unit', 'Action', 'Notes']
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd'),
      format(new Date(log.created_at), 'HH:mm:ss'),
      log.item_code,
      log.item_name,
      log.category,
      log.quantity,
      log.unit,
      log.action_type,
      log.notes || ''
    ])

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liquidation-logs-${selectedDate}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
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
          <h1 className="text-2xl font-bold text-gray-900">Daily Liquidation Logs</h1>
          <p className="text-gray-600">View and export daily item logs</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={exportToExcel}
            className="btn-primary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Added</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAdded}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Updated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUpdated}</p>
            </div>
          </div>
        </div>
      </div>

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
            {logs.length} records found
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Logs for {format(new Date(selectedDate), 'MMMM dd, yyyy')}</h2>
        
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
            <p className="mt-1 text-sm text-gray-500">No items were scanned on this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.item_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {log.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.quantity} {log.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action_type === 'add' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.notes || '-'}
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

export default DailyLogs
