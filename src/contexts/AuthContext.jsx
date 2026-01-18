import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preloadedData, setPreloadedData] = useState({
    inventory: [],
    employees: [],
    projects: [],
    attendance: [],
    payroll: [],
    dailyLogs: [],
    users: []
  })

  // Initialize auth - runs once on mount
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error || !session?.user) {
          console.log('No valid session')
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }

        console.log('Session found:', session.user.email)
        setUser(session.user)

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mounted) return

        if (profileError || !profile?.role) {
          console.error('Profile error:', profileError)
          await supabase.auth.signOut()
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }

        console.log('Profile loaded:', profile)
        setUserProfile(profile)

        // Preload data
        const today = new Date().toISOString().split('T')[0]
        
        const results = await Promise.allSettled([
          supabase.from('inventory_items').select('*').order('name'),
          profile.role === 'admin' || profile.role === 'hr' 
            ? supabase.from('employees').select('*').order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
          supabase.from('projects').select('*').order('created_at', { ascending: false }),
          supabase.from('attendance_logs').select('*').eq('attendance_date', today),
          supabase.from('payroll').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('daily_item_logs').select('*').eq('log_date', today).order('created_at', { ascending: false }),
          supabase.from('users').select('*').order('created_at', { ascending: false })
        ])

        if (!mounted) return

        const [inventory, employees, projects, attendance, payroll, dailyLogs, users] = results.map(result => 
          result.status === 'fulfilled' ? result.value : { data: [] }
        )

        setPreloadedData({
          inventory: inventory.data || [],
          employees: employees.data || [],
          projects: projects.data || [],
          attendance: attendance.data || [],
          payroll: payroll.data || [],
          dailyLogs: dailyLogs.data || [],
          users: users.data || []
        })

        console.log('Auth initialization complete')
        
      } catch (error) {
        console.error('Auth init error:', error)
        if (mounted) {
          await supabase.auth.signOut()
          setUser(null)
          setUserProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, []) // No dependencies - runs once

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setUserProfile(null)
        setPreloadedData({
          inventory: [],
          employees: [],
          projects: [],
          attendance: [],
          payroll: [],
          dailyLogs: [],
          users: []
        })
        return
      }

      // Don't reload on SIGNED_IN - let the normal flow handle it
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (data.user && !error) {
      await supabase.from('users').insert([{
        id: data.user.id,
        email,
        role: userData.role || 'worker'
      }])
    }

    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setPreloadedData({
      inventory: [],
      employees: [],
      projects: [],
      attendance: [],
      payroll: [],
      dailyLogs: [],
      users: []
    })
    return { error: null }
  }

  const value = {
    user,
    userProfile,
    loading,
    preloadedData,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}