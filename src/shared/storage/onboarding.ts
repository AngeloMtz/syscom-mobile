// src/shared/storage/onboarding.ts — Flag de onboarding visto.
//
// Va en AsyncStorage y no en SecureStore: no es un dato sensible, solo una
// preferencia local. Las pantallas nunca tocan AsyncStorage directo; pasan
// por aquí.
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "onboarding_completed";

/** true si el usuario ya vio la bienvenida. Ante cualquier fallo asume que sí,
 *  para no atrapar a nadie en el onboarding si el almacenamiento falla. */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
  } catch {
    return true;
  }
}

/** Marca la bienvenida como vista. */
export async function setOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Si no se pudo guardar, el onboarding reaparecerá: molesto, no roto.
  }
}

/** Solo para pruebas manuales: vuelve a mostrar la bienvenida. */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // Sin efecto si no existe.
  }
}
