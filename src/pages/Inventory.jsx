import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Package, Edit, Trash2, Download } from 'lucide-react'

const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    category: 'materials',
    unit: '',
    current_quantity: 0,
    minimum_quantity: 0,
    unit_cost: 0
  })

  const categories = [
    { value: 'materials', label: 'Materials' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' }
  ]

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update(formData)
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert([formData])

        if (error) throw error
      }

      await fetchItems()
      resetForm()
    } catch (error) {
      console.error('Error saving item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData(item)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      item_code: '',
      name: '',
      category: 'materials',
      unit: '',
      current_quantity: 0,
      minimum_quantity: 0,
      unit_cost: 0
    })
    setEditingItem(null)
    setShowModal(false)
  }

  const exportToCSV = () => {
    const headers = ['Item Code', 'Name', 'Category', 'Unit', 'Current Qty', 'Min Qty', 'Unit Cost']
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.item_code,
        item.name,
        item.category,
        item.unit,
        item.current_quantity,
        item.minimum_quantity,
        item.unit_cost
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading && items.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage construction materials, tools, and equipment</p>
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
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search items..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.item_code}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="capitalize">{item.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Stock:</span>
                <span className={`font-medium ${
                  item.current_quantity <= item.minimum_quantity 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {item.current_quantity} {item.unit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unit Cost:</span>
                <span>${item.unit_cost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first inventory item.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Code</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.item_code}
                  onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., pcs, kg, m"
                  className="input-field mt-1"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({...formData, current_quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field mt-1"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({...formData, minimum_quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field mt-1"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value) || 0})}
                />
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
                  {loading ? 'Saving...' : (editingItem ? 'Update' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory