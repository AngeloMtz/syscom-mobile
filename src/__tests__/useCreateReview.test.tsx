import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useCreateReview } from "@/features/reviews/hooks/useCreateReview";
import { MY_REVIEWS_KEY, canReviewKey } from "@/features/reviews/reviewKeys";
import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";

import { makeApiError } from "./fixtures";

jest.mock("@/features/reviews/repositories/reviewRepository", () => ({
  REVIEWS_PAGE_SIZE: 5,
  reviewRepository: { getProductReviews: jest.fn(), canReview: jest.fn(), create: jest.fn() },
}));

const repo = reviewRepository as jest.Mocked<typeof reviewRepository>;

const entrada = { idProducto: 7, idPedido: 12, calificacion: 5, comentario: "Excelente compra, muy recomendable." };

let client: QueryClient;
let invalidate: jest.SpyInstance;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  jest.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  invalidate = jest.spyOn(client, "invalidateQueries");
});

afterEach(() => {
  client.clear();
});

const clavesInvalidadas = () => invalidate.mock.calls.map((c) => (c[0] as { queryKey: unknown }).queryKey);

describe("useCreateReview", () => {
  it("crea la reseña con el repository y devuelve el resultado", async () => {
    repo.create.mockResolvedValueOnce({ idResena: 99 });
    const { result } = await renderHook(() => useCreateReview(), { wrapper });

    let resultado: unknown;
    await act(async () => {
      resultado = await result.current.mutateAsync(entrada);
    });

    expect(repo.create).toHaveBeenCalledWith(entrada);
    expect(resultado).toEqual({ idResena: 99 });
  });

  it("al terminar invalida can-review de ese producto y mis reseñas", async () => {
    repo.create.mockResolvedValueOnce({ idResena: 99 });
    const { result } = await renderHook(() => useCreateReview(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(entrada);
    });

    expect(clavesInvalidadas()).toEqual(expect.arrayContaining([canReviewKey(7), MY_REVIEWS_KEY]));
  });

  it("no invalida la lista pública del producto (la reseña nueva queda pendiente de aprobación)", async () => {
    repo.create.mockResolvedValueOnce({ idResena: 99 });
    const { result } = await renderHook(() => useCreateReview(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(entrada);
    });

    expect(clavesInvalidadas()).not.toContainEqual(["reviews", "product", 7]);
  });

  it("con un error 400 lo expone, no reintenta y vuelve a consultar can-review (por si ya había reseñado)", async () => {
    const error = makeApiError({ status: 400, message: "Ya dejaste una reseña para este producto." });
    repo.create.mockRejectedValue(error);
    const { result } = await renderHook(() => useCreateReview(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(entrada)).rejects.toBe(error);
    });

    expect(repo.create).toHaveBeenCalledTimes(1);
    // El estado de error del hook llega cuando TanStack notifica al observador, no al terminar el act.
    await waitFor(() => expect(result.current.error).toBe(error));
    expect(clavesInvalidadas()).toEqual(expect.arrayContaining([canReviewKey(7), MY_REVIEWS_KEY]));
  });

  it("las claves de caché son las que usan las demás consultas de reseñas", () => {
    expect(canReviewKey(7)).toEqual(["reviews", "can-review", 7]);
    expect(MY_REVIEWS_KEY).toEqual(["reviews", "my"]);
  });
});
