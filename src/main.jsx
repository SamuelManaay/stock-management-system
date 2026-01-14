import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Clear potentially corrupted Supabase auth data on app start
try {
  const supabaseKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase')
  )
  
  // Check if auth data is corrupted
  supabaseKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value) {
        JSON.parse(value) // Test if valid JSON
      }
    } catch (e) {
      console.log('Removing corrupted localStorage key:', key)
      localStorage.removeItem(key)
    }
  })
} catch (error) {
  console.error('Error checking localStorage:', error)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)