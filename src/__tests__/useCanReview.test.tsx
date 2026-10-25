import { renderHook, waitFor } from "@testing-library/react-native";

import { useCanReview } from "@/features/reviews/hooks/useCanReview";
import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError } from "./fixtures";
import { makeCanReview } from "./fixtures/review";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/features/reviews/repositories/reviewRepository", () => ({
  REVIEWS_PAGE_SIZE: 5,
  reviewRepository: { getProductReviews: jest.fn(), canReview: jest.fn(), create: jest.fn() },
}));

const repo = reviewRepository as jest.Mocked<typeof reviewRepository>;
const { wrapper } = usarQueryWrapper();

const conSesion = (activa: boolean) =>
  useAuthStore.setState({ user: null, isAuthenticated: activa, isHydrating: false });

beforeEach(() => {
  jest.resetAllMocks();
  conSesion(true);
});

describe("useCanReview", () => {
  it("con sesión pregunta si el usuario puede reseñar el producto y expone la respuesta", async () => {
    repo.canReview.mockResolvedValueOnce(makeCanReview({ idPedido: 12 }));

    const { result } = await renderHook(() => useCanReview(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.canReview).toHaveBeenCalledWith(7);
    expect(result.current.data).toEqual({ canReview: true, idPedido: 12, reason: null });
  });

  it("sin sesión no hace ninguna petición", async () => {
    conSesion(false);

    const { result } = await renderHook(() => useCanReview(7), { wrapper });

    expect(repo.canReview).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it.each([[null], [0], [-3], [Number.NaN]])("con el id %s no consulta la API", async (id) => {
    await renderHook(() => useCanReview(id as number | null), { wrapper });

    expect(repo.canReview).not.toHaveBeenCalled();
  });

  it("devuelve el motivo cuando no puede reseñar", async () => {
    repo.canReview.mockResolvedValueOnce(
      makeCanReview({ canReview: false, idPedido: null, reason: "Ya dejaste una reseña para este producto." }),
    );

    const { result } = await renderHook(() => useCanReview(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.canReview).toBe(false);
    expect(result.current.data?.reason).toBe("Ya dejaste una reseña para este producto.");
  });

  it("un error llega como error del hook, sin datos", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    repo.canReview.mockRejectedValueOnce(error);

    const { result } = await renderHook(() => useCanReview(7), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
