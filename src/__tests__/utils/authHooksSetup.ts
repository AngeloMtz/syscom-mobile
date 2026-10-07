import { clearToken } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * Deja la sesión limpia entre pruebas de hooks de auth: store sin usuario y
 * token en memoria vacío. Llamar dentro de un beforeEach, después de resetear
 * los mocks.
 */
export async function reiniciarSesion() {
  await clearToken();
  useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false });
}
