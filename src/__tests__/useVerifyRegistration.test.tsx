import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useVerifyRegistration } from "@/features/auth/hooks/useVerifyRegistration";
import { TOKEN_KEY } from "@/shared/api/secureToken";
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
  authRepository: { verifyRegistration: jest.fn() },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;
const secure = SecureStore as jest.Mocked<typeof SecureStore>;
const { wrapper } = usarQueryWrapper();

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useVerifyRegistration", () => {
  it("verifica el registro con correo y código, y hace auto-login", async () => {
    const user = makeUser();
    repo.verifyRegistration.mockResolvedValueOnce({ user, token: "jwt-registro" });
    const { result } = await renderHook(() => useVerifyRegistration(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ correo: "ana@example.com", code: "654321" });
    });

    expect(repo.verifyRegistration).toHaveBeenCalledWith("ana@example.com", "654321");
    expect(secure.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, "jwt-registro");
    expect(useAuthStore.getState()).toMatchObject({ user, isAuthenticated: true });
  });

  it("ante un código incorrecto expone el error y no crea sesión", async () => {
    const error = makeApiError({ status: 400, message: "Código inválido o vencido" });
    repo.verifyRegistration.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useVerifyRegistration(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ correo: "ana@example.com", code: "000000" }),
      ).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(secure.setItemAsync).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
  });
});
