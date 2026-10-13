import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useCreateAddress } from "@/features/addresses/hooks/useCreateAddress";
import { useDeleteAddress } from "@/features/addresses/hooks/useDeleteAddress";
import { useUpdateAddress } from "@/features/addresses/hooks/useUpdateAddress";
import { addressRepository } from "@/features/addresses/repositories/addressRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeAddress, makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/addresses/repositories/addressRepository", () => ({
  addressRepository: { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

const repo = addressRepository as jest.Mocked<typeof addressRepository>;
const { wrapper } = usarQueryWrapper();

const payload = {
  calle: "Av. Juárez 123",
  colonia: "Centro",
  ciudad: "Huejutla",
  estado: "Hidalgo",
  codigo_postal: "43000",
};

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
  useCheckoutStore.setState({ selectedAddressId: null });
});

const lista = () => [
  makeAddress({ id_direccion: 1, created_at: "2026-01-01T00:00:00.000Z" }),
  makeAddress({ id_direccion: 2, created_at: "2026-02-01T00:00:00.000Z" }),
];
const idsDe = (data?: { id_direccion: number }[]) => data?.map((a) => a.id_direccion);

async function montar(inicial = lista()) {
  repo.getAll.mockResolvedValue(inicial);
  const hook = await renderHook(
    () => ({
      lista: useAddresses(),
      create: useCreateAddress(),
      update: useUpdateAddress(),
      remove: useDeleteAddress(),
    }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.lista.isSuccess).toBe(true));
  return hook;
}

describe("useAddresses", () => {
  it("con sesión pide las direcciones y las ordena de la más reciente a la más antigua", async () => {
    repo.getAll.mockResolvedValueOnce(lista());
    const { result } = await renderHook(() => ({ ...useAddresses() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(idsDe(result.current.data)).toEqual([2, 1]);
  });

  it("sin sesión no hace ninguna petición", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = await renderHook(() => ({ ...useAddresses() }), { wrapper });

    expect(repo.getAll).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    repo.getAll.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useAddresses() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useCreateAddress", () => {
  it("crea la dirección, la deja elegida y vuelve a pedir la lista", async () => {
    repo.create.mockResolvedValueOnce(makeAddress({ id_direccion: 9 }));
    const { result } = await montar();
    expect(repo.getAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.create.mutateAsync(payload);
    });

    expect(repo.create.mock.calls[0][0]).toEqual(payload);
    expect(useCheckoutStore.getState().selectedAddressId).toBe(9);
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("si el servidor rechaza, expone el error y no cambia la elegida", async () => {
    useCheckoutStore.setState({ selectedAddressId: 2 });
    const error = makeApiError({
      status: 400,
      message: "La calle debe tener al menos 5 caracteres",
      errors: [{ field: "calle", message: "La calle debe tener al menos 5 caracteres" }],
    });
    repo.create.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      await result.current.create.mutateAsync(payload).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.create.isError).toBe(true));
    expect(result.current.create.error).toBe(error);
    expect(useCheckoutStore.getState().selectedAddressId).toBe(2);
  });
});

describe("useUpdateAddress", () => {
  it("guarda los cambios y vuelve a pedir la lista", async () => {
    repo.update.mockResolvedValueOnce(makeAddress({ id_direccion: 1, calle: "Nueva calle 45" }));
    const { result } = await montar();

    await act(async () => {
      await result.current.update.mutateAsync({ id: 1, payload: { ...payload, calle: "Nueva calle 45" } });
    });

    expect(repo.update.mock.calls[0][0]).toBe(1);
    expect(repo.update.mock.calls[0][1]).toEqual({ ...payload, calle: "Nueva calle 45" });
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("expone el error del servidor", async () => {
    const error = makeApiError({ status: 404, message: "Dirección no encontrada" });
    repo.update.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      await result.current.update.mutateAsync({ id: 1, payload }).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(result.current.update.error).toBe(error);
  });
});

describe("useDeleteAddress", () => {
  it("quita la dirección al instante, antes de que responda el DELETE", async () => {
    let terminar!: () => void;
    repo.remove.mockReturnValueOnce(new Promise<void>((r) => (terminar = r)));
    const { result } = await montar();

    let pendiente!: Promise<void>;
    await act(async () => {
      pendiente = result.current.remove.mutateAsync(2);
    });

    expect(repo.remove.mock.calls[0][0]).toBe(2);
    expect(idsDe(result.current.lista.data)).toEqual([1]);

    repo.getAll.mockResolvedValue([makeAddress({ id_direccion: 1 })]);
    await act(async () => {
      terminar();
      await pendiente;
    });
    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });

  it("si la API falla, la dirección vuelve a la lista y se expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    repo.remove.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      await result.current.remove.mutateAsync(2).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.remove.isError).toBe(true));
    expect(result.current.remove.error).toBe(error);
    expect(idsDe(result.current.lista.data)).toEqual([2, 1]);
  });

  it("si se elimina la elegida, limpia la elección", async () => {
    useCheckoutStore.setState({ selectedAddressId: 2 });
    repo.remove.mockResolvedValueOnce(undefined);
    const { result } = await montar();

    await act(async () => {
      await result.current.remove.mutateAsync(2);
    });

    expect(useCheckoutStore.getState().selectedAddressId).toBeNull();
  });

  it("si se elimina otra, conserva la elección", async () => {
    useCheckoutStore.setState({ selectedAddressId: 2 });
    repo.remove.mockResolvedValueOnce(undefined);
    const { result } = await montar();

    await act(async () => {
      await result.current.remove.mutateAsync(1);
    });

    expect(useCheckoutStore.getState().selectedAddressId).toBe(2);
  });

  it("con dos eliminaciones seguidas solo vuelve a pedir la lista al terminar la última", async () => {
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
});
