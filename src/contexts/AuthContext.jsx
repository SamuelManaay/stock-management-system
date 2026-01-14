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

  useEffect(() => {
    // Set a maximum loading time of 10 seconds
    const maxLoadingTimeout = setTimeout(() => {
      console.log('Max loading timeout reached, stopping loading')
      setLoading(false)
    }, 10000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session:', session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
      clearTimeout(maxLoadingTimeout)
    }).catch(err => {
      console.error('Session error:', err)
      setLoading(false)
      clearTimeout(maxLoadingTimeout)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(maxLoadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error || !data || !data.role) {
        console.error('Error fetching user profile or no role found:', error)
        // Sign out if no valid profile/role found
        await supabase.auth.signOut()
        setUser(null)
        setUserProfile(null)
      } else if (data) {
        console.log('User profile loaded:', data)
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

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
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          email_confirm: true
        }
      }
    })

    if (data.user && !error) {
      // Auto-confirm email
      await supabase.auth.admin.updateUserById(data.user.id, {
        email_confirm: true
      })
      
      // Create user profile
      await supabase.from('users').insert([
        {
          id: data.user.id,
          email,
          role: userData.role || 'worker'
        }
      ])
      
      // Link to existing employee record by email
      await supabase
        .from('employees')
        .update({ user_id: data.user.id })
        .eq('email', email)
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    userProfile,
    loading,
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