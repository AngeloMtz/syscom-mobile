import { brandRepository } from "@/features/catalog/repositories/brandRepository";
import type { Brand } from "@/features/catalog/types";

import { makeApiError } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

const marca = (over: Partial<Brand> = {}): Brand => ({ id: 1, nombre: "Hikvision", logo_url: null, ...over });

beforeEach(() => {
  adapter.mockReset();
});

describe("brandRepository.getAll", () => {
  it("envía GET /catalog/brands y devuelve la lista de marcas", async () => {
    const marcas = [marca({ id: 1 }), marca({ id: 2, nombre: "Dahua" })];
    responde({ data: marcas });

    const resultado = await brandRepository.getAll();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/brands" });
    expect(resultado).toEqual(marcas);
  });

  it("devuelve lista vacía si la respuesta no trae un arreglo", async () => {
    responde({ data: null });

    await expect(brandRepository.getAll()).resolves.toEqual([]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(brandRepository.getAll()).rejects.toBe(error);
  });
});
