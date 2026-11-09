import { profileRepository } from "@/features/profile/repositories/profileRepository";

import { makeApiError, makeProfile, makeUpdateProfileDTO } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

beforeEach(() => {
  adapter.mockReset();
});

describe("profileRepository.get", () => {
  it("envía GET /profile y devuelve el perfil", async () => {
    const perfil = makeProfile();
    responde({ data: perfil });

    const resultado = await profileRepository.get();

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/profile" });
    expect(cuerpo).toBeUndefined();
    expect(resultado).toEqual(perfil);
  });

  it("rechaza con el error de la API cuando la sesión no es válida", async () => {
    const error = makeApiError({ status: 401, message: "Token inválido" });
    adapter.mockRejectedValueOnce(error);

    await expect(profileRepository.get()).rejects.toBe(error);
  });
});

describe("profileRepository.update", () => {
  it("envía PUT /profile con los datos y devuelve el perfil actualizado", async () => {
    const datos = makeUpdateProfileDTO();
    const perfil = makeProfile({ ...datos });
    responde({ data: perfil });

    const resultado = await profileRepository.update(datos);

    expect(ultimaPeticion()).toMatchObject({ metodo: "put", ruta: "/profile", cuerpo: datos });
    expect(resultado).toEqual(perfil);
  });

  it("rechaza con el error de validación de la API", async () => {
    const error = makeApiError({ status: 400, errors: ["Teléfono inválido"] });
    adapter.mockRejectedValueOnce(error);

    await expect(profileRepository.update(makeUpdateProfileDTO())).rejects.toBe(error);
  });
});

describe("profileRepository.deleteAccount", () => {
  it("envía DELETE /profile con la contraseña en el cuerpo y no devuelve datos", async () => {
    responde({ message: "Tu cuenta se eliminó correctamente" });

    await expect(profileRepository.deleteAccount("Secreta1!")).resolves.toBeUndefined();

    expect(ultimaPeticion()).toMatchObject({
      metodo: "delete",
      ruta: "/profile",
      cuerpo: { password: "Secreta1!" },
    });
  });

  it("funciona suelto, como lo pasan los hooks", async () => {
    responde({});
    const { deleteAccount } = profileRepository;

    await expect(deleteAccount("x")).resolves.toBeUndefined();
  });

  it.each([
    [400, "La contraseña es incorrecta"],
    [409, "Tienes pedidos o servicios en curso. Podrás eliminar tu cuenta cuando terminen."],
  ])("rechaza con el error %i de la API", async (status, message) => {
    const error = makeApiError({ status, message });
    adapter.mockRejectedValueOnce(error);

    await expect(profileRepository.deleteAccount("x")).rejects.toBe(error);
  });
});
