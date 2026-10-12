import { fireEvent, render, screen } from "@testing-library/react-native";

import { toCartLineData } from "@/features/cart/cartSelectors";
import CartItemRow from "@/features/cart/components/CartItemRow";

import { makeCartItemFor } from "../fixtures";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const NOMBRE = "Laptop de prueba";

const handlers = () => ({
  onIncrease: jest.fn(),
  onDecrease: jest.fn(),
  onRemove: jest.fn(),
});

const line = (over: Parameters<typeof makeCartItemFor>[1] = {}) =>
  toCartLineData(makeCartItemFor(1, { cantidad: 2, precio_unitario: "250.00", ...over }));

describe("CartItemRow: datos", () => {
  it("muestra nombre, marca, precio unitario, cantidad y subtotal del servidor", async () => {
    await render(<CartItemRow line={line()} {...handlers()} />);

    expect(screen.getByText(NOMBRE)).toBeTruthy();
    expect(screen.getByText("HP")).toBeTruthy();
    expect(screen.getByText("$250.00 c/u")).toBeTruthy();
    expect(screen.getByLabelText(`Cantidad: 2`)).toBeTruthy();
    expect(screen.getByLabelText("Subtotal $500.00")).toBeTruthy();
  });

  it("con precio inválido no inventa importes", async () => {
    await render(<CartItemRow line={line({ precio_unitario: "n/d" })} {...handlers()} />);

    expect(screen.getByText("Precio no disponible c/u")).toBeTruthy();
    expect(screen.getByLabelText("Subtotal —")).toBeTruthy();
  });

  it("tocar el producto lo abre", async () => {
    const onOpen = jest.fn();
    await render(<CartItemRow line={line()} {...handlers()} onOpen={onOpen} />);

    await fireEvent.press(screen.getByLabelText(`${NOMBRE}, ver producto`));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("CartItemRow: cantidad", () => {
  it("'+' sube, '−' baja y la papelera quita", async () => {
    const h = handlers();
    await render(<CartItemRow line={line()} {...h} />);

    await fireEvent.press(screen.getByLabelText(`Aumentar cantidad de ${NOMBRE}`));
    await fireEvent.press(screen.getByLabelText(`Disminuir cantidad de ${NOMBRE}`));
    await fireEvent.press(screen.getByLabelText(`Quitar ${NOMBRE} del carrito`));

    expect(h.onIncrease).toHaveBeenCalledTimes(1);
    expect(h.onDecrease).toHaveBeenCalledTimes(1);
    expect(h.onRemove).toHaveBeenCalledTimes(1);
  });

  it("con cantidad 1 el '−' está deshabilitado (para quitar se usa la papelera)", async () => {
    const h = handlers();
    await render(<CartItemRow line={line({ cantidad: 1 })} {...h} />);

    const menos = screen.getByLabelText(`Disminuir cantidad de ${NOMBRE}`);
    expect(menos.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(menos);

    expect(h.onDecrease).not.toHaveBeenCalled();
  });

  it("en el máximo de stock el '+' se deshabilita y lo explica", async () => {
    const h = handlers();
    await render(<CartItemRow line={line({ cantidad: 3, producto: { variantes_producto: [{ stock: 3 }] } })} {...h} />);

    expect(screen.getByText("Máximo disponible: 3")).toBeTruthy();
    const mas = screen.getByLabelText(`Aumentar cantidad de ${NOMBRE}`);
    expect(mas.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(mas);

    expect(h.onIncrease).not.toHaveBeenCalled();
  });

  it("con el carrito bloqueado por un pago no se puede editar ni quitar", async () => {
    const h = handlers();
    await render(<CartItemRow line={line()} {...h} disabled />);

    for (const etiqueta of [
      `Aumentar cantidad de ${NOMBRE}`,
      `Disminuir cantidad de ${NOMBRE}`,
      `Quitar ${NOMBRE} del carrito`,
    ]) {
      const boton = screen.getByLabelText(etiqueta);
      expect(boton.props.accessibilityState?.disabled ?? boton.props.disabled).toBeTruthy();
      await fireEvent.press(boton);
    }

    expect(h.onIncrease).not.toHaveBeenCalled();
    expect(h.onDecrease).not.toHaveBeenCalled();
    expect(h.onRemove).not.toHaveBeenCalled();
  });
});

describe("CartItemRow: stock y disponibilidad", () => {
  it("agotado: muestra el aviso, sin selector de cantidad y con 'Quitar'", async () => {
    const h = handlers();
    await render(<CartItemRow line={line({ producto: { variantes_producto: [{ stock: 0 }] } })} {...h} />);

    expect(screen.getByText("Agotado")).toBeTruthy();
    expect(screen.queryByLabelText(`Aumentar cantidad de ${NOMBRE}`)).toBeNull();
    expect(screen.getByText("Quitar")).toBeTruthy();

    await fireEvent.press(screen.getByText("Quitar"));
    expect(h.onRemove).toHaveBeenCalledTimes(1);
  });

  it("producto no disponible: lo indica y deja quitarlo", async () => {
    await render(<CartItemRow line={line({ producto: { estado: "inactivo" } })} {...handlers()} />);

    expect(screen.getByText("No disponible")).toBeTruthy();
    expect(screen.queryByLabelText(`Aumentar cantidad de ${NOMBRE}`)).toBeNull();
    expect(screen.getByText("Quitar")).toBeTruthy();
  });

  it("cantidad por encima del stock: avisa cuántos hay y permite bajar", async () => {
    const h = handlers();
    await render(
      <CartItemRow line={line({ cantidad: 5, producto: { variantes_producto: [{ stock: 2 }] } })} {...h} />,
    );

    expect(screen.getByText("Solo hay 2 disponibles. Baja la cantidad para continuar.")).toBeTruthy();
    expect(screen.getByLabelText(`Aumentar cantidad de ${NOMBRE}`).props.accessibilityState.disabled).toBe(true);
    const menos = screen.getByLabelText(`Disminuir cantidad de ${NOMBRE}`);
    expect(menos.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(menos);

    expect(h.onDecrease).toHaveBeenCalledTimes(1);
  });

  it("singular cuando solo hay uno", async () => {
    await render(
      <CartItemRow line={line({ cantidad: 3, producto: { variantes_producto: [{ stock: 1 }] } })} {...handlers()} />,
    );

    expect(screen.getByText("Solo hay 1 disponible. Baja la cantidad para continuar.")).toBeTruthy();
  });
});
