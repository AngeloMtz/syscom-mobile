import { act, renderHook } from "@testing-library/react-native";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useResendCode } from "@/features/auth/hooks/useResendCode";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/auth/repositories/authRepository", () => ({
  authRepository: { resendCode: jest.fn() },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useResendCode", () => {
  it("reenvía el código con el correo y el tipo recibidos", async () => {
    repo.resendCode.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useResendCode(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ correo: "ana@example.com", type: "2fa_login" });
    });

    expect(repo.resendCode).toHaveBeenCalledWith("ana@example.com", "2fa_login");
    expect(result.current.isSuccess).toBe(true);
  });

  it("ante un error de la API (rate limit) expone el error", async () => {
    const error = makeApiError({ status: 429 });
    repo.resendCode.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useResendCode(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ correo: "ana@example.com", type: "registration" }),
      ).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(repo.resendCode).toHaveBeenCalledTimes(1);
  });
});
