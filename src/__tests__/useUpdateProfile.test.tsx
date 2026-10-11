import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { profileRepository } from "@/features/profile/repositories/profileRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeProfile, makeUpdateProfileDTO, makeUser } from "./fixtures";
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

/** El hook más el QueryClient del wrapper, para inspeccionar la caché. */
const renderizar = () =>
  renderHook(() => ({ ...useUpdateProfile(), queryClient: useQueryClient() }), { wrapper });

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useUpdateProfile", () => {
  it("guarda los datos: llama al repository con ellos y expone el perfil devuelto", async () => {
    const datos = makeUpdateProfileDTO();
    const perfil = makeProfile({ ...datos });
    repo.update.mockResolvedValueOnce(perfil);
    const { result } = await renderizar();

    await act(async () => {
      await result.current.mutateAsync(datos);
    });

    // TanStack Query v5 agrega un segundo argumento (contexto) al mutationFn.
    expect(repo.update.mock.calls[0][0]).toEqual(datos);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(perfil);
  });

  it("caché: tras guardar reemplaza el perfil en caché sin volver a pedirlo", async () => {
    const perfilViejo = makeProfile({ nombre: "Ana" });
    const perfilNuevo = makeProfile({ nombre: "Ana María" });
    repo.update.mockResolvedValueOnce(perfilNuevo);
    const { result } = await renderizar();
    result.current.queryClient.setQueryData(["profile"], perfilViejo);

    await act(async () => {
      await result.current.mutateAsync(makeUpdateProfileDTO());
    });

    expect(result.current.queryClient.getQueryData(["profile"])).toEqual(perfilNuevo);
    expect(repo.get).not.toHaveBeenCalled();
  });

  it("caché: tras guardar marca ['me'] como desactualizado", async () => {
    repo.update.mockResolvedValueOnce(makeProfile());
    const { result } = await renderizar();
    result.current.queryClient.setQueryData(["me"], makeUser());

    await act(async () => {
      await result.current.mutateAsync(makeUpdateProfileDTO());
    });

    expect(result.current.queryClient.getQueryState(["me"])?.isInvalidated).toBe(true);
  });

  it("actualiza el usuario del store conservando los campos que el perfil no trae", async () => {
    const usuario = makeUser({ nombre: "Ana", rol: "usuario", foto_perfil: "foto.jpg" });
    useAuthStore.setState({ user: usuario, isAuthenticated: true });
    const datos = makeUpdateProfileDTO({ nombre: "Ana María", telefono: "7717654321" });
    repo.update.mockResolvedValueOnce(makeProfile({ ...datos, id_usuario: usuario.id_usuario }));
    const { result } = await renderizar();

    await act(async () => {
      await result.current.mutateAsync(datos);
    });

    expect(useAuthStore.getState().user).toMatchObject({
      nombre: "Ana María",
      telefono: "7717654321",
      rol: "usuario",
      foto_perfil: "foto.jpg",
    });
  });

  it("ante un error de la API expone el error y deja caché y store sin cambios", async () => {
    const usuario = makeUser();
    const perfilViejo = makeProfile();
    useAuthStore.setState({ user: usuario, isAuthenticated: true });
    const error = makeApiError({ status: 400, errors: ["Teléfono inválido"] });
    repo.update.mockRejectedValueOnce(error);
    const { result } = await renderizar();
    result.current.queryClient.setQueryData(["profile"], perfilViejo);
    result.current.queryClient.setQueryData(["me"], usuario);

    await act(async () => {
      await expect(result.current.mutateAsync(makeUpdateProfileDTO())).rejects.toBe(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(result.current.queryClient.getQueryData(["profile"])).toEqual(perfilViejo);
    expect(result.current.queryClient.getQueryState(["me"])?.isInvalidated).toBe(false);
    expect(useAuthStore.getState().user).toEqual(usuario);
  });
});
