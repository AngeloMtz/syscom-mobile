import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { TOKEN_KEY } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeLoginPayload, makeUser } from "./fixtures";
import { reiniciarSesion } from "./utils/authHooksSetup";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/auth/repositories/authRepository", () => ({
  authRepository: { login: jest.fn() },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;
const secure = SecureStore as jest.Mocked<typeof SecureStore>;
const { wrapper } = usarQueryWrapper();

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useLogin", () => {
  it("inicia sesión: llama al repository con el payload y guarda user y token", async () => {
    const user = makeUser();
    const payload = makeLoginPayload();
    repo.login.mockResolvedValueOnce({ requires2FA: false, user, token: "jwt-1" });
    const { result } = await renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    // TanStack Query v5 agrega un segundo argumento (contexto) al mutationFn.
    expect(repo.login.mock.calls[0][0]).toEqual(payload);
    expect(secure.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, "jwt-1");
    expect(useAuthStore.getState()).toMatchObject({ user, isAuthenticated: true });
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.requires2FA).toBe(false);
  });

  it("con 2FA no crea sesión y expone requires2FA y el correo", async () => {
    repo.login.mockResolvedValueOnce({ requires2FA: true, correo: "ana@example.com" });
    const { result } = await renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(makeLoginPayload());
    });

    expect(result.current.requires2FA).toBe(true);
    expect(result.current.correo2FA).toBe("ana@example.com");
    expect(secure.setItemAsync).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
  });

  it("ante un error de la API expone el error y no crea sesión", async () => {
    const error = makeApiError({ status: 401, message: "Credenciales inválidas" });
    repo.login.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(makeLoginPayload())).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(result.current.requires2FA).toBe(false);
    expect(repo.login).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
  });
});
