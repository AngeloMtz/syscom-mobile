// Integración de la sesión caducada (#171): el backend responde 403 «Token inválido o expirado»
// cuando el JWT vence. La app debe cerrar la sesión sola y el guard debe sacar al usuario al login.
// Piezas reales: cliente Axios con sus interceptores (solo su adapter es falso), authStore, secureToken,
// RequireAuth, los hooks useCart/useFavorites/useAddresses, los repositories y TanStack Query.
// Simulados: expo-router (solo `Redirect`) y expo-secure-store. Sin red real, sin producción ni credenciales.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real
// ni del dispositivo.
import { render, screen, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { Text } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useCart } from "@/features/cart/hooks/useCart";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { getTokenSync } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeUser } from "../fixtures";
import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearAxiosFalso } from "../utils/axiosFake";
import { usarClientePorPrueba } from "../utils/integracion";

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text: Texto } = require("react-native");
  return {
    Redirect: ({ href }: { href: string }) => React.createElement(Texto, null, `redirige a ${href}`),
  };
});
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

/** Pantalla privada con tres consultas que salen a la vez al montarse. */
function PantallaPrivada() {
  useCart();
  useFavorites();
  useAddresses();
  return <Text>contenido privado</Text>;
}

const montar = () =>
  render(
    <RequireAuth>
      <PantallaPrivada />
    </RequireAuth>,
    { wrapper },
  );

/** Como Axios: el error del servidor lleva la `config` de la petición que lo causó. */
const rechazarTodo = (status: number, message: string) =>
  adapter.mockImplementation(async (config) => {
    throw Object.assign(makeApiError({ status, message }), { config });
  });

beforeEach(async () => {
  jest.clearAllMocks();
  adapter.mockReset();
  await reiniciarSesion();
  await useAuthStore.getState().setSession(makeUser(), "jwt-vencido");
  jest.mocked(SecureStore.deleteItemAsync).mockClear();
});

describe("integración: sesión caducada", () => {
  it("la primera petición con el token vencido cierra la sesión, borra el token y el guard redirige al login", async () => {
    rechazarTodo(403, "Token inválido o expirado");

    await montar();

    expect(await screen.findByText("redirige a /(auth)/login")).toBeTruthy();
    expect(screen.queryByText("contenido privado")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(getTokenSync()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("syscom.token");
  });

  it("las tres consultas en paralelo cierran la sesión una sola vez y ninguna se reintenta con el token vencido", async () => {
    rechazarTodo(403, "Token inválido o expirado");

    await montar();

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(3);
  });

  it("una cuenta suspendida (401 con la sesión abierta) también la cierra", async () => {
    rechazarTodo(401, "Tu cuenta ha sido suspendida. Contacta al administrador.");

    await montar();

    expect(await screen.findByText("redirige a /(auth)/login")).toBeTruthy();
    expect(getTokenSync()).toBeNull();
  });

  it("un 403 de otro tipo no cierra la sesión: el usuario sigue dentro", async () => {
    rechazarTodo(403, "No tienes permisos para realizar esta acción");

    await montar();

    await waitFor(() => expect(adapter).toHaveBeenCalledTimes(3));
    expect(screen.getByText("contenido privado")).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getTokenSync()).toBe("jwt-vencido");
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});
