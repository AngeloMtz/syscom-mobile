// src/shared/utils/url.ts — URLs de recursos que manda el backend.
import { API_URL } from "@/shared/api/client";

/**
 * Algunas imágenes llegan como ruta relativa ("/uploads/x.png") y otras ya
 * absolutas (Cloudinary). Las relativas se resuelven contra el host del
 * backend; vacías o nulas devuelven undefined.
 */
export function resolveAssetUrl(url: string | null | undefined): string | undefined {
  const limpia = url?.trim();
  if (!limpia) return undefined;
  if (/^https?:\/\//i.test(limpia)) return limpia;
  const host = API_URL.replace(/\/api\/?$/, "");
  return `${host}${limpia.startsWith("/") ? "" : "/"}${limpia}`;
}
