// src/shared/theme/useColors.ts
import { palette, type AppColors } from "./colors";

// El sitio público es claro; la app usa siempre la paleta clara,
// sin importar si el dispositivo está en modo oscuro.
export function useColors(): AppColors {
  return palette.light;
}

export { spacing, radius, brand, cardShadow } from "./colors";
export type { AppColors };
