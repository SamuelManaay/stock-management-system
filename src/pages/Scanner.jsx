import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Camera, Plus, X, Package, Download } from 'lucide-react'
import { format } from 'date-fns'

const Scanner = () => {
  const { userProfile } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: 'materials',
    quantity: 1,
    unit: 'pcs',
    notes: ''
  })

  const categories = ['materials', 'tools', 'equipment']
  const units = ['pcs', 'kg', 'lbs', 'meters', 'feet', 'liters', 'gallons', 'boxes']

  useEffect(() => {
    fetchTodayLogs()
    return () => stopCamera()
  }, [])

  const fetchTodayLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_item_logs')
        .select('*')
        .eq('log_date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodayLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setScanning(true)
    } catch (error) {
      console.error('Camera error:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const captureBarcode = () => {
    // Simulate barcode capture - in production, use a barcode scanning library
    const code = prompt('Enter barcode/QR code:')
    if (code) {
      handleScannedCode(code)
    }
  }

  const handleScannedCode = async (code) => {
    setScannedCode(code)
    stopCamera()

    try {
      // Check if item exists
      const { data: existingItem, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('item_code', code)
        .maybeSingle()

      if (error) throw error

      if (existingItem) {
        // Item exists, show update quantity dialog
        const quantity = parseFloat(prompt('Enter quantity to add:', '1'))
        if (quantity && quantity > 0) {
          await updateExistingItem(existingItem, quantity)
        }
      } else {
        // Item doesn't exist, show add form
        setFormData({ ...formData, item_code: code })
        setShowAddModal(true)
      }
    } catch (error) {
      console.error('Error processing scan:', error)
      alert('Error processing barcode. Please try again.')
    }
  }

  const updateExistingItem = async (item, quantity) => {
    setLoading(true)
    try {
      // Update inventory quantity
      const newQuantity = parseFloat(item.current_quantity) + quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_quantity: newQuantity })
        .eq('id', item.id)

      if (updateError) throw updateError

      // Log the action
      const { error: logError } = await supabase
        .from('daily_item_logs')
        .insert([{
          item_code: item.item_code,
          item_name: item.name,
          category: item.category,
          quantity: quantity,
          unit: item.unit,
          action_type: 'update',
          scanned_by: userProfile.id,
          notes: `Updated quantity from ${item.current_quantity} to ${newQuantity}`
        }])

      if (logError) throw logError

      alert(`Updated ${item.name}: +${quantity} ${item.unit}`)
      await fetchTodayLogs()
      setScannedCode('')
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Error updating item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNewItem = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Add to inventory
      const { data: newItem, error: addError } = await supabase
        .from('inventory_items')
        .insert([{
          item_code: formData.item_code,
          name: formData.item_name,
          category: formData.category,
          current_quantity: formData.quantity,
          minimum_quantity: 0,
          unit: formData.unit
        }])
        .select()
        .single()

      if (addError) throw addError

      // Log the action
      const { error: logError } = await supabase
        .from('daily_item_logs')
        .insert([{
          item_code: formData.item_code,
          item_name: formData.item_name,
          category: formData.category,
          quantity: formData.quantity,
          unit: formData.unit,
          action_type: 'add',
          scanned_by: userProfile.id,
          notes: formData.notes
        }])

      if (logError) throw logError

      alert('Item added successfully!')
      await fetchTodayLogs()
      setShowAddModal(false)
      setScannedCode('')
      setFormData({
        item_code: '',
        item_name: '',
        category: 'materials',
        quantity: 1,
        unit: 'pcs',
        notes: ''
      })
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (todayLogs.length === 0) {
      alert('No logs to export')
      return
    }

    const headers = ['Date', 'Item Code', 'Item Name', 'Category', 'Quantity', 'Unit', 'Action', 'Notes']
    const rows = todayLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
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
    a.download = `daily-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Scanner</h1>
          <p className="text-gray-600">Scan barcodes to track inventory</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-secondary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Today's Logs
        </button>
      </div>

      {/* Scanner Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Scan Item</h2>
        
        {!scanning ? (
          <div className="space-y-4">
            <button
              onClick={startCamera}
              className="btn-primary w-full flex items-center justify-center"
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Camera Scanner
            </button>
            
            <div className="text-center text-gray-500">or</div>
            
            <button
              onClick={() => setManualEntry(true)}
              className="btn-secondary w-full"
            >
              Enter Barcode Manually
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-blue-500 opacity-50 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-red-500"></div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={captureBarcode}
                className="btn-primary flex-1"
              >
                Capture Barcode
              </button>
              <button
                onClick={stopCamera}
                className="btn-danger"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {manualEntry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Barcode/QR Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Enter code..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && scannedCode) {
                    handleScannedCode(scannedCode)
                    setManualEntry(false)
                  }
                }}
              />
              <button
                onClick={() => {
                  if (scannedCode) {
                    handleScannedCode(scannedCode)
                    setManualEntry(false)
                  }
                }}
                className="btn-primary"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setManualEntry(false)
                  setScannedCode('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Today's Logs */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Today's Scanned Items ({todayLogs.length})</h2>
        
        {todayLogs.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No items scanned today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.item_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.item_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{log.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.quantity} {log.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action_type === 'add' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
            
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Code</label>
                <input
                  type="text"
                  required
                  readOnly
                  className="input-field mt-1 bg-gray-100"
                  value={formData.item_code}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Name</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  className="input-field mt-1"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    className="input-field mt-1"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  className="input-field mt-1"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setScannedCode('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Scanner
