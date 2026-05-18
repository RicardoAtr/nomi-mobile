import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../src/store/authStore";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

export default function RootLayout() {
  const { init, user, loading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    "Jakarta-Regular": PlusJakartaSans_400Regular,
    "Jakarta-Medium": PlusJakartaSans_500Medium,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Jakarta-Bold": PlusJakartaSans_700Bold,
    "Jakarta-ExtraBold": PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (loading || !fontsLoaded) return;
    if (user) router.replace("/(tabs)/");
    else router.replace("/(auth)/login");
  }, [user, loading, fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
