import { REVIEWS_PAGE_SIZE, reviewRepository } from "@/features/reviews/repositories/reviewRepository";

import { makeApiError, makeNetworkError } from "./fixtures";
import { makeMyReview, makeReview } from "./fixtures/review";
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

// SUPUESTO (pendiente de verificar): la forma de can-review y de POST /reviews se leyó del código
// del backend; no se ha contrastado con una respuesta real. Estas pruebas fijan la tolerancia del
// repository ante variaciones, no el contrato real.
describe("reviewRepository.canReview", () => {
  it("envía GET /reviews/can-review/:id", async () => {
    responde({ data: { canReview: false } });

    await reviewRepository.canReview(7);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/reviews/can-review/7" });
  });

  it("puede reseñar: devuelve canReview true con el id del pedido", async () => {
    responde({ data: { canReview: true, id_pedido: 12 } });

    expect(await reviewRepository.canReview(7)).toEqual({ canReview: true, idPedido: 12, reason: null });
  });

  it("no puede reseñar: devuelve el motivo del servidor", async () => {
    responde({ data: { canReview: false, reason: "Ya dejaste una reseña para este producto." } });

    expect(await reviewRepository.canReview(7)).toEqual({
      canReview: false,
      idPedido: null,
      reason: "Ya dejaste una reseña para este producto.",
    });
  });

  it("si la respuesta no trae datos, no se puede reseñar y no se rompe", async () => {
    responde({});

    expect(await reviewRepository.canReview(7)).toEqual({ canReview: false, idPedido: null, reason: null });
  });

  it("canReview true sin id de pedido no es utilizable: se trata como que no puede (crear exige el pedido)", async () => {
    responde({ data: { canReview: true } });

    const resultado = await reviewRepository.canReview(7);

    expect(resultado.canReview).toBe(false);
    expect(resultado.idPedido).toBeNull();
  });

  it("acepta el id de pedido como texto numérico", async () => {
    responde({ data: { canReview: true, id_pedido: "12" } });

    expect((await reviewRepository.canReview(7)).idPedido).toBe(12);
  });

  it.each([[0], [-3], ["abc"], [1.5], [null]])("un id de pedido inválido (%s) no habilita la reseña", async (idPedido) => {
    responde({ data: { canReview: true, id_pedido: idPedido } });

    expect((await reviewRepository.canReview(7)).canReview).toBe(false);
  });

  it("un motivo vacío o que no es texto se normaliza a null", async () => {
    responde({ data: { canReview: false, reason: "   " } });
    expect((await reviewRepository.canReview(7)).reason).toBeNull();

    responde({ data: { canReview: false, reason: 42 } });
    expect((await reviewRepository.canReview(7)).reason).toBeNull();
  });

  it("canReview que no es exactamente true cuenta como false", async () => {
    responde({ data: { canReview: "true", id_pedido: 12 } });

    expect((await reviewRepository.canReview(7)).canReview).toBe(false);
  });

  it("rechaza con el 401 cuando no hay sesión", async () => {
    const error = makeApiError({ status: 401, message: "Token requerido" });
    adapter.mockRejectedValueOnce(error);

    await expect(reviewRepository.canReview(7)).rejects.toBe(error);
  });

  it("rechaza con el 503 del backend", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    adapter.mockRejectedValueOnce(error);

    await expect(reviewRepository.canReview(7)).rejects.toBe(error);
  });
});

