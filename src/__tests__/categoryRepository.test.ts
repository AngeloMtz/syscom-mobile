import { categoryRepository } from "@/features/catalog/repositories/categoryRepository";

import { makeApiError, makeCategory } from "./fixtures";
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

describe("categoryRepository.getAll", () => {
  it("envía GET /catalog/categories y devuelve la lista de categorías", async () => {
    const categorias = [makeCategory({ id: 1 }), makeCategory({ id: 11, es_padre: false, id_padre: 1 })];
    responde({ data: categorias });

    const resultado = await categoryRepository.getAll();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/categories" });
    expect(resultado).toEqual(categorias);
  });

  it("devuelve lista vacía si la respuesta no trae un arreglo", async () => {
    responde({ data: null });

    await expect(categoryRepository.getAll()).resolves.toEqual([]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(categoryRepository.getAll()).rejects.toBe(error);
  });
});
