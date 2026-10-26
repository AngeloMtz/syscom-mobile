import { act, fireEvent, render, screen } from "@testing-library/react-native";

import RatingInput from "@/features/reviews/components/RatingInput";
import ReviewForm from "@/features/reviews/components/ReviewForm";
import WriteReview from "@/features/reviews/components/WriteReview";
import WriteReviewAction from "@/features/reviews/components/WriteReviewAction";
import { useCanReview } from "@/features/reviews/hooks/useCanReview";
import { useCreateReview } from "@/features/reviews/hooks/useCreateReview";
import { useAuthStore } from "@/shared/store/authStore";
import { router } from "expo-router";

import { makeApiError } from "../fixtures";
import { makeCanReview } from "../fixtures/review";

// Los íconos se simulan como texto con el nombre del ícono para poder contar estrellas llenas y vacías.
jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/features/reviews/hooks/useCanReview", () => ({ useCanReview: jest.fn() }));
jest.mock("@/features/reviews/hooks/useCreateReview", () => ({ useCreateReview: jest.fn() }));

const useCan = useCanReview as jest.Mock;
const useCreate = useCreateReview as jest.Mock;
const push = router.push as jest.Mock;

const COMENTARIO = "Muy buena laptop, llegó bien empacada.";

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

const estrellas = (n: number) => screen.getByLabelText(`Calificar con ${n} ${n === 1 ? "estrella" : "estrellas"}`);

