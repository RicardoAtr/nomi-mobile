import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const storage = {
  getItem: async (key) => {
    try {
      return typeof window !== "undefined"
        ? window.localStorage.getItem(key)
        : null;
    } catch {
      return null;
    }
  },
  setItem: async (key, val) => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, val);
    } catch {}
  },
  removeItem: async (key) => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
