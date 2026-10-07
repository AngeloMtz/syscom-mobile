import { act, renderHook } from "@testing-library/react-native";

import { authRepository } from "@/features/auth/repositories/authRepository";
import {
  useForgotPassword,
  useResetPassword,
  useVerifyRecovery,
} from "@/features/auth/hooks/usePasswordRecovery";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/auth/repositories/authRepository", () => ({
  authRepository: {
    forgotPassword: jest.fn(),
    verifyRecovery: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useForgotPassword", () => {
  it("pide el código de recuperación para el correo", async () => {
    repo.forgotPassword.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useForgotPassword(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("ana@example.com");
    });

    expect(repo.forgotPassword).toHaveBeenCalledWith("ana@example.com", "code");
    expect(result.current.isSuccess).toBe(true);
  });

  it("ante un error de la API expone el error", async () => {
    const error = makeApiError({ status: 404, message: "Usuario no encontrado" });
    repo.forgotPassword.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useForgotPassword(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("nadie@example.com")).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });
});

describe("useVerifyRecovery", () => {
  it("valida el código con correo y código", async () => {
    repo.verifyRecovery.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useVerifyRecovery(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ correo: "ana@example.com", code: "111222" });
    });

    expect(repo.verifyRecovery).toHaveBeenCalledWith("ana@example.com", "111222");
    expect(result.current.isSuccess).toBe(true);
  });

  it("ante un código incorrecto expone el error", async () => {
    const error = makeApiError({ status: 400, message: "Código inválido" });
    repo.verifyRecovery.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useVerifyRecovery(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ correo: "ana@example.com", code: "000000" }),
      ).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });
});

describe("useResetPassword", () => {
  const params = {
    correo: "ana@example.com",
    code: "111222",
    newPassword: "Nueva1234!",
    confirmPassword: "Nueva1234!",
  };

  it("fija la contraseña nueva con los datos recibidos", async () => {
    repo.resetPassword.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useResetPassword(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(params);
    });

    expect(repo.resetPassword).toHaveBeenCalledWith(params);
    expect(result.current.isSuccess).toBe(true);
  });

  it("ante un error de la API expone el error", async () => {
    const error = makeApiError({ status: 400, message: "El código expiró" });
    repo.resetPassword.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useResetPassword(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(params)).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });
});
