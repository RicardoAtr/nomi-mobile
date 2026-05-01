import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../src/store/authStore'

export default function RootLayout() {
  const { init, user, loading } = useAuthStore()

  useEffect(() => { init() }, [])

  useEffect(() => {
    if (loading) return
    if (user) router.replace('/(tabs)/')
    else router.replace('/(auth)/login')
  }, [user, loading])

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
