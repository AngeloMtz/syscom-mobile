// src/app/(auth)/_layout.tsx — Pantallas de sesión.
// Sin header del navegador: cada pantalla monta el suyo.
// La lógica de autenticación (issue #3) no vive aquí, solo la estructura de rutas.
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
