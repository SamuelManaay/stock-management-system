import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Simple storage check
const getStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Test localStorage
      const test = 'test'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return window.localStorage
    }
  } catch (e) {
    console.warn('localStorage not available, sessions may not persist')
  }
  return undefined
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: getStorage(),
    storageKey: 'sb-auth'
  }
})