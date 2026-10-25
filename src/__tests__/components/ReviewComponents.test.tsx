import { fireEvent, render, screen } from "@testing-library/react-native";

import ProductReviewsSection from "@/features/reviews/components/ProductReviewsSection";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import ReviewSummary from "@/features/reviews/components/ReviewSummary";
import StarRating from "@/features/reviews/components/StarRating";
import { useProductReviews } from "@/features/reviews/hooks/useProductReviews";

import { makeApiError } from "../fixtures";
import { makeReview } from "../fixtures/review";

// Los íconos se simulan como texto con el nombre del ícono para poder contar estrellas llenas, medias y vacías.
jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("@/features/reviews/hooks/useProductReviews", () => ({ useProductReviews: jest.fn() }));
// La acción de "Escribir reseña" tiene sus propias pruebas; aquí solo se comprueba dónde aparece.
jest.mock("@/features/reviews/components/WriteReviewAction", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ productId, productName }: { productId: number; productName?: string }) =>
      React.createElement(Text, null, `accion-escribir:${productId}:${productName ?? ""}`),
  };
});

const useReviews = useProductReviews as jest.Mock;

const DIST_VACIA = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

beforeEach(() => {
  jest.resetAllMocks();
});

describe("StarRating", () => {
  it("expone la calificación como etiqueta accesible", async () => {
    await render(<StarRating value={4} />);
    expect(screen.getByLabelText("4 de 5 estrellas")).toBeTruthy();
  });

  it("dibuja 5 íconos: 4 llenos y 1 vacío con 4 estrellas", async () => {
    await render(<StarRating value={4} />);
    expect(screen.getAllByText("star")).toHaveLength(4);
    expect(screen.getAllByText("star-outline")).toHaveLength(1);
  });

  it("4.5 dibuja una media estrella", async () => {
    await render(<StarRating value={4.5} />);
    expect(screen.getAllByText("star")).toHaveLength(4);
    expect(screen.getAllByText("star-half")).toHaveLength(1);
  });

  it("un valor inválido se muestra como 0 estrellas, sin romper", async () => {
    await render(<StarRating value={Number.NaN} />);
    expect(screen.getAllByText("star-outline")).toHaveLength(5);
    expect(screen.getByLabelText("0 de 5 estrellas")).toBeTruthy();
  });
});

describe("ReviewCard", () => {
  it("muestra autor abreviado, fecha, título, comentario y calificación", async () => {
    await render(<ReviewCard review={makeReview()} />);

    expect(screen.getByText("Angel M.")).toBeTruthy();
    expect(screen.getByText("29 jun 2026")).toBeTruthy();
    expect(screen.getByText("Buen producto")).toBeTruthy();
    expect(screen.getByText("Llegó rápido y funciona perfecto.")).toBeTruthy();
    expect(screen.getByLabelText("5 de 5 estrellas")).toBeTruthy();
  });

  it("sin título no deja un hueco ni muestra 'null'", async () => {
    await render(<ReviewCard review={makeReview({ titulo: null })} />);

    expect(screen.queryByText("null")).toBeNull();
    expect(screen.getByText("Llegó rápido y funciona perfecto.")).toBeTruthy();
  });

  it("con `usuarios` nulo usa el nombre genérico", async () => {
    await render(<ReviewCard review={makeReview({ usuarios: null })} />);
    expect(screen.getByText("Cliente de SYSCOM")).toBeTruthy();
  });

  it("con `created_at` nulo no muestra fecha", async () => {
    await render(<ReviewCard review={makeReview({ created_at: null })} />);

    expect(screen.queryByText("Fecha no disponible")).toBeNull();
    expect(screen.getByText("Angel M.")).toBeTruthy();
  });

  it("lee el autor de `usuario` cuando solo viene esa clave", async () => {
    const review = makeReview({
      usuarios: undefined,
      usuario: { nombre: "Luis", apellido_paterno: "Hernández", foto_perfil: null },
    });
    await render(<ReviewCard review={review} />);
    expect(screen.getByText("Luis H.")).toBeTruthy();
  });
});

describe("ReviewSummary", () => {
  it("muestra el promedio, el total y una fila por cada calificación", async () => {
    await render(
      <ReviewSummary total={4} promedio={4.25} distribucion={{ "1": 0, "2": 0, "3": 1, "4": 1, "5": 2 }} />,
    );

    expect(screen.getByText("4.3")).toBeTruthy();
    expect(screen.getByText("4 reseñas")).toBeTruthy();
    for (const estrellas of [5, 4, 3, 2, 1]) {
      expect(screen.getByLabelText(new RegExp(`^${estrellas} estrellas?: `))).toBeTruthy();
    }
    expect(screen.getByLabelText("5 estrellas: 2 reseñas, 50 %")).toBeTruthy();
    expect(screen.getByLabelText("1 estrella: 0 reseñas, 0 %")).toBeTruthy();
  });

  it("con total 0 muestra 'Sin reseñas' y ninguna barra con porcentaje", async () => {
    await render(<ReviewSummary total={0} promedio={0} distribucion={DIST_VACIA} />);

    expect(screen.getByText("Sin reseñas")).toBeTruthy();
    expect(screen.queryByText("0.0")).toBeNull();
  });
});

