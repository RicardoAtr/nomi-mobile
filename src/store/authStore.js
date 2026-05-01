import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await get().fetchProfile(session.user)
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) await get().fetchProfile(session.user)
      else set({ user: null, profile: null })
    })
  },

  fetchProfile: async (user) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    set({ user, profile: data })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  },

  signUp: async (email, password, nombre) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } }
    })
    return error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  isPremium: () => get().profile?.plan === 'premium',
  isAdmin:   () => get().profile?.rol === 'admin',
}))
