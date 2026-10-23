import { modelsRepository } from "@/features/ar/repositories/modelsRepository";
import type { Product3DModel } from "@/features/ar/types";

import { makeApiError } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

const modelo = (over: Partial<Product3DModel> = {}): Product3DModel => ({
  id: 1,
  url: "https://example.com/m.glb",
  formato: "glb",
  ...over,
});

beforeEach(() => {
  adapter.mockReset();
});

describe("modelsRepository.getByProductId", () => {
  it("envía GET /catalog/products/:id/modelos-3d y devuelve los modelos", async () => {
    const modelos = [modelo({ id: 1 }), modelo({ id: 2, formato: "usdz", url: "https://example.com/m.usdz" })];
    responde({ data: modelos });

    const resultado = await modelsRepository.getByProductId(42);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/products/42/modelos-3d" });
    expect(resultado).toEqual(modelos);
  });

  it("devuelve lista vacía si la respuesta no trae un arreglo", async () => {
    responde({ data: null });

    await expect(modelsRepository.getByProductId(1)).resolves.toEqual([]);
  });

  it("devuelve lista vacía si el producto no existe (404)", async () => {
    adapter.mockRejectedValueOnce(makeApiError({ status: 404, error: "Producto no encontrado" }));

    await expect(modelsRepository.getByProductId(999)).resolves.toEqual([]);
  });

  it("rechaza con el error 500 de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(modelsRepository.getByProductId(1)).rejects.toBe(error);
  });
});
