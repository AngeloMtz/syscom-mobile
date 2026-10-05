// src/app/_layout.tsx — Stack raíz de la app.
// Agrupa (tabs) y (auth) sin header propio: cada grupo resuelve el suyo.
//
// Orden de arranque:
//   1. hidratar sesión (token) y leer el flag de onboarding
//   2. mientras alguna de las dos está en curso, no se pinta nada
//   3. si la bienvenida no se ha visto, se muestra ANTES del guard de auth
//   4. con la bienvenida vista, el Stack monta y cada grupo aplica su guard
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import OnboardingFlow from "@/features/onboarding/components/OnboardingFlow";
import { queryClient } from "@/shared/api/queryClient";
import { useAuthStore } from "@/shared/store/authStore";
import { useOnboardingStore } from "@/shared/store/onboardingStore";
import { palette } from "@/shared/theme/colors";

const c = palette.light;

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const isCheckingOnboarding = useOnboardingStore((s) => s.isChecking);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const completeOnboarding = useOnboardingStore((s) => s.complete);

  useEffect(() => {
    hydrate();
    hydrateOnboarding();
  }, [hydrate, hydrateOnboarding]);

  // Sin esto la app parpadearía como "sin sesión" antes de leer el token, o
  // mostraría la bienvenida a quien ya la vio.
  if (isHydrating || isCheckingOnboarding) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: c.background }}>
          {onboardingCompleted ? (
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
              <Stack.Screen
                name="profile/personal-data"
                options={{ title: "Datos personales" }}
              />
            </Stack>
          ) : (
            // Al completar, el flag cambia y el Stack monta solo: el guard de
            // cada grupo decide entonces entre (auth) y (tabs).
            <OnboardingFlow onFinish={completeOnboarding} />
          )}
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
