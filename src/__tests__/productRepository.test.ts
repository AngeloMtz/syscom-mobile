import { PRODUCTS_PAGE_SIZE, productRepository } from "@/features/catalog/repositories/productRepository";

import { makeApiError, makePagination, makeProduct, makeProductDetail } from "./fixtures";
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

describe("productRepository.getPage", () => {
  it("envía GET /catalog/products y devuelve los productos con su paginación", async () => {
    const productos = [makeProduct({ id: 1 }), makeProduct({ id: 2 })];
    const pagination = makePagination({ page: 2, limit: 2, total: 5, pages: 3 });
    responde({ data: productos, pagination });

    const resultado = await productRepository.getPage({}, 2);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/products" });
    expect(resultado).toEqual({ data: productos, pagination });
  });

  it("pide la página recibida con el tamaño de página por defecto", async () => {
    responde({ data: [], pagination: makePagination() });

    await productRepository.getPage({}, 3);

    expect(ultimaPeticion().params).toMatchObject({ page: 3, limit: PRODUCTS_PAGE_SIZE });
  });

  it("envía los filtros como parámetros de la consulta", async () => {
    responde({ data: [], pagination: makePagination() });

    await productRepository.getPage(
      { categoria: 7, search: "laptop", precioMin: 100, precioMax: 900, ordenar: "precio_asc", limit: 5 },
      1,
    );

    expect(ultimaPeticion().params).toEqual({
      page: 1,
      limit: 5,
      categoria: 7,
      search: "laptop",
      precioMin: 100,
      precioMax: 900,
      ordenar: "precio_asc",
    });
  });

  it("devuelve lista vacía y paginación en cero si la respuesta viene incompleta", async () => {
    responde({});

    const resultado = await productRepository.getPage({}, 1);

    expect(resultado).toEqual({
      data: [],
      pagination: { page: 1, limit: PRODUCTS_PAGE_SIZE, total: 0, pages: 0 },
    });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(productRepository.getPage({}, 1)).rejects.toBe(error);
  });
});

describe("productRepository.getById", () => {
  it("envía GET /catalog/products/:id y devuelve el producto", async () => {
    const detalle = makeProductDetail({ id: 42 });
    responde({ data: detalle });

    const resultado = await productRepository.getById(42);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/products/42" });
    expect(resultado).toEqual(detalle);
  });

  it("rechaza si la respuesta no trae el producto", async () => {
    responde({});

    await expect(productRepository.getById(1)).rejects.toThrow();
  });

  it("rechaza con el error 404 de la API", async () => {
    const error = makeApiError({ status: 404, error: "Producto no encontrado" });
    adapter.mockRejectedValueOnce(error);

    await expect(productRepository.getById(999)).rejects.toBe(error);
  });

  it("rechaza con el error 500 de la API", async () => {
    const error = makeApiError({ status: 500, error: "Error al obtener producto" });
    adapter.mockRejectedValueOnce(error);

    await expect(productRepository.getById(1)).rejects.toBe(error);
  });
});
