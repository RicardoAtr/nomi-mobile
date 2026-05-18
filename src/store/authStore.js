import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    set({ loading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) await get().fetchProfile(session.user);
    else set({ loading: false });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await get().fetchProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        set({ user: null, profile: null, loading: false });
      }
    });
  },

  fetchProfile: async (user) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id);
    const profile = data?.[0] ?? null;
    set({ user, profile: profile ? { ...profile } : null, loading: false });
    return profile;
  },

  uploadAvatar: async (uri) => {
    const user = get().user;
    if (!user) return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(user.id, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(user.id);
      const avatarUrl = data.publicUrl + "?t=" + Date.now();
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      await get().fetchProfile(user);
      return avatarUrl;
    } catch (e) {
      console.error("Avatar upload failed:", e);
      return null;
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  },

  signUp: async (email, password, nombre) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    return error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  isPremium: () => get().profile?.plan === "premium",
  isAdmin: () => get().profile?.rol === "admin",
}));
