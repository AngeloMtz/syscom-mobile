import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useProductReviews } from "@/features/reviews/hooks/useProductReviews";
import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";

import { makeApiError } from "./fixtures";
import { makeProductReviewsPage, makeReview } from "./fixtures/review";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/reviews/repositories/reviewRepository", () => ({
  REVIEWS_PAGE_SIZE: 5,
  reviewRepository: { getProductReviews: jest.fn() },
}));

const repo = reviewRepository as jest.Mocked<typeof reviewRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

const reseñas = (desde: number, cuantas: number) =>
  Array.from({ length: cuantas }, (_, i) => makeReview({ id_resena: desde + i }));

describe("useProductReviews", () => {
  it("pide la primera página del producto y expone reseñas, total, promedio y distribución", async () => {
    const pagina = makeProductReviewsPage({
      total: 2,
      promedio: 4.5,
      distribucion: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 },
      reviews: reseñas(1, 2),
    });
    repo.getProductReviews.mockResolvedValueOnce(pagina);

    const { result } = await renderHook(() => useProductReviews(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getProductReviews).toHaveBeenCalledWith(7, 1);
    expect(result.current.data).toEqual({
      reviews: pagina.reviews,
      total: 2,
      promedio: 4.5,
      distribucion: pagina.distribucion,
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it("con un producto sin reseñas (total 0) devuelve lista vacía y no ofrece más páginas", async () => {
    repo.getProductReviews.mockResolvedValueOnce(
      makeProductReviewsPage({ total: 0, promedio: 0, reviews: [], distribucion: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } }),
    );

    const { result } = await renderHook(() => useProductReviews(1), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.reviews).toEqual([]);
    expect(result.current.data?.total).toBe(0);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetchNextPage pide la página 2 y concatena las reseñas", async () => {
    repo.getProductReviews
      .mockResolvedValueOnce(makeProductReviewsPage({ total: 7, reviews: reseñas(1, 5), page: 1 }))
      .mockResolvedValueOnce(makeProductReviewsPage({ total: 7, reviews: reseñas(6, 2), page: 2 }));

    const { result } = await renderHook(() => useProductReviews(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(repo.getProductReviews).toHaveBeenLastCalledWith(7, 2);
    expect(result.current.data?.reviews.map((r) => r.id_resena)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("si una página llega vacía no ofrece más páginas aunque el total sea mayor (evita un ciclo)", async () => {
    repo.getProductReviews.mockResolvedValueOnce(makeProductReviewsPage({ total: 9, reviews: [] }));

    const { result } = await renderHook(() => useProductReviews(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it.each([[null], [0], [-3], [Number.NaN]])("con el id %s no consulta la API", async (id) => {
    const { result } = await renderHook(() => useProductReviews(id as number | null), { wrapper });

    expect(repo.getProductReviews).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("un error 503 llega como error del hook, sin datos", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    repo.getProductReviews.mockRejectedValueOnce(error);

    const { result } = await renderHook(() => useProductReviews(7), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it("si falla la página 2 conserva las reseñas ya cargadas y marca el error de esa página", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    repo.getProductReviews
      .mockResolvedValueOnce(makeProductReviewsPage({ total: 7, reviews: reseñas(1, 5) }))
      .mockRejectedValueOnce(error);

    const { result } = await renderHook(() => useProductReviews(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(result.current.isFetchNextPageError).toBe(true);
    expect(result.current.data?.reviews).toHaveLength(5);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("cada producto usa su propia caché", async () => {
    repo.getProductReviews
      .mockResolvedValueOnce(makeProductReviewsPage({ total: 1, reviews: [makeReview({ id_resena: 10 })] }))
      .mockResolvedValueOnce(makeProductReviewsPage({ total: 1, reviews: [makeReview({ id_resena: 20 })] }));

    const primero = await renderHook(() => useProductReviews(7), { wrapper });
    await waitFor(() => expect(primero.result.current.isSuccess).toBe(true));
    const segundo = await renderHook(() => useProductReviews(8), { wrapper });
    await waitFor(() => expect(segundo.result.current.isSuccess).toBe(true));

    expect(primero.result.current.data?.reviews[0].id_resena).toBe(10);
    expect(segundo.result.current.data?.reviews[0].id_resena).toBe(20);
    expect(repo.getProductReviews).toHaveBeenCalledTimes(2);
  });
});
