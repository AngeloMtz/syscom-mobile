// Integración de sesión y compra: al cerrar sesión no queda nada de la cuenta
// anterior (carrito, direcciones, pedidos, pago pendiente) y la siguiente cuenta
// no llega a ver esos datos. Usa el queryClient COMPARTIDO y el authStore reales
// (logout limpia ese singleton); solo el adapter de Axios es falso.
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useCart } from "@/features/cart/hooks/useCart";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { queryClient } from "@/shared/api/queryClient";
import { clearToken } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeUser } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { crearServidorTienda, type ServidorTienda } from "../utils/servidorTienda";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter } = crearAxiosFalso();

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

let servidor: ServidorTienda;

beforeAll(() => {
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 },
    // Sin esto, cada mutación deja un temporizador de limpieza de 5 min que mantiene vivo Node.
    mutations: { ...queryClient.getDefaultOptions().mutations, retry: false, gcTime: 0 },
  });
});

beforeEach(async () => {
  adapter.mockReset();
  servidor = crearServidorTienda(adapter as never, [{ id: 7, nombre: "Mouse inalámbrico", precio: 250, stock: 10 }]);
  queryClient.clear();
  await clearToken();
  useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false });
});

afterEach(() => {
  queryClient.clear();
});

const montar = () =>
  renderHook(
    () => {
      const cart = useCart();
      const addresses = useAddresses();
      const orders = useOrders();
      return { cart, addresses, orders, add: useAddToCart() };
    },
    { wrapper },
  );

describe("integración: cierre de sesión y compra", () => {
  it("al cerrar sesión se vacía el carrito, las direcciones y los pedidos, y no se vuelve a consultar", async () => {
    await useAuthStore.getState().setSession(makeUser({ id_usuario: 1 }), "jwt-A");
    const { result } = await montar();
    await waitFor(() => expect(result.current.cart.isSuccess).toBe(true));
    await act(async () => {
      await result.current.add.mutateAsync(7);
    });
    await waitFor(() => expect(result.current.cart.data?.items).toHaveLength(1));
    const antes = servidor.llamadas.length;

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const consultas = queryClient.getQueryCache().getAll();
    expect(consultas.every((q) => q.state.data === undefined)).toBe(true);
    expect(result.current.cart.data).toBeUndefined();
    expect(result.current.addresses.data).toBeUndefined();
    expect(result.current.orders.data).toBeUndefined();
    expect(servidor.llamadas.length).toBe(antes);
  });

  it("la cuenta siguiente nunca ve el carrito de la anterior", async () => {
    await useAuthStore.getState().setSession(makeUser({ id_usuario: 1 }), "jwt-A");
    const primera = await montar();
    await waitFor(() => expect(primera.result.current.cart.isSuccess).toBe(true));
    await act(async () => {
      await primera.result.current.add.mutateAsync(7);
    });
    await waitFor(() => expect(primera.result.current.cart.data?.items).toHaveLength(1));

    await act(async () => {
      await useAuthStore.getState().logout();
    });
    await primera.unmount();

    // Otra cuenta en el mismo dispositivo: su carrito en el servidor está vacío.
    servidor.carrito.length = 0;
    await act(async () => {
      await useAuthStore.getState().setSession(makeUser({ id_usuario: 2 }), "jwt-B");
    });
    const vistos: number[] = [];
    const segunda = await renderHook(
      () => {
        const cart = useCart();
        vistos.push(cart.data?.items.length ?? -1);
        return cart;
      },
      { wrapper },
    );
    await waitFor(() => expect(segunda.result.current.isSuccess).toBe(true));

    expect(segunda.result.current.data?.items).toEqual([]);
    // Nunca llegó a mostrarse la línea de la cuenta anterior (1 elemento).
    expect(vistos.every((n) => n !== 1)).toBe(true);
  });
});
