import { institutionalRepository } from "@/features/institutional/repositories/institutionalRepository";

import { makeApiError } from "./fixtures";
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

describe("institutionalRepository.getSliders", () => {
  it("envía GET /institutional/sliders y devuelve los banners", async () => {
    const sliders = [{ id: 1, imagen_url: "/banner1.png" }, { id: 2, imagen_url: "/banner2.png" }];
    responde({ data: sliders });

    const resultado = await institutionalRepository.getSliders();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/institutional/sliders" });
    expect(resultado).toEqual(sliders);
  });

  it("devuelve lista vacía si la respuesta no trae un arreglo", async () => {
    responde({ data: null });

    await expect(institutionalRepository.getSliders()).resolves.toEqual([]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(institutionalRepository.getSliders()).rejects.toBe(error);
  });
});

describe("institutionalRepository.getContent", () => {
  it("envía GET /institutional y devuelve el contenido", async () => {
    const contenido = { telefono: "+52 771 000 0000", correo: "contacto@syscom.com", direccion: "Calle 1" };
    responde({ data: contenido });

    const resultado = await institutionalRepository.getContent();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/institutional" });
    expect(resultado).toEqual(contenido);
  });

  it("devuelve null si la respuesta viene vacía", async () => {
    adapter.mockImplementationOnce(async (config) => ({
      data: null,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    await expect(institutionalRepository.getContent()).resolves.toBeNull();
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(institutionalRepository.getContent()).rejects.toBe(error);
  });
});