describe("RatingInput", () => {
  it("muestra cinco estrellas con su etiqueta accesible", async () => {
    await render(<RatingInput value={0} onChange={jest.fn()} />);

    expect(screen.getByLabelText("Calificación")).toBeTruthy();
    expect(estrellas(1)).toBeTruthy();
    expect(estrellas(5)).toBeTruthy();
  });

  it("llena tantas estrellas como el valor", async () => {
    await render(<RatingInput value={3} onChange={jest.fn()} />);

    expect(screen.getAllByText("star")).toHaveLength(3);
    expect(screen.getAllByText("star-outline")).toHaveLength(2);
  });

  it("tocar una estrella avisa con su número", async () => {
    const onChange = jest.fn();
    await render(<RatingInput value={0} onChange={onChange} />);

    await fireEvent.press(estrellas(4));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("marca como elegida solo la estrella del valor actual", async () => {
    await render(<RatingInput value={2} onChange={jest.fn()} />);

    expect(estrellas(2).props.accessibilityState).toMatchObject({ checked: true });
    expect(estrellas(3).props.accessibilityState).toMatchObject({ checked: false });
  });

  it("deshabilitado no responde a los toques", async () => {
    const onChange = jest.fn();
    await render(<RatingInput value={0} onChange={onChange} disabled />);

    await fireEvent.press(estrellas(5));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("muestra el error cuando lo recibe", async () => {
    await render(<RatingInput value={0} onChange={jest.fn()} error="Selecciona una calificación de 1 a 5 estrellas" />);

    expect(screen.getByText("Selecciona una calificación de 1 a 5 estrellas")).toBeTruthy();
  });
});

describe("ReviewForm", () => {
  const llenar = async (comentario = COMENTARIO) => {
    await fireEvent.press(estrellas(4));
    await fireEvent.changeText(screen.getByLabelText("Comentario"), comentario);
  };

  it("con todo vacío muestra los errores y no envía", async () => {
    const onSubmit = jest.fn();
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(screen.getByText("Selecciona una calificación de 1 a 5 estrellas")).toBeTruthy();
    expect(screen.getByText("El comentario debe tener al menos 10 caracteres")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("un comentario de 9 caracteres no se envía", async () => {
    const onSubmit = jest.fn();
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);
    await llenar("123456789");

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(screen.getByText("El comentario debe tener al menos 10 caracteres")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("un título de más de 150 caracteres no se envía", async () => {
    const onSubmit = jest.fn();
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);
    await llenar();
    await fireEvent.changeText(screen.getByLabelText("Título"), "t".repeat(151));

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(screen.getByText("El título no puede exceder 150 caracteres")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("con datos válidos entrega calificación, título y comentario", async () => {
    const onSubmit = jest.fn();
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);
    await llenar();
    await fireEvent.changeText(screen.getByLabelText("Título"), "Buena compra");

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(onSubmit).toHaveBeenCalledWith({ calificacion: 4, titulo: "Buena compra", comentario: COMENTARIO });
  });

  it("el título es opcional", async () => {
    const onSubmit = jest.fn();
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);
    await llenar();

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(onSubmit).toHaveBeenCalledWith({ calificacion: 4, titulo: "", comentario: COMENTARIO });
  });

  it("al corregir un campo con error, ese error desaparece", async () => {
    await render(<ReviewForm submitting={false} onSubmit={jest.fn()} />);
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
    expect(screen.getByText("El comentario debe tener al menos 10 caracteres")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Comentario"), COMENTARIO);
    await fireEvent.press(estrellas(5));

    expect(screen.queryByText("El comentario debe tener al menos 10 caracteres")).toBeNull();
    expect(screen.queryByText("Selecciona una calificación de 1 a 5 estrellas")).toBeNull();
  });

  it("mientras envía, el botón queda deshabilitado y no envía de nuevo", async () => {
    const onSubmit = jest.fn();
    await render(<ReviewForm submitting onSubmit={onSubmit} />);
    await llenar();

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(screen.getByLabelText("Enviar reseña").props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("evita el doble toque: mientras la primera entrega sigue en curso, la segunda se ignora", async () => {
    let terminar: () => void = () => undefined;
    const onSubmit = jest.fn(() => new Promise<void>((resolve) => (terminar = resolve)));
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);
    await llenar();

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      terminar();
    });
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("si la entrega falla, el formulario conserva lo escrito y permite reintentar", async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error("falló")).mockResolvedValueOnce(undefined);
    await render(<ReviewForm submitting={false} onSubmit={onSubmit} />);
    await llenar();

    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText("Comentario").props.value).toBe(COMENTARIO);
  });

  it("muestra el mensaje de error del servidor", async () => {
    await render(
      <ReviewForm submitting={false} onSubmit={jest.fn()} serverError="Ya dejaste una reseña para este producto." />,
    );

    expect(screen.getByText("Ya dejaste una reseña para este producto.")).toBeTruthy();
  });
});

describe("WriteReview", () => {
  const estadoCan = (over: Record<string, unknown> = {}) => ({
    data: makeCanReview(),
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...over,
  });
  const estadoCreate = (over: Record<string, unknown> = {}) => ({
    mutateAsync: jest.fn().mockResolvedValue({ idResena: 1 }),
    isPending: false,
    ...over,
  });

  const rellenarYEnviar = async () => {
    await fireEvent.press(estrellas(5));
    await fireEvent.changeText(screen.getByLabelText("Comentario"), COMENTARIO);
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
  };

  it("mientras verifica la compra muestra un indicador de carga", async () => {
    useCan.mockReturnValue(estadoCan({ isLoading: true, data: undefined }));
    useCreate.mockReturnValue(estadoCreate());
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    expect(screen.getByText("Verificando tu compra…")).toBeTruthy();
    expect(useCan).toHaveBeenCalledWith(7);
  });

  it("si no se pudo verificar, muestra el error del servidor y 'Reintentar' vuelve a pedir", async () => {
    const refetch = jest.fn();
    useCan.mockReturnValue(
      estadoCan({
        data: undefined,
        isError: true,
        error: makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." }),
        refetch,
      }),
    );
    useCreate.mockReturnValue(estadoCreate());
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    expect(screen.getByText("No pudimos verificar si puedes reseñar este producto")).toBeTruthy();
    expect(screen.getByText("Error de conexión. Intenta de nuevo más tarde.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Reintentar"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("si no puede reseñar, muestra el motivo del servidor y no el formulario", async () => {
    useCan.mockReturnValue(
      estadoCan({ data: makeCanReview({ canReview: false, idPedido: null, reason: "Ya dejaste una reseña para este producto." }) }),
    );
    useCreate.mockReturnValue(estadoCreate());
    const onClose = jest.fn();
    await render(<WriteReview productId={7} onClose={onClose} />);

    expect(screen.getByText("No puedes reseñar este producto")).toBeTruthy();
    expect(screen.getByText("Ya dejaste una reseña para este producto.")).toBeTruthy();
    expect(screen.queryByLabelText("Enviar reseña")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Volver"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("si no puede reseñar y no hay motivo, usa un texto genérico", async () => {
    useCan.mockReturnValue(estadoCan({ data: makeCanReview({ canReview: false, idPedido: null, reason: null }) }));
    useCreate.mockReturnValue(estadoCreate());
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    expect(screen.getByText("No puedes reseñar este producto por ahora.")).toBeTruthy();
  });

  it("si puede reseñar, muestra el formulario con el nombre del producto", async () => {
    useCan.mockReturnValue(estadoCan());
    useCreate.mockReturnValue(estadoCreate());
    await render(<WriteReview productId={7} productName="Lenovo ThinkPad X1 Carbon" onClose={jest.fn()} />);

    expect(screen.getByText("Tu opinión sobre Lenovo ThinkPad X1 Carbon")).toBeTruthy();
    expect(screen.getByLabelText("Enviar reseña")).toBeTruthy();
  });

  it("envía la reseña con el pedido que devolvió can-review y avisa que se publica tras la aprobación", async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ idResena: 1 });
    useCan.mockReturnValue(estadoCan({ data: makeCanReview({ idPedido: 12 }) }));
    useCreate.mockReturnValue(estadoCreate({ mutateAsync }));
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    await rellenarYEnviar();

    expect(mutateAsync).toHaveBeenCalledWith({
      idProducto: 7,
      idPedido: 12,
      calificacion: 5,
      comentario: COMENTARIO,
    });
    expect(await screen.findByText("¡Gracias por tu reseña!")).toBeTruthy();
    expect(screen.getByText("Se publicará cuando un administrador la apruebe.")).toBeTruthy();
    expect(screen.queryByLabelText("Enviar reseña")).toBeNull();
  });

  it("'Volver al producto' cierra la pantalla", async () => {
    const onClose = jest.fn();
    useCan.mockReturnValue(estadoCan());
    useCreate.mockReturnValue(estadoCreate());
    await render(<WriteReview productId={7} onClose={onClose} />);
    await rellenarYEnviar();

    await fireEvent.press(await screen.findByLabelText("Volver al producto"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["no comprado", "No puedes reseñar este producto. Necesitas haberlo comprado y recibido."],
    ["duplicada", "Ya dejaste una reseña para este producto."],
  ])("un error 400 del servidor (%s) se muestra con su mensaje y el formulario sigue disponible", async (_caso, message) => {
    const mutateAsync = jest.fn().mockRejectedValue(makeApiError({ status: 400, message }));
    useCan.mockReturnValue(estadoCan());
    useCreate.mockReturnValue(estadoCreate({ mutateAsync }));
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    await rellenarYEnviar();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText("¡Gracias por tu reseña!")).toBeNull();
    expect(screen.getByLabelText("Comentario").props.value).toBe(COMENTARIO);
  });

  it("un error de red se muestra con el texto de conexión", async () => {
    const mutateAsync = jest.fn().mockRejectedValue({ message: "Network Error" });
    useCan.mockReturnValue(estadoCan());
    useCreate.mockReturnValue(estadoCreate({ mutateAsync }));
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    await rellenarYEnviar();

    expect(await screen.findByText(/Sin conexión con el servidor/)).toBeTruthy();
  });

  it("mientras se crea la reseña, el botón queda deshabilitado", async () => {
    useCan.mockReturnValue(estadoCan());
    useCreate.mockReturnValue(estadoCreate({ isPending: true }));
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    expect(screen.getByLabelText("Enviar reseña").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("limpia el error del servidor al volver a enviar", async () => {
    const mutateAsync = jest
      .fn()
      .mockRejectedValueOnce(makeApiError({ status: 400, message: "Ya dejaste una reseña para este producto." }))
      .mockResolvedValueOnce({ idResena: 2 });
    useCan.mockReturnValue(estadoCan());
    useCreate.mockReturnValue(estadoCreate({ mutateAsync }));
    await render(<WriteReview productId={7} onClose={jest.fn()} />);

    await rellenarYEnviar();
    expect(await screen.findByText("Ya dejaste una reseña para este producto.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));

    expect(await screen.findByText("¡Gracias por tu reseña!")).toBeTruthy();
    expect(screen.queryByText("Ya dejaste una reseña para este producto.")).toBeNull();
  });
});

describe("WriteReviewAction", () => {
  it("sin sesión muestra 'Escribir reseña' y lleva a login (sin preguntar nada al servidor)", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    useCan.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    await render(<WriteReviewAction productId={7} />);

    await fireEvent.press(screen.getByLabelText("Escribir reseña"));

    expect(push).toHaveBeenCalledWith("/(auth)/login");
  });

  it("con sesión y permiso, el botón abre el formulario con el producto", async () => {
    useCan.mockReturnValue({ data: makeCanReview(), isLoading: false, isError: false });
    await render(<WriteReviewAction productId={7} productName="Lenovo ThinkPad X1 Carbon" />);

    await fireEvent.press(screen.getByLabelText("Escribir reseña"));

    expect(push).toHaveBeenCalledWith({
      pathname: "/reviews/new",
      params: { productId: "7", productName: "Lenovo ThinkPad X1 Carbon" },
    });
  });

  it("sin nombre de producto no manda ese parámetro", async () => {
    useCan.mockReturnValue({ data: makeCanReview(), isLoading: false, isError: false });
    await render(<WriteReviewAction productId={7} />);

    await fireEvent.press(screen.getByLabelText("Escribir reseña"));

    expect(push).toHaveBeenCalledWith({ pathname: "/reviews/new", params: { productId: "7" } });
  });

  it("con sesión y sin permiso muestra el motivo del servidor y ningún botón", async () => {
    useCan.mockReturnValue({
      data: makeCanReview({ canReview: false, idPedido: null, reason: "Necesitas haber comprado y recibido este producto para reseñarlo." }),
      isLoading: false,
      isError: false,
    });
    await render(<WriteReviewAction productId={7} />);

    expect(screen.getByText("Necesitas haber comprado y recibido este producto para reseñarlo.")).toBeTruthy();
    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
  });

  it("con sesión, sin permiso y sin motivo no muestra nada", async () => {
    useCan.mockReturnValue({
      data: makeCanReview({ canReview: false, idPedido: null, reason: null }),
      isLoading: false,
      isError: false,
    });
    await render(<WriteReviewAction productId={7} />);

    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("mientras consulta o si la consulta falla no muestra ni botón ni texto", async () => {
    useCan.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    await render(<WriteReviewAction productId={7} />);
    expect(screen.toJSON()).toBeNull();

    useCan.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    await render(<WriteReviewAction productId={7} />);
    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
  });
});
