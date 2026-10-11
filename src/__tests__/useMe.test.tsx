import { act, renderHook, waitFor } from "@testing-library/react-native";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useMe } from "@/features/auth/hooks/useMe";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeUser } from "./fixtures";
import { reiniciarSesion } from "./utils/authHooksSetup";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/auth/repositories/authRepository", () => ({
  authRepository: { getMe: jest.fn() },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;

const { wrapper } = usarQueryWrapper();

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useMe", () => {
  // TanStack Query solo re-renderiza por las propiedades que el componente leyó
  // durante el render. El spread de useMe() las lee todas, así que
  // result.current siempre refleja el estado completo de la consulta.
  it("con sesión activa recupera el usuario y lo guarda en el store", async () => {
    const user = makeUser();
    repo.getMe.mockResolvedValueOnce(user);
    await act(async () => {
      useAuthStore.setState({ isAuthenticated: true });
    });
    const { result } = await renderHook(() => ({ ...useMe() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getMe).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("sin sesión no consulta al servidor", async () => {
    const { result } = await renderHook(() => ({ ...useMe() }), { wrapper });

    expect(repo.getMe).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("ante un error de la API expone el error y no toca el usuario", async () => {
    const error = makeApiError({ status: 404, message: "Not found" });
    repo.getMe.mockRejectedValueOnce(error);
    await act(async () => {
      useAuthStore.setState({ isAuthenticated: true });
    });
    const { result } = await renderHook(() => ({ ...useMe() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(repo.getMe).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
