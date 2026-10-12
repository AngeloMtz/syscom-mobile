import { fireEvent, render, screen } from "@testing-library/react-native";

import CartSummary from "@/features/cart/components/CartSummary";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

type Props = React.ComponentProps<typeof CartSummary>;

const base = (over: Partial<Props> = {}): Props => ({
  total: 1500,
  units: 3,
  canCheckout: true,
  blockingCount: 0,
  addressState: "ready",
  addressLine: "Av. Juárez 123, Centro",
  onChangeAddress: jest.fn(),
  ...over,
});

describe("CartSummary: total", () => {
  it("muestra el total y las unidades en plural", async () => {
    await render(<CartSummary {...base()} />);

    expect(screen.getByText("Total (3 artículos)")).toBeTruthy();
    expect(screen.getByText("$1,500.00")).toBeTruthy();
  });

  it("usa el singular con una unidad", async () => {
    await render(<CartSummary {...base({ units: 1 })} />);

    expect(screen.getByText("Total (1 artículo)")).toBeTruthy();
  });
});

describe("CartSummary: dirección de envío", () => {
  it("con dirección: la muestra y ofrece 'Cambiar'", async () => {
    const onChangeAddress = jest.fn();
    await render(<CartSummary {...base({ onChangeAddress })} />);

    expect(screen.getByText("Av. Juárez 123, Centro")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Cambiar dirección de envío"));

    expect(onChangeAddress).toHaveBeenCalledTimes(1);
  });

  it("sin dirección: invita a agregar una", async () => {
    const onChangeAddress = jest.fn();
    await render(<CartSummary {...base({ addressLine: null, onChangeAddress })} />);

    expect(screen.getByText("Agrega una dirección de envío")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Agregar dirección de envío"));

    expect(onChangeAddress).toHaveBeenCalledTimes(1);
  });

  it("mientras carga: lo dice y no ofrece ninguna acción", async () => {
    await render(<CartSummary {...base({ addressState: "loading", addressLine: null })} />);

    expect(screen.getByText("Cargando dirección…")).toBeTruthy();
    expect(screen.queryByLabelText("Cambiar dirección de envío")).toBeNull();
    expect(screen.queryByLabelText("Agregar dirección de envío")).toBeNull();
  });

  it("si falla la carga: ofrece reintentar", async () => {
    const onChangeAddress = jest.fn();
    await render(
      <CartSummary {...base({ addressState: "error", addressLine: null, onChangeAddress })} />,
    );

    expect(screen.getByText("No pudimos cargar tus direcciones")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Reintentar cargar las direcciones"));

    expect(onChangeAddress).toHaveBeenCalledTimes(1);
  });
});

describe("CartSummary: aviso y botón de pago", () => {
  it("sin flujo de pago el botón está deshabilitado y lo explica", async () => {
    await render(<CartSummary {...base()} />);

    expect(screen.getByText("El pago estará disponible próximamente.")).toBeTruthy();
    expect(screen.getByLabelText("Continuar con el pago").props.accessibilityState.disabled).toBe(true);
  });

  it("con flujo de pago y carrito listo: el botón funciona y no hay aviso", async () => {
    const onCheckout = jest.fn();
    await render(<CartSummary {...base({ onCheckout })} />);

    expect(screen.queryByText("El pago estará disponible próximamente.")).toBeNull();
    const boton = screen.getByLabelText("Continuar con el pago");
    expect(boton.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(boton);

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("con líneas bloqueantes: avisa cuántas y no deja pagar", async () => {
    const onCheckout = jest.fn();
    await render(<CartSummary {...base({ onCheckout, canCheckout: false, blockingCount: 2 })} />);

    expect(screen.getByText("Quita o ajusta 2 productos para continuar.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Continuar con el pago"));

    expect(onCheckout).not.toHaveBeenCalled();
  });

  it("con una sola línea bloqueante usa el singular", async () => {
    await render(<CartSummary {...base({ canCheckout: false, blockingCount: 1, onCheckout: jest.fn() })} />);

    expect(screen.getByText("Quita o ajusta 1 producto para continuar.")).toBeTruthy();
  });

  it("sin dirección pide agregarla y bloquea el pago", async () => {
    await render(
      <CartSummary {...base({ addressLine: null, canCheckout: false, onCheckout: jest.fn() })} />,
    );

    expect(screen.getByText("Agrega una dirección de envío para continuar.")).toBeTruthy();
    expect(screen.getByLabelText("Continuar con el pago").props.accessibilityState.disabled).toBe(true);
  });

  it("las líneas bloqueantes tienen prioridad sobre la dirección en el aviso", async () => {
    await render(
      <CartSummary
        {...base({ addressLine: null, canCheckout: false, blockingCount: 1, onCheckout: jest.fn() })}
      />,
    );

    expect(screen.getByText("Quita o ajusta 1 producto para continuar.")).toBeTruthy();
    expect(screen.queryByText("Agrega una dirección de envío para continuar.")).toBeNull();
  });
});
