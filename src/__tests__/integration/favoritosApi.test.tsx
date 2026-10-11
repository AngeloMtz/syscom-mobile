// Integración de favoritos: hook → repository → Axios con interceptores (falso) → caché.
// El servidor falso conserva su propio estado, así que el refetch posterior a cada
// cambio devuelve lo que la API tendría de verdad.
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { useToggleFavorite } from "@/features/favorites/hooks/useToggleFavorite";
import { clearToken, saveToken } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeFavoriteItemFor, makeFavoriteProduct } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { ok, usarClientePorPrueba } from "../utils/integracion";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

/** Estado del servidor falso: ids favoritos del más reciente al más antiguo. */
let favoritos: number[];
/** Si hay una función aquí, el POST/DELETE queda en espera hasta llamarla. */
let liberar: (() => void) | undefined;
let retener: boolean;
let falloEscritura: { status: number; message: string } | undefined;

function configurarServidor() {
  adapter.mockImplementation(async (config) => {
    const ruta = config.url ?? "";
    const metodo = config.method;

    if (metodo === "get" && ruta === "/favorites") {
      return ok(config, {
        data: favoritos.map((id) => makeFavoriteItemFor(id)),
        meta: { nextCursor: null, hasMore: false, total: favoritos.length },
      });
    }

    const id = Number(/^\/favorites\/(\d+)$/.exec(ruta)?.[1]);
    if ((metodo === "post" || metodo === "delete") && id) {
      const aplicar = () => {
        if (falloEscritura) throw makeApiError(falloEscritura);
        favoritos = metodo === "post" ? [id, ...favoritos.filter((f) => f !== id)] : favoritos.filter((f) => f !== id);
        return ok(config, { data: { id_favorito: id } }, metodo === "post" ? 201 : 200);
      };
      if (!retener) return aplicar();
      // El servidor "tarda": la respuesta solo sale cuando la prueba lo decide.
      return new Promise((resolve, reject) => {
        liberar = () => {
          try {
            resolve(aplicar());
          } catch (e) {
            reject(e);
          }
        };
      });
    }
    throw new Error(`Ruta no simulada: ${metodo} ${ruta}`);
  });
}

const idsDe = (items?: { productos: { id_producto: number } }[] | { items: { productos: { id_producto: number } }[] }) => {
  const lista = Array.isArray(items) ? items : items?.items;
  return lista?.map((i) => i.productos.id_producto);
};

const llamadas = () => adapter.mock.calls.map(([c]) => `${c.method} ${c.url}`);

async function montar() {
  const hook = await renderHook(() => ({ lista: useFavorites(), toggle: useToggleFavorite() }), {
    wrapper,
  });
  await waitFor(() => expect(hook.result.current.lista.isSuccess).toBe(true));
  return hook;
}

const producto20 = makeFavoriteProduct({ id_producto: 20, nombre: "Producto 20" });

beforeEach(async () => {
  adapter.mockReset();
  favoritos = [1];
  liberar = undefined;
  retener = false;
  falloEscritura = undefined;
  configurarServidor();
  await clearToken();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

describe("integración: favoritos con la API simulada", () => {
  it("agregar: la lista cambia ANTES de que responda el POST y después se sincroniza con el servidor", async () => {
    retener = true;
    const { result } = await montar();
    expect(idsDe(result.current.lista.data)).toEqual([1]);

    let pendiente!: Promise<void>;
    await act(async () => {
      pendiente = result.current.toggle.mutateAsync({ product: producto20, favorite: true });
    });

    // El POST salió y el servidor aún no respondió: la lista ya muestra el cambio.
    await waitFor(() => expect(liberar).toBeDefined());
    expect(llamadas()).toEqual(["get /favorites", "post /favorites/20"]);
    expect(favoritos).toEqual([1]);
    expect(idsDe(result.current.lista.data)).toEqual([20, 1]);
    expect(result.current.toggle.isPending).toBe(true);

    await act(async () => {
      liberar?.();
      await pendiente;
    });

    // Al responder se vuelve a pedir la lista real.
    await waitFor(() => expect(llamadas()).toEqual(["get /favorites", "post /favorites/20", "get /favorites"]));
    expect(favoritos).toEqual([20, 1]);
    await waitFor(() => expect(idsDe(result.current.lista.data)).toEqual([20, 1]));
  });

  it("quitar: la lista cambia al instante y el servidor termina sin ese favorito", async () => {
    favoritos = [20, 1];
    retener = true;
    const { result } = await montar();

    let pendiente!: Promise<void>;
    await act(async () => {
      pendiente = result.current.toggle.mutateAsync({ product: producto20, favorite: false });
    });

    await waitFor(() => expect(liberar).toBeDefined());
    expect(llamadas()[1]).toBe("delete /favorites/20");
    expect(favoritos).toEqual([20, 1]);
    expect(idsDe(result.current.lista.data)).toEqual([1]);
    expect(result.current.lista.data?.total).toBe(1);

    await act(async () => {
      liberar?.();
      await pendiente;
    });

    expect(favoritos).toEqual([1]);
    await waitFor(() => expect(idsDe(result.current.lista.data)).toEqual([1]));
  });

  it("si el POST falla con 500 la lista vuelve a como estaba y el error se expone", async () => {
    falloEscritura = { status: 500, message: "Error del servidor" };
    const { result } = await montar();

    await act(async () => {
      await result.current.toggle
        .mutateAsync({ product: producto20, favorite: true })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.toggle.isError).toBe(true));
    expect(idsDe(result.current.lista.data)).toEqual([1]);
    expect(result.current.lista.data?.total).toBe(1);
    expect(favoritos).toEqual([1]);
  });

  it("si el servidor responde 409 (ya era favorito) la acción cuenta como éxito", async () => {
    const { result } = await montar();
    // Otro dispositivo ya lo había marcado: el cliente aún no lo sabe.
    favoritos = [20, 1];
    falloEscritura = { status: 409, message: "El producto ya está en tus favoritos" };

    await act(async () => {
      await result.current.toggle.mutateAsync({ product: producto20, favorite: true });
    });

    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));
    await waitFor(() => expect(idsDe(result.current.lista.data)).toEqual([20, 1]));
  });

  it("sin sesión no sale ninguna petición a /favorites", async () => {
    useAuthStore.setState({ isAuthenticated: false });

    const { result } = await renderHook(() => useFavorites(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("con sesión la petición lleva el token como Bearer", async () => {
    await saveToken("jwt-de-prueba");

    await montar();

    const config = adapter.mock.calls[0][0];
    expect(config.url).toBe("/favorites");
    expect(String(config.headers.Authorization)).toBe("Bearer jwt-de-prueba");
  });
});
