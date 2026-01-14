import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Package, Download, X, Camera } from 'lucide-react'
import { format } from 'date-fns'

const Scanner = () => {
  const { userProfile } = useAuth()
  const [scannedCode, setScannedCode] = useState('')
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [quantityInput, setQuantityInput] = useState('1')
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ code: '', time: 0 })

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: 'materials',
    quantity: 1,
    unit: 'pcs',
    notes: ''
  })

  useEffect(() => {
    fetchTodayLogs()
    // Delay scanner start to ensure DOM is ready
    const timer = setTimeout(() => startScanner(), 500)
    return () => {
      clearTimeout(timer)
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    if (scanning) return
    setCameraError('')
    
    try {
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      if (!isSecure && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setCameraError('Camera requires HTTPS on iOS/iPad. Please deploy to Netlify or use localhost on desktop.')
        return
      }

      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        setCameraError('No camera found on this device')
        return
      }

      // Find back camera (environment facing)
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      ) || devices[devices.length - 1] // Use last camera if no back camera found

      const scanner = new Html5Qrcode('reader')
      scannerRef.current = scanner

      await scanner.start(
        backCamera.id,
        { fps: 10, qrbox: 250 },
        onScanSuccess
      )
      setScanning(true)
    } catch (err) {
      console.error('Scanner error:', err)
      setCameraError(err.message || 'Camera access denied. Please allow camera permissions in browser settings.')
    }
  }

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current.stop().catch(console.error)
      setScanning(false)
    }
  }

  const onScanSuccess = (decodedText) => {
    const now = Date.now()
    if (decodedText && (decodedText !== lastScanRef.current.code || now - lastScanRef.current.time > 2000)) {
      lastScanRef.current = { code: decodedText, time: now }
      handleScannedCode(decodedText)
    }
  }

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

  const handleScannedCode = async (code) => {
    setScannedCode(code)
    console.log('Scanned code:', code)

    try {
      const { data: existingItem, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('item_code', code)
        .maybeSingle()

      if (error) throw error

      console.log('Existing item:', existingItem)

      if (existingItem) {
        console.log('Item exists, showing quantity modal')
        setCurrentItem(existingItem)
        setQuantityInput('1')
        setShowQuantityModal(true)
      } else {
        console.log('Item does not exist, showing add modal')
        setFormData({ item_code: code, item_name: '', category: 'materials', quantity: 1, unit: 'pcs', notes: '' })
        setShowAddModal(true)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleQuantitySubmit = async () => {
    const quantity = parseFloat(quantityInput)
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    setLoading(true)
    try {
      const newQuantity = parseFloat(currentItem.current_quantity) + quantity
      await supabase
        .from('inventory_items')
        .update({ current_quantity: newQuantity })
        .eq('id', currentItem.id)

      await supabase.from('daily_item_logs').insert([{
        item_code: currentItem.item_code,
        item_name: currentItem.name,
        category: currentItem.category,
        quantity: quantity,
        unit: currentItem.unit,
        action_type: 'update',
        scanned_by: userProfile.id,
        notes: `Updated from ${currentItem.current_quantity} to ${newQuantity}`
      }])

      alert(`✓ ${currentItem.name}: +${quantity} ${currentItem.unit}`)
      await fetchTodayLogs()
      setShowQuantityModal(false)
      setScannedCode('')
      setCurrentItem(null)
      // Restart scanner after modal closes
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume()
        }
      }, 100)
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating item')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNewItem = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await supabase.from('inventory_items').insert([{
        item_code: formData.item_code,
        name: formData.item_name,
        category: formData.category,
        current_quantity: formData.quantity,
        minimum_quantity: 0,
        unit: formData.unit
      }])

      await supabase.from('daily_item_logs').insert([{
        item_code: formData.item_code,
        item_name: formData.item_name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        action_type: 'add',
        scanned_by: userProfile.id,
        notes: formData.notes
      }])

      alert('✓ Item added!')
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
      // Restart scanner after modal closes
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume()
        }
      }, 100)
    } catch (error) {
      console.error('Error:', error)
      alert('Error adding item')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (todayLogs.length === 0) {
      alert('No logs to export')
      return
    }

    const headers = ['Date', 'Item Code', 'Item Name', 'Category', 'Quantity', 'Unit', 'Action']
    const rows = todayLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.item_code,
      log.item_name,
      log.category,
      log.quantity,
      log.unit,
      log.action_type
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
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
        <button onClick={exportToCSV} className="btn-secondary flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Scan Barcode</h2>
          {!scanning && !cameraError && (
            <button onClick={startScanner} className="ml-auto btn-primary text-sm">
              Start Camera
            </button>
          )}
        </div>
        <div id="reader" className="w-full max-w-lg mx-auto"></div>
        {cameraError && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            <p className="font-semibold">Camera Error:</p>
            <p className="text-sm">{cameraError}</p>
            <button onClick={startScanner} className="mt-2 btn-primary text-sm">
              Retry
            </button>
          </div>
        )}
        {scannedCode && (
          <p className="mt-4 text-center text-sm">
            Last: <span className="font-mono font-semibold text-green-600">{scannedCode}</span>
          </p>
        )}
      </div>

      {showQuantityModal && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Quantity</h3>
              <button onClick={() => setShowQuantityModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Item Code</p>
                <p className="font-mono font-semibold">{currentItem.item_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Item Name</p>
                <p className="font-semibold">{currentItem.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="font-semibold">{currentItem.current_quantity} {currentItem.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Add</label>
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="input"
                  min="0.01"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowQuantityModal(false)} className="btn-secondary flex-1" disabled={loading}>
                  Cancel
                </button>
                <button onClick={handleQuantitySubmit} className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Code</label>
                <input type="text" value={formData.item_code} className="input" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="input"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input">
                  <option value="materials">Materials</option>
                  <option value="tools">Tools</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="input"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input">
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="lbs">Pounds</option>
                  <option value="meters">Meters</option>
                  <option value="feet">Feet</option>
                  <option value="liters">Liters</option>
                  <option value="gallons">Gallons</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="2"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm">{format(new Date(log.created_at), 'HH:mm:ss')}</td>
                    <td className="px-4 py-3 text-sm font-mono">{log.item_code}</td>
                    <td className="px-4 py-3 text-sm">{log.item_name}</td>
                    <td className="px-4 py-3 text-sm">{log.quantity} {log.unit}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.action_type === 'add' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
    </div>
  )
}

export default Scanner
