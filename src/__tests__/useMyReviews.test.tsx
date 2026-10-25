import { renderHook, waitFor } from "@testing-library/react-native";

import { useMyReviews } from "@/features/reviews/hooks/useMyReviews";
import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError } from "./fixtures";
import { makeMyReview } from "./fixtures/review";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/features/reviews/repositories/reviewRepository", () => ({
  REVIEWS_PAGE_SIZE: 5,
  reviewRepository: { getProductReviews: jest.fn(), canReview: jest.fn(), create: jest.fn(), getMine: jest.fn() },
}));

const repo = reviewRepository as jest.Mocked<typeof reviewRepository>;
const { wrapper } = usarQueryWrapper();

const conSesion = (activa: boolean) =>
  useAuthStore.setState({ user: null, isAuthenticated: activa, isHydrating: false });

beforeEach(() => {
  jest.resetAllMocks();
  conSesion(true);
});

describe("useMyReviews", () => {
  it("con sesión pide las reseñas del usuario y expone solo las de producto con su total", async () => {
    repo.getMine.mockResolvedValueOnce([
      makeMyReview({ id_resena: 1, tipo: "producto" }),
      makeMyReview({ id_resena: 2, tipo: "servicio", productos: null }),
      makeMyReview({ id_resena: 3, tipo: "producto", estado: "aprobada" }),
    ]);

    const { result } = await renderHook(() => useMyReviews(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getMine).toHaveBeenCalledTimes(1);
    expect(result.current.data?.reviews.map((r) => r.id_resena)).toEqual([1, 3]);
    expect(result.current.data?.total).toBe(2);
  });

  it("sin reseñas devuelve lista vacía y total 0", async () => {
    repo.getMine.mockResolvedValueOnce([]);

    const { result } = await renderHook(() => useMyReviews(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ reviews: [], total: 0 });
  });

  it("si solo hay reseñas de otros tipos, la lista queda vacía", async () => {
    repo.getMine.mockResolvedValueOnce([makeMyReview({ tipo: "general" })]);

    const { result } = await renderHook(() => useMyReviews(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ reviews: [], total: 0 });
  });

  it("sin sesión no hace ninguna petición", async () => {
    conSesion(false);

    const { result } = await renderHook(() => useMyReviews(), { wrapper });

    expect(repo.getMine).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("un error llega como error del hook, sin datos", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    repo.getMine.mockRejectedValueOnce(error);

    const { result } = await renderHook(() => useMyReviews(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
