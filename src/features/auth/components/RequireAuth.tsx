// src/features/auth/components/RequireAuth.tsx — Guard de rutas privadas.
// Envuelve el contenido que exige sesión. El catálogo y el home son públicos
// (la app nació como cliente de consumo abierto), así que el guard se aplica
// pantalla por pantalla, no al grupo (tabs) completo.
import { Redirect } from "expo-router";
import React from "react";

import { useAuthStore } from "@/shared/store/authStore";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <>{children}</>;
}
