import { fireEvent, render, screen } from "@testing-library/react-native";

import MyReviewCard from "@/features/reviews/components/MyReviewCard";
import MyReviewsList from "@/features/reviews/components/MyReviewsList";
import ReviewStatusBadge from "@/features/reviews/components/ReviewStatusBadge";
import { useMyReviews } from "@/features/reviews/hooks/useMyReviews";

import { makeApiError } from "../fixtures";
import { makeMyReview } from "../fixtures/review";

// Los íconos se simulan como texto con el nombre del ícono para poder contar estrellas.
jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("@/features/reviews/hooks/useMyReviews", () => ({ useMyReviews: jest.fn() }));

const useMine = useMyReviews as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("ReviewStatusBadge", () => {
  it.each([
    ["pendiente", "Pendiente"],
    ["aprobada", "Aprobada"],
    ["rechazada", "Rechazada"],
  ])("%s se muestra como %s", async (estado, etiqueta) => {
    await render(<ReviewStatusBadge estado={estado} />);

    expect(screen.getByText(etiqueta)).toBeTruthy();
    expect(screen.getByLabelText(`Estado: ${etiqueta}`)).toBeTruthy();
  });

  it("un estado desconocido o ausente no rompe", async () => {
    await render(<ReviewStatusBadge estado="en_revision" />);
    expect(screen.getByText("Estado no disponible")).toBeTruthy();

    await render(<ReviewStatusBadge estado={null} />);
    expect(screen.getAllByText("Estado no disponible").length).toBeGreaterThan(0);
  });
});

describe("MyReviewCard", () => {
  it("muestra producto, calificación, estado, fecha, título y comentario", async () => {
    await render(<MyReviewCard review={makeMyReview({ estado: "pendiente", calificacion: 4 })} />);

    expect(screen.getByText("Lenovo ThinkPad X1 Carbon")).toBeTruthy();
    expect(screen.getByLabelText("4 de 5 estrellas")).toBeTruthy();
    expect(screen.getByText("Pendiente")).toBeTruthy();
    expect(screen.getByText("24 oct 2026")).toBeTruthy();
    expect(screen.getByText("Buen producto")).toBeTruthy();
    expect(screen.getByText("Llegó rápido y funciona perfecto.")).toBeTruthy();
  });

  it("sin título no muestra 'null' ni deja hueco", async () => {
    await render(<MyReviewCard review={makeMyReview({ titulo: null })} />);

    expect(screen.queryByText("null")).toBeNull();
    expect(screen.getByText("Llegó rápido y funciona perfecto.")).toBeTruthy();
  });

  it("con `productos` nulo usa un nombre genérico", async () => {
    await render(<MyReviewCard review={makeMyReview({ productos: null })} />);

    expect(screen.getByText("Producto no disponible")).toBeTruthy();
  });

  it("con `created_at` nulo no muestra fecha", async () => {
    await render(<MyReviewCard review={makeMyReview({ created_at: null })} />);

    expect(screen.queryByText("Fecha no disponible")).toBeNull();
    expect(screen.getByText("Lenovo ThinkPad X1 Carbon")).toBeTruthy();
  });

  it("una reseña aprobada y una rechazada muestran su estado", async () => {
    await render(<MyReviewCard review={makeMyReview({ estado: "aprobada" })} />);
    expect(screen.getByText("Aprobada")).toBeTruthy();

    await render(<MyReviewCard review={makeMyReview({ estado: "rechazada" })} />);
    expect(screen.getByText("Rechazada")).toBeTruthy();
  });
});

describe("MyReviewsList", () => {
  const estado = (over: Record<string, unknown> = {}) => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isRefetching: false,
    refetch: jest.fn(),
    ...over,
  });

  it("mientras carga muestra un indicador de carga", async () => {
    useMine.mockReturnValue(estado({ isLoading: true }));
    await render(<MyReviewsList />);

    expect(screen.getByText("Cargando tus reseñas…")).toBeTruthy();
  });

  it("un error 503 muestra el mensaje del servidor y 'Reintentar' vuelve a pedir", async () => {
    const refetch = jest.fn();
    useMine.mockReturnValue(
      estado({
        isError: true,
        error: makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." }),
        refetch,
      }),
    );
    await render(<MyReviewsList />);

    expect(screen.getByText("No pudimos cargar tus reseñas")).toBeTruthy();
    expect(screen.getByText("Error de conexión. Intenta de nuevo más tarde.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Reintentar"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("sin reseñas muestra el estado vacío", async () => {
    useMine.mockReturnValue(estado({ data: { reviews: [], total: 0 } }));
    await render(<MyReviewsList />);

    expect(screen.getByText("Aún no has escrito reseñas")).toBeTruthy();
    expect(screen.getByText("Cuando recibas un pedido, podrás reseñar sus productos desde su detalle.")).toBeTruthy();
  });

  it("muestra el total (singular y plural) y una tarjeta por reseña", async () => {
    useMine.mockReturnValue(
      estado({
        data: {
          reviews: [
            makeMyReview({ id_resena: 1, titulo: "Primera" }),
            makeMyReview({ id_resena: 2, titulo: "Segunda", estado: "aprobada" }),
          ],
          total: 2,
        },
      }),
    );
    await render(<MyReviewsList />);

    expect(screen.getByText("2 reseñas")).toBeTruthy();
    expect(screen.getByText("Primera")).toBeTruthy();
    expect(screen.getByText("Segunda")).toBeTruthy();

    useMine.mockReturnValue(estado({ data: { reviews: [makeMyReview({ id_resena: 3 })], total: 1 } }));
    await render(<MyReviewsList />);
    expect(screen.getByText("1 reseña")).toBeTruthy();
  });

  it("si falla una recarga pero ya hay datos, conserva la lista", async () => {
    useMine.mockReturnValue(
      estado({
        data: { reviews: [makeMyReview({ titulo: "Sigue visible" })], total: 1 },
        isError: true,
        error: makeApiError({ status: 503, message: "Error" }),
      }),
    );
    await render(<MyReviewsList />);

    expect(screen.getByText("Sigue visible")).toBeTruthy();
    expect(screen.queryByText("No pudimos cargar tus reseñas")).toBeNull();
  });
});
