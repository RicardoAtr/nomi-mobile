import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

const storage = Platform.OS === 'web'
  ? {
      getItem:    async (key) => { try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null } catch { return null } },
      setItem:    async (key, val) => { try { if (typeof window !== 'undefined') window.localStorage.setItem(key, val) } catch {} },
      removeItem: async (key) => { try { if (typeof window !== 'undefined') window.localStorage.removeItem(key) } catch {} },
    }
  : AsyncStorage

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})