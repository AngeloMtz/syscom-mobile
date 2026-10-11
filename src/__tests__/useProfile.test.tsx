import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useProfile } from "@/features/profile/hooks/useProfile";
import { profileRepository } from "@/features/profile/repositories/profileRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeProfile } from "./fixtures";
import { reiniciarSesion } from "./utils/authHooksSetup";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/profile/repositories/profileRepository", () => ({
  profileRepository: { get: jest.fn(), update: jest.fn() },
}));

const repo = profileRepository as jest.Mocked<typeof profileRepository>;
const { wrapper } = usarQueryWrapper();

async function iniciarSesion() {
  await act(async () => {
    useAuthStore.setState({ isAuthenticated: true });
  });
}

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useProfile", () => {
  it("con sesión activa pide el perfil y lo expone", async () => {
    const perfil = makeProfile();
    repo.get.mockResolvedValueOnce(perfil);
    await iniciarSesion();
    const { result } = await renderHook(() => ({ ...useProfile() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.get).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(perfil);
  });

  it("sin sesión no consulta al servidor", async () => {
    const { result } = await renderHook(() => ({ ...useProfile() }), { wrapper });

    expect(repo.get).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error de la API expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.get.mockRejectedValueOnce(error);
    await iniciarSesion();
    const { result } = await renderHook(() => ({ ...useProfile() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
