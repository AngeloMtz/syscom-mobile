// Integración de sesión y caché (#85/#86): authStore real + queryClient compartido
// real + hooks de favoritos, perfil y usuario + Axios falso con interceptor Bearer.
//
// Excepción a "un QueryClient por prueba": authStore.logout limpia el singleton
// de shared/api/queryClient, así que esa instancia es la que hay que usar. Se le
// ponen retry:false y gcTime:0 y se vacía antes y después de cada prueba.
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useMe } from "@/features/auth/hooks/useMe";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { queryClient } from "@/shared/api/queryClient";
import { clearToken } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeFavoriteItemFor, makeProfile, makeUser } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { ok } from "../utils/integracion";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter } = crearAxiosFalso();

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const cuentaA = makeUser({ id_usuario: 1, nombre: "Ana" });
const cuentaB = makeUser({ id_usuario: 2, nombre: "Beto" });

/** El servidor falso responde según el token Bearer, como el backend real. */
const FAVORITOS_POR_TOKEN: Record<string, number[]> = { "jwt-A": [1, 2], "jwt-B": [3] };
const USUARIO_POR_TOKEN: Record<string, ReturnType<typeof makeUser>> = {
  "jwt-A": cuentaA,
  "jwt-B": cuentaB,
};

beforeAll(() => {
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 },
  });
});

beforeEach(async () => {
  adapter.mockReset();
  adapter.mockImplementation(async (config) => {
    const token = String(config.headers.Authorization ?? "").replace("Bearer ", "");
    const usuario = USUARIO_POR_TOKEN[token];
    if (!usuario) throw { response: { status: 401, data: { success: false, message: "No autenticado" } } };

    if (config.url === "/favorites") {
      const ids = FAVORITOS_POR_TOKEN[token] ?? [];
      return ok(config, {
        data: ids.map((id) => makeFavoriteItemFor(id)),
        meta: { nextCursor: null, hasMore: false, total: ids.length },
      });
    }
    if (config.url === "/auth/me") return ok(config, { data: { user: usuario } });
    if (config.url === "/profile") {
      return ok(config, { data: makeProfile({ id_usuario: usuario.id_usuario, nombre: usuario.nombre }) });
    }
    throw new Error(`Ruta no simulada: ${config.method} ${config.url}`);
  });
  queryClient.clear();
  await clearToken();
  useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false });
});

afterEach(() => {
  queryClient.clear();
});

const idsDe = (data?: { items: { productos: { id_producto: number } }[] }) =>
  data?.items.map((i) => i.productos.id_producto);

describe("integración: cerrar sesión y caché de consultas", () => {
  it("al cerrar sesión la caché queda sin datos de la cuenta y no se vuelve a consultar", async () => {
    await useAuthStore.getState().setSession(cuentaA, "jwt-A");
    const { result } = await renderHook(
      () => ({ favoritos: useFavorites(), me: useMe(), perfil: useProfile() }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.favoritos.isSuccess).toBe(true);
      expect(result.current.me.isSuccess).toBe(true);
      expect(result.current.perfil.isSuccess).toBe(true);
    });
    expect(idsDe(result.current.favoritos.data)).toEqual([1, 2]);
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThanOrEqual(3);
    const antes = adapter.mock.calls.length;

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    // Con los hooks aún montados TanStack recrea las consultas, pero vacías:
    // ninguna conserva datos de la cuenta anterior ni queda una petición en curso.
    const consultas = queryClient.getQueryCache().getAll();
    expect(consultas.every((q) => q.state.data === undefined)).toBe(true);
    expect(consultas.every((q) => q.state.fetchStatus === "idle")).toBe(true);
    expect(result.current.favoritos.data).toBeUndefined();
    expect(result.current.me.data).toBeUndefined();
    expect(result.current.perfil.data).toBeUndefined();
    expect(queryClient.getQueryData(["favorites"])).toBeUndefined();
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
    expect(queryClient.getQueryData(["profile"])).toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, user: null });
    // Sin sesión ya no hay peticiones (ni siquiera sin token, que daría 401).
    expect(adapter.mock.calls.length).toBe(antes);
  });

  it("otra cuenta en el mismo dispositivo nunca ve los favoritos de la anterior", async () => {
    await useAuthStore.getState().setSession(cuentaA, "jwt-A");
    const primera = await renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(primera.result.current.isSuccess).toBe(true));
    expect(idsDe(primera.result.current.data)).toEqual([1, 2]);

    await act(async () => {
      await useAuthStore.getState().logout();
    });
    await primera.unmount();

    await act(async () => {
      await useAuthStore.getState().setSession(cuentaB, "jwt-B");
    });
    // Se registra cada valor que el hook llega a mostrar, no solo el final.
    const vistos: (number[] | undefined)[] = [];
    const segunda = await renderHook(
      () => {
        const query = useFavorites();
        vistos.push(idsDe(query.data));
        return query;
      },
      { wrapper },
    );

    await waitFor(() => expect(segunda.result.current.isSuccess).toBe(true));
    expect(idsDe(segunda.result.current.data)).toEqual([3]);
    // La cuenta B nunca vio un favorito de la cuenta A (ids 1 y 2).
    expect(vistos.length).toBeGreaterThan(0);
    for (const ids of vistos) {
      expect(ids?.includes(1) || ids?.includes(2)).toBeFalsy();
    }
    const ultima = adapter.mock.calls[adapter.mock.calls.length - 1][0];
    expect(String(ultima.headers.Authorization)).toBe("Bearer jwt-B");
  });
});