describe("reviewRepository.create", () => {
  const entrada = {
    idProducto: 7,
    idPedido: 12,
    calificacion: 4,
    titulo: "Buen producto",
    comentario: "Llegó rápido y funciona bien.",
  };

  it("envía POST /reviews con tipo producto, ids, calificación, título y comentario", async () => {
    responde({ data: { id_resena: 99 } });

    await reviewRepository.create(entrada);

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/reviews" });
    expect(cuerpo).toEqual({
      tipo: "producto",
      id_producto: 7,
      id_pedido: 12,
      calificacion: 4,
      titulo: "Buen producto",
      comentario: "Llegó rápido y funciona bien.",
    });
  });

  it("sin título no envía la clave `titulo`", async () => {
    responde({ data: { id_resena: 99 } });

    await reviewRepository.create({ ...entrada, titulo: undefined });

    expect("titulo" in ultimaPeticion().cuerpo).toBe(false);
  });

  it("devuelve el id de la reseña creada", async () => {
    responde({ data: { id_resena: 99 } });

    expect(await reviewRepository.create(entrada)).toEqual({ idResena: 99 });
  });

  it("si la respuesta no trae el id, no se rompe (idResena null)", async () => {
    responde({});

    expect(await reviewRepository.create(entrada)).toEqual({ idResena: null });
  });

  it.each([["no comprado", "No puedes reseñar este producto. Necesitas haberlo comprado y recibido."], ["duplicada", "Ya dejaste una reseña para este producto."]])(
    "rechaza con el error 400 del servidor (%s) para mostrar su mensaje",
    async (_caso, message) => {
      const error = makeApiError({ status: 400, message });
      adapter.mockRejectedValueOnce(error);

      await expect(reviewRepository.create(entrada)).rejects.toBe(error);
    },
  );

  it("rechaza con el 503 y con el error de red", async () => {
    const e503 = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    adapter.mockRejectedValueOnce(e503);
    await expect(reviewRepository.create(entrada)).rejects.toBe(e503);

    const red = makeNetworkError();
    adapter.mockRejectedValueOnce(red);
    await expect(reviewRepository.create(entrada)).rejects.toBe(red);
  });
});

// SUPUESTO (pendiente de verificar): la forma de GET /reviews/my se leyó del código del backend
// (devuelve las reseñas de todos los tipos del usuario); no se ha contrastado con una respuesta real.
describe("reviewRepository.getMine", () => {
  it("envía GET /reviews/my", async () => {
    responde({ data: [] });

    await reviewRepository.getMine();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/reviews/my" });
  });

  it("devuelve las reseñas del usuario tal cual (el filtro por tipo se hace aparte)", async () => {
    const lista = [makeMyReview({ id_resena: 1 }), makeMyReview({ id_resena: 2, tipo: "servicio", productos: null })];
    responde({ data: lista });

    expect(await reviewRepository.getMine()).toEqual(lista);
  });

  it("sin reseñas devuelve una lista vacía", async () => {
    responde({ data: [] });

    expect(await reviewRepository.getMine()).toEqual([]);
  });

  it.each([[null], [undefined], ["x"], [{}]])("si `data` no es un arreglo (%s) devuelve lista vacía", async (data) => {
    responde({ data });

    expect(await reviewRepository.getMine()).toEqual([]);
  });

  it("descarta los elementos que no son reseñas (nulos o sin id) y conserva el resto", async () => {
    const buena = makeMyReview({ id_resena: 5 });
    responde({ data: [null, 7, "x", { tipo: "producto" }, { id_resena: "5" }, buena] });

    expect(await reviewRepository.getMine()).toEqual([buena]);
  });

  it("conserva reseñas con `productos` nulo y `created_at` nulo", async () => {
    const sinProducto = makeMyReview({ id_resena: 9, productos: null, created_at: null });
    responde({ data: [sinProducto] });

    expect(await reviewRepository.getMine()).toEqual([sinProducto]);
  });

  it("rechaza con el 401 sin sesión y con el 503 del backend", async () => {
    const e401 = makeApiError({ status: 401, message: "Token requerido" });
    adapter.mockRejectedValueOnce(e401);
    await expect(reviewRepository.getMine()).rejects.toBe(e401);

    const e503 = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    adapter.mockRejectedValueOnce(e503);
    await expect(reviewRepository.getMine()).rejects.toBe(e503);
  });
});
