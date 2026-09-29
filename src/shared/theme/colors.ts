// src/shared/theme/colors.ts
// Paleta fiel a la PARTE PÚBLICA del sitio web SYSCOM. Sitio claro (sin dark mode).
// Tres azules reales del sitio:
//   #05afe8 cyan (CTA principal) · #3498db azul buscador · #023e8a azul profundo (chat/headers)
import { Platform } from "react-native";

export const brand = {
  primary: "#05afe8",
  primaryDark: "#0490c4",
  secondary: "#3498db",
  secondaryDark: "#2980b9",
  deep: "#023e8a",
  deepDark: "#012a6b",
};

const light = {
  brandPrimary: brand.primary,
  brandPrimaryDark: brand.primaryDark,
  brandSecondary: brand.secondary,
  brandDeep: brand.deep,
  brandDeepDark: brand.deepDark,

  background: "#f2f4f7", // gris muy claro estilo marketplace
  card: "#ffffff",
  surface: "#ffffff",
  text: "#0d1b2a",
  textMuted: "#6b7683",
  border: "#eceff3", // borde muy sutil (casi imperceptible)
  divider: "#f0f2f5",
  inputBg: "#ffffff",
  success: "#0f9d58",
  danger: "#e53935",
  warning: "#f59e0b",
  tabInactive: "#9aa5b1",
  star: "#f5a623",
  overlay: "rgba(0,0,0,0.45)",
  shadow: "#0d1b2a",
};

export const palette = { light };
export type AppColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

// Sombra suave reutilizable (estilo tarjetas de marketplace).
// En web usamos boxShadow (RN Web deprecó las props shadow*); en nativo, shadow*/elevation.
export const cardShadow = Platform.select({
  web: { boxShadow: "0 3px 10px rgba(13,27,42,0.06)" },
  default: {
    shadowColor: light.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
}) as object;
