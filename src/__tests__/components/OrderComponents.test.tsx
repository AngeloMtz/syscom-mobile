import { fireEvent, render, screen } from "@testing-library/react-native";

import OrderCard from "@/features/orders/components/OrderCard";
import OrderDetailView from "@/features/orders/components/OrderDetailView";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";

import {
  makeOrderAddress,
  makeOrderDetail,
  makeOrderItem,
  makeOrderPayment,
  makeOrderSummary,
} from "../fixtures";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("OrderStatusBadge", () => {
  it.each([
    ["pendiente_pago", "Pendiente de pago"],
    ["confirmado", "Confirmado"],
    ["en_preparacion", "En preparación"],
    ["en_camino", "En camino"],
    ["entregado", "Entregado"],
    ["cancelado", "Cancelado"],
  ])("%s se muestra como %s", async (estado, etiqueta) => {
    await render(<OrderStatusBadge estado={estado} />);

    expect(screen.getByText(etiqueta)).toBeTruthy();
    expect(screen.getByLabelText(`Estado: ${etiqueta}`)).toBeTruthy();
  });

  it("un estado desconocido o ausente no rompe", async () => {
    await render(<OrderStatusBadge estado="en_revision" />);
    expect(screen.getByText("En revision")).toBeTruthy();

    await render(<OrderStatusBadge estado={null} />);
    expect(screen.getByText("Estado no disponible")).toBeTruthy();
  });
});

describe("OrderCard", () => {
  it("muestra folio, fecha de México, estado, productos y total", async () => {
    await render(
      <OrderCard
        order={makeOrderSummary({ id_pedido: 8, fecha_pedido: "2026-10-12T15:00:00.000Z", total_items: 2 })}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("SYS-000008")).toBeTruthy();
    expect(screen.getByText("12 oct 2026")).toBeTruthy();
    expect(screen.getByText("Confirmado")).toBeTruthy();
    expect(screen.getByText("2 productos")).toBeTruthy();
    expect(screen.getByText("$500.00")).toBeTruthy();
    expect(screen.getByText("Mouse inalámbrico")).toBeTruthy();
  });

  it("no muestra 'Pedido #8': solo el folio", async () => {
    await render(<OrderCard order={makeOrderSummary({ id_pedido: 8 })} onPress={jest.fn()} />);

    expect(screen.queryByText(/Pedido #/)).toBeNull();
  });

  it("tocar el pedido entrega su id", async () => {
    const onPress = jest.fn();
    await render(<OrderCard order={makeOrderSummary({ id_pedido: 42 })} onPress={onPress} />);

    await fireEvent.press(screen.getByRole("button"));

    expect(onPress).toHaveBeenCalledWith(42);
  });

  it("describe el pedido completo a los lectores de pantalla", async () => {
    await render(
      <OrderCard
        order={makeOrderSummary({ id_pedido: 8, estado: "entregado", total_items: 1, total: "100.00" })}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByLabelText("Pedido SYS-000008, 11 oct 2026, Entregado, 1 producto, total $100.00"),
    ).toBeTruthy();
  });

  it("tolera fecha, total e imagen ausentes", async () => {
    await render(
      <OrderCard
        order={makeOrderSummary({ fecha_pedido: null, total: "n/d", imagen_preview: null, primer_producto: "" })}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Fecha no disponible")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });
});

describe("OrderDetailView", () => {
  it("muestra folio, estado, fecha, productos, total, dirección y pago", async () => {
    const pedido = makeOrderDetail({
      id_pedido: 8,
      total: "750.00",
      direccion: makeOrderAddress({ referencias: "Junto al parque" }),
      items: [
        makeOrderItem({ id_pedido_detalle: 1, cantidad: 2, precio_unitario: "250.00", subtotal: "500.00" }),
        makeOrderItem({
          id_pedido_detalle: 2,
          id_producto: 9,
          cantidad: 1,
          precio_unitario: "250.00",
          subtotal: "250.00",
          productos: { ...makeOrderItem().productos, id_producto: 9, nombre: "Teclado" },
        }),
      ],
    });
    await render(<OrderDetailView order={pedido} onOpenProduct={jest.fn()} />);

    expect(screen.getByText("SYS-000008")).toBeTruthy();
    expect(screen.getByText("Confirmado")).toBeTruthy();
    expect(screen.getByText("Mouse inalámbrico")).toBeTruthy();
    expect(screen.getByText("2 × $250.00")).toBeTruthy();
    expect(screen.getByText("Teclado")).toBeTruthy();
    expect(screen.getByLabelText("Total $750.00")).toBeTruthy();
    expect(screen.getByText("Av. Juárez 123")).toBeTruthy();
    expect(screen.getByText("Centro, Huejutla, Hidalgo")).toBeTruthy();
    expect(screen.getByText("C.P. 43000")).toBeTruthy();
    expect(screen.getByText("Referencias: Junto al parque")).toBeTruthy();
    expect(screen.getByText("Tarjeta (Stripe)")).toBeTruthy();
    expect(screen.getByText("Pagado")).toBeTruthy();
  });

  it("tocar un producto entrega el id del producto", async () => {
    const onOpenProduct = jest.fn();
    await render(
      <OrderDetailView
        order={makeOrderDetail({ items: [makeOrderItem({ id_producto: 7 })] })}
        onOpenProduct={onOpenProduct}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Mouse inalámbrico, 2 piezas, ver producto"));

    expect(onOpenProduct).toHaveBeenCalledWith(7);
  });

  it("sin productos, sin dirección y sin pago muestra textos neutros", async () => {
    await render(
      <OrderDetailView
        order={makeOrderDetail({ items: [], direccion: null, pago: null })}
        onOpenProduct={jest.fn()}
      />,
    );

    expect(screen.getByText("Sin productos.")).toBeTruthy();
    expect(screen.getByText("Dirección no disponible.")).toBeTruthy();
    expect(screen.getAllByText("No disponible")).toHaveLength(2);
  });

  it("un pago pendiente no se muestra como pagado", async () => {
    await render(
      <OrderDetailView
        order={makeOrderDetail({ pago: makeOrderPayment({ estado_pago: "pendiente" }) })}
        onOpenProduct={jest.fn()}
      />,
    );

    expect(screen.getByText("Pendiente")).toBeTruthy();
    expect(screen.queryByText("Pagado")).toBeNull();
  });

  it("un total inválido no inventa un importe", async () => {
    await render(
      <OrderDetailView order={makeOrderDetail({ total: "n/d", items: [] })} onOpenProduct={jest.fn()} />,
    );

    expect(screen.getByLabelText("Total —")).toBeTruthy();
  });
});
