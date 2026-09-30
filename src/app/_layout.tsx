// src/app/_layout.tsx — Stack raíz de la app.
// Agrupa (tabs) y (auth) sin header propio: cada grupo resuelve el suyo.
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/shared/api/queryClient";
import { useAuthStore } from "@/shared/store/authStore";
import { palette } from "@/shared/theme/colors";

const c = palette.light;

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Sin esto la app parpadearía como "sin sesión" antes de leer el token.
  if (isHydrating) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: c.card },
              headerTintColor: c.brandPrimary,
              headerTitleStyle: { color: c.text, fontWeight: "700" },
              contentStyle: { backgroundColor: c.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
