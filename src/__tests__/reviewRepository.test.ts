import { REVIEWS_PAGE_SIZE, reviewRepository } from "@/features/reviews/repositories/reviewRepository";

import { makeApiError, makeNetworkError } from "./fixtures";
import { makeReview } from "./fixtures/review";
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

describe("reviewRepository.getProductReviews", () => {
  it("envía GET /reviews/product/:id con la página y el tamaño por defecto (5)", async () => {
    responde({ data: { total: 0, promedio: "0.0", distribucion: {}, reviews: [] } });

    await reviewRepository.getProductReviews(7);

    const { metodo, ruta, params } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/reviews/product/7" });
    expect(params).toEqual({ page: 1, limit: REVIEWS_PAGE_SIZE });
    expect(REVIEWS_PAGE_SIZE).toBe(5);
  });

  it("pide la página recibida", async () => {
    responde({ data: { total: 12, promedio: "4.0", distribucion: {}, reviews: [] } });

    await reviewRepository.getProductReviews(7, 3, 5);

    expect(ultimaPeticion().params).toEqual({ page: 3, limit: 5 });
  });

  it("devuelve total, promedio como número, distribución y reseñas", async () => {
    const reseñas = [makeReview({ id_resena: 1 }), makeReview({ id_resena: 2, calificacion: 4 })];
    responde({
      data: {
        total: 2,
        promedio: "4.5",
        distribucion: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 },
        reviews: reseñas,
      },
    });

    const resultado = await reviewRepository.getProductReviews(7, 2);

    expect(resultado).toEqual({
      total: 2,
      promedio: 4.5,
      distribucion: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 },
      reviews: reseñas,
      page: 2,
    });
  });

  it("lista vacía: total 0, promedio 0 y sin reseñas (forma real del producto sin reseñas)", async () => {
    responde({
      data: { total: 0, promedio: "0.0", distribucion: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }, reviews: [] },
    });

    const resultado = await reviewRepository.getProductReviews(1);

    expect(resultado.total).toBe(0);
    expect(resultado.promedio).toBe(0);
    expect(resultado.reviews).toEqual([]);
  });

  it("si la respuesta no trae datos devuelve valores vacíos en vez de romper", async () => {
    responde({});

    const resultado = await reviewRepository.getProductReviews(7);

    expect(resultado).toEqual({
      total: 0,
      promedio: 0,
      distribucion: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      reviews: [],
      page: 1,
    });
  });

  it("`reviews` que no es un arreglo se trata como lista vacía", async () => {
    responde({ data: { total: 3, promedio: "4.0", distribucion: {}, reviews: null } });

    const resultado = await reviewRepository.getProductReviews(7);

    expect(resultado.reviews).toEqual([]);
  });

  it("promedio y total no numéricos se normalizan a 0", async () => {
    responde({ data: { total: "mucho", promedio: "abc", distribucion: {}, reviews: [] } });

    const resultado = await reviewRepository.getProductReviews(7);

    expect(resultado.total).toBe(0);
    expect(resultado.promedio).toBe(0);
  });

  it("completa las claves faltantes de la distribución con 0", async () => {
    responde({ data: { total: 3, promedio: "5.0", distribucion: { "5": 3 }, reviews: [] } });

    const resultado = await reviewRepository.getProductReviews(7);

    expect(resultado.distribucion).toEqual({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 3 });
  });

  it("conserva reseñas con `usuarios` nulo y `created_at` nulo sin descartarlas", async () => {
    const sinAutor = makeReview({ id_resena: 9, usuarios: null, created_at: null });
    responde({ data: { total: 1, promedio: "5.0", distribucion: { "5": 1 }, reviews: [sinAutor] } });

    const resultado = await reviewRepository.getProductReviews(7);

    expect(resultado.reviews).toEqual([sinAutor]);
  });

  it("rechaza con el error 503 del backend (error de conexión de la base de datos)", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    adapter.mockRejectedValueOnce(error);

    await expect(reviewRepository.getProductReviews(7)).rejects.toBe(error);
  });

  it("rechaza con el error de red", async () => {
    const error = makeNetworkError();
    adapter.mockRejectedValueOnce(error);

    await expect(reviewRepository.getProductReviews(7)).rejects.toBe(error);
  });
});
