import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useCart } from "@/features/cart/hooks/useCart";
import { useRemoveCartItem } from "@/features/cart/hooks/useRemoveCartItem";
import { useUpdateCartItem } from "@/features/cart/hooks/useUpdateCartItem";
import { cartRepository } from "@/features/cart/repositories/cartRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeCartItemFor, makeCartResult } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/cart/repositories/cartRepository", () => ({
  cartRepository: { getAll: jest.fn(), add: jest.fn(), setQuantity: jest.fn(), remove: jest.fn() },
}));

const repo = cartRepository as jest.Mocked<typeof cartRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

/** Carrito con dos líneas: producto 1 (2 × 100.00) y producto 2 (1 × 50.50). */
const carritoBase = () =>
  makeCartResult({
    items: [
      makeCartItemFor(1, { cantidad: 2, precio_unitario: "100.00" }),
      makeCartItemFor(2, { cantidad: 1, precio_unitario: "50.50" }),
    ],
    total: 2,
    totalPrice: "250.50",
  });

const idsDe = (data?: { items: { productos: { id_producto: number } }[] }) =>
  data?.items.map((i) => i.productos.id_producto);

async function montar(inicial = carritoBase()) {
  repo.getAll.mockResolvedValue(inicial);
  const hook = await renderHook(
    () => ({
      cart: useCart(),
      add: useAddToCart(),
      update: useUpdateCartItem(),
      remove: useRemoveCartItem(),
    }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.cart.isSuccess).toBe(true));
  return hook;
}

describe("useCart", () => {
  it("con sesión pide el carrito y lo expone", async () => {
    const carrito = carritoBase();
    repo.getAll.mockResolvedValueOnce(carrito);
    const { result } = await renderHook(() => ({ ...useCart() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(carrito);
  });

  it("sin sesión no hace ninguna petición", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = await renderHook(() => ({ ...useCart() }), { wrapper });

    expect(repo.getAll).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getAll.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useCart() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useAddToCart", () => {
  it("agrega el producto y vuelve a pedir el carrito", async () => {
    repo.add.mockResolvedValueOnce(undefined);
    const { result } = await montar();
    expect(repo.getAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.add.mutateAsync(7);
    });

    expect(repo.add.mock.calls[0][0]).toBe(7);
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("expone el error 409 (ya hay 99) para que la pantalla lo explique", async () => {
    const error = makeApiError({ status: 409, message: "No puedes agregar más de 99 unidades" });
    repo.add.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      await result.current.add.mutateAsync(7).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.add.isError).toBe(true));
    expect(result.current.add.error).toBe(error);
  });
});

describe("useUpdateCartItem", () => {
  it("cambia la cantidad y el total al instante, antes de que responda el PATCH", async () => {
    let terminar!: () => void;
    repo.setQuantity.mockReturnValueOnce(new Promise<void>((r) => (terminar = r)));
    const { result } = await montar();

    let pendiente!: Promise<void>;
    await act(async () => {
      pendiente = result.current.update.mutateAsync({ productId: 1, cantidad: 5 });
    });

    // El servidor aún no respondió y la pantalla ya muestra el nuevo total.
    expect(repo.setQuantity.mock.calls[0].slice(0, 2)).toEqual([1, 5]);
    expect(result.current.cart.data?.items[0].cantidad).toBe(5);
    expect(result.current.cart.data?.totalPrice).toBe("550.50");

    repo.getAll.mockResolvedValue(
      makeCartResult({
        items: [
          makeCartItemFor(1, { cantidad: 5, precio_unitario: "100.00" }),
          makeCartItemFor(2, { cantidad: 1, precio_unitario: "50.50" }),
        ],
        total: 2,
        totalPrice: "550.50",
      }),
    );
    await act(async () => {
      terminar();
      await pendiente;
    });
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("si la API falla revierte cantidad y total, y expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    repo.setQuantity.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      await result.current.update.mutateAsync({ productId: 1, cantidad: 5 }).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(result.current.update.error).toBe(error);
    expect(result.current.cart.data?.items[0].cantidad).toBe(2);
    expect(result.current.cart.data?.totalPrice).toBe("250.50");
  });

  it("con varias ediciones seguidas solo vuelve a pedir el carrito al terminar la última", async () => {
    const liberar: (() => void)[] = [];
    repo.setQuantity.mockImplementation(() => new Promise<void>((r) => liberar.push(r)));
    const { result } = await montar();

    let a!: Promise<void>;
    let b!: Promise<void>;
    await act(async () => {
      a = result.current.update.mutateAsync({ productId: 1, cantidad: 3 });
      b = result.current.update.mutateAsync({ productId: 1, cantidad: 4 });
    });
    await waitFor(() => expect(liberar).toHaveLength(2));

    await act(async () => {
      liberar[0]();
      await a;
    });
    // La primera terminó pero la segunda sigue en vuelo: no se pisa el optimista.
    expect(repo.getAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      liberar[1]();
      await b;
    });
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });
});

describe("useRemoveCartItem", () => {
  it("quita la línea y su importe al instante y llama a remove", async () => {
    let terminar!: () => void;
    repo.remove.mockReturnValueOnce(new Promise<void>((r) => (terminar = r)));
    const { result } = await montar();

    let pendiente!: Promise<void>;
    await act(async () => {
      pendiente = result.current.remove.mutateAsync(1);
    });

    expect(repo.remove.mock.calls[0][0]).toBe(1);
    expect(idsDe(result.current.cart.data)).toEqual([2]);
    expect(result.current.cart.data?.total).toBe(1);
    expect(result.current.cart.data?.totalPrice).toBe("50.50");

    repo.getAll.mockResolvedValue(
      makeCartResult({
        items: [makeCartItemFor(2, { cantidad: 1, precio_unitario: "50.50" })],
        total: 1,
        totalPrice: "50.50",
      }),
    );
    await act(async () => {
      terminar();
      await pendiente;
    });
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("con otra mutación en vuelo no vuelve a pedir el carrito hasta que termine la última", async () => {
    const liberar: (() => void)[] = [];
    repo.remove.mockImplementation(() => new Promise<void>((r) => liberar.push(r)));
    const { result } = await montar();

    let a!: Promise<void>;
    let b!: Promise<void>;
    await act(async () => {
      a = result.current.remove.mutateAsync(1);
      b = result.current.remove.mutateAsync(2);
    });
    await waitFor(() => expect(liberar).toHaveLength(2));

    await act(async () => {
      liberar[0]();
      await a;
    });
    expect(repo.getAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      liberar[1]();
      await b;
    });
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("si la API falla devuelve la línea y el total", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    repo.remove.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      await result.current.remove.mutateAsync(1).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.remove.isError).toBe(true));
    expect(idsDe(result.current.cart.data)).toEqual([1, 2]);
    expect(result.current.cart.data?.totalPrice).toBe("250.50");
  });
});
