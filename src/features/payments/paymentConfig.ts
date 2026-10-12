// src/features/payments/paymentConfig.ts — Configuración de Stripe en el cliente.
// Solo la clave PUBLICABLE (pk_...) va en la app, vía EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
// en el .env local. Nunca la clave secreta (sk_).
import * as Linking from "expo-linking";

export const STRIPE_PUBLISHABLE_KEY: string | undefined = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * URL a la que vuelve la app tras 3DS o una redirección. Con Linking.createURL
 * es "exp://..." en Expo Go y "syscommobile://..." en una compilación propia.
 */
export function getReturnUrl(): string {
  return Linking.createURL("stripe-redirect");
}

/** Esquema de la URL de retorno ("exp" en Expo Go), para `urlScheme` de StripeProvider. */
export function getUrlScheme(): string {
  return Linking.createURL("").split("://")[0];
}
