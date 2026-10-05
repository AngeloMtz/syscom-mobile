// src/app/(auth)/_layout.tsx — Pantallas de sesión.
// Sin header del navegador: cada pantalla monta el suyo (AuthScaffold).
import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/shared/store/authStore";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Con sesión activa estas pantallas no tienen sentido: al iniciar sesión o
  // verificar el registro, esto es lo que saca al usuario del grupo (auth).
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