describe("ProductReviewsSection", () => {
  const estado = (over: Record<string, unknown> = {}) => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...over,
  });

  it("mientras carga muestra un indicador de carga", async () => {
    useReviews.mockReturnValue(estado({ isLoading: true }));
    await render(<ProductReviewsSection productId={7} />);

    expect(screen.getByText("Cargando reseñas…")).toBeTruthy();
    expect(useReviews).toHaveBeenCalledWith(7);
  });

  it("un error 503 muestra el mensaje del servidor y 'Reintentar' vuelve a pedir", async () => {
    const refetch = jest.fn();
    useReviews.mockReturnValue(
      estado({
        isError: true,
        error: makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." }),
        refetch,
      }),
    );
    await render(<ProductReviewsSection productId={7} />);

    expect(screen.getByText("No pudimos cargar las reseñas")).toBeTruthy();
    expect(screen.getByText("Error de conexión. Intenta de nuevo más tarde.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Reintentar reseñas"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("con total 0 muestra el estado vacío y no hay botón 'Ver más'", async () => {
    useReviews.mockReturnValue(
      estado({ data: { reviews: [], total: 0, promedio: 0, distribucion: DIST_VACIA } }),
    );
    await render(<ProductReviewsSection productId={7} />);

    expect(screen.getByText("Aún no hay reseñas de este producto.")).toBeTruthy();
    expect(screen.queryByLabelText("Ver más reseñas")).toBeNull();
  });

  it("muestra el resumen y las reseñas cargadas", async () => {
    useReviews.mockReturnValue(
      estado({
        data: {
          reviews: [makeReview({ id_resena: 1, titulo: "Excelente" }), makeReview({ id_resena: 2, titulo: "Cumple" })],
          total: 2,
          promedio: 5,
          distribucion: { ...DIST_VACIA, "5": 2 },
        },
      }),
    );
    await render(<ProductReviewsSection productId={7} />);

    expect(screen.getByText("Reseñas")).toBeTruthy();
    expect(screen.getByText("2 reseñas")).toBeTruthy();
    expect(screen.getByText("Excelente")).toBeTruthy();
    expect(screen.getByText("Cumple")).toBeTruthy();
    expect(screen.queryByLabelText("Ver más reseñas")).toBeNull();
  });

  it("'Ver más' aparece si hay más páginas y pide la siguiente", async () => {
    const fetchNextPage = jest.fn();
    useReviews.mockReturnValue(
      estado({
        data: { reviews: [makeReview()], total: 9, promedio: 5, distribucion: { ...DIST_VACIA, "5": 9 } },
        hasNextPage: true,
        fetchNextPage,
      }),
    );
    await render(<ProductReviewsSection productId={7} />);

    await fireEvent.press(screen.getByLabelText("Ver más reseñas"));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("mientras carga la siguiente página el botón está deshabilitado y dice 'Cargando…'", async () => {
    const fetchNextPage = jest.fn();
    useReviews.mockReturnValue(
      estado({
        data: { reviews: [makeReview()], total: 9, promedio: 5, distribucion: DIST_VACIA },
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage,
      }),
    );
    await render(<ProductReviewsSection productId={7} />);

    expect(screen.getByText("Cargando…")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Ver más reseñas"));
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("muestra la acción de escribir reseña con el producto, en la lista y en el estado vacío", async () => {
    useReviews.mockReturnValue(
      estado({ data: { reviews: [makeReview()], total: 1, promedio: 5, distribucion: { ...DIST_VACIA, "5": 1 } } }),
    );
    await render(<ProductReviewsSection productId={7} productName="Lenovo ThinkPad X1 Carbon" />);
    expect(screen.getByText("accion-escribir:7:Lenovo ThinkPad X1 Carbon")).toBeTruthy();

    useReviews.mockReturnValue(
      estado({ data: { reviews: [], total: 0, promedio: 0, distribucion: DIST_VACIA } }),
    );
    await render(<ProductReviewsSection productId={7} />);
    expect(screen.getByText("accion-escribir:7:")).toBeTruthy();
  });

  it("no muestra la acción de escribir reseña mientras carga ni cuando falla la carga", async () => {
    useReviews.mockReturnValue(estado({ isLoading: true }));
    await render(<ProductReviewsSection productId={7} />);
    expect(screen.queryByText(/accion-escribir/)).toBeNull();

    useReviews.mockReturnValue(estado({ isError: true, error: makeApiError({ status: 503, message: "Error" }) }));
    await render(<ProductReviewsSection productId={7} />);
    expect(screen.queryByText(/accion-escribir/)).toBeNull();
  });

  it("si falla una página siguiente conserva la lista y avisa con opción de reintentar", async () => {
    useReviews.mockReturnValue(
      estado({
        data: { reviews: [makeReview({ titulo: "Sigue visible" })], total: 9, promedio: 5, distribucion: DIST_VACIA },
        hasNextPage: true,
        isFetchNextPageError: true,
      }),
    );
    await render(<ProductReviewsSection productId={7} />);

    expect(screen.getByText("Sigue visible")).toBeTruthy();
    expect(screen.getByText("No pudimos cargar más reseñas.")).toBeTruthy();
    expect(screen.getByLabelText("Ver más reseñas")).toBeTruthy();
  });
});
