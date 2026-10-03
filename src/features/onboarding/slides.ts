// src/features/onboarding/slides.ts — Contenido de la bienvenida.
// Texto y iconografía; la presentación vive en components/.
import type { Ionicons } from "@expo/vector-icons";

export interface Slide {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
}

export const SLIDES: Slide[] = [
  {
    id: "bienvenida",
    icon: "hardware-chip-outline",
    title: "Bienvenido a SYSCOM",
    description:
      "Tu distribuidor de tecnología, ahora en tu teléfono. Equipo de cómputo, impresión y videovigilancia en un solo lugar.",
  },
  {
    id: "catalogo",
    icon: "grid-outline",
    title: "Explora el catálogo",
    description:
      "Busca entre laptops, impresoras, cámaras y más. Consulta precios, fichas técnicas y disponibilidad al instante.",
  },
  {
    id: "compra",
    icon: "bag-check-outline",
    title: "Compra y da seguimiento",
    description:
      "Arma tu carrito, paga de forma segura y sigue el estado de tus pedidos desde tu cuenta.",
  },
];
