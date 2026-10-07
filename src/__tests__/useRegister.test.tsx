import { act, renderHook } from "@testing-library/react-native";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeRegisterPayload } from "./fixtures";
import { reiniciarSesion } from "./utils/authHooksSetup";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/auth/repositories/authRepository", () => ({
  authRepository: { register: jest.fn() },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useRegister", () => {
  it("crea la cuenta con el payload y no inicia sesión", async () => {
    const payload = makeRegisterPayload();
    repo.register.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useRegister(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    // TanStack Query v5 agrega un segundo argumento (contexto) al mutationFn.
    expect(repo.register.mock.calls[0][0]).toEqual(payload);
    expect(result.current.isSuccess).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("ante un error de la API (correo duplicado) expone el error", async () => {
    const error = makeApiError({ status: 409, message: "El correo ya está registrado" });
    repo.register.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useRegister(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(makeRegisterPayload())).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(repo.register).toHaveBeenCalledTimes(1);
  });
});
