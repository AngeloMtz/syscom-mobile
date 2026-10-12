// Integración de la compra: carrito → dirección → pago → pedido → historial.
// Piezas reales: Axios con interceptores, repositories, hooks, caché de TanStack
// Query y stores. Simulados: el adapter de Axios (servidor falso con estado) y
// el SDK de Stripe. No se llama al backend real ni a Stripe.
import { act, renderHook } from "@testing-library/react-native";

import { mapServerFieldErrors } from "@/features/addresses/addressErrors";
import { resolveSelectedAddress, canProceedToPayment } from "@/features/addresses/addressSelectors";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useCreateAddress } from "@/features/addresses/hooks/useCreateAddress";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useCart } from "@/features/cart/hooks/useCart";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { formatOrderFolio } from "@/features/orders/orderFormat";
import { usePayment } from "@/features/payments/hooks/usePayment";
import { usePaymentStore } from "@/features/payments/paymentStore";
import { useAuthStore } from "@/shared/store/authStore";
import { useStripe } from "@stripe/stripe-react-native";

import { crearAxiosFalso } from "../utils/axiosFake";
import { usarClientePorPrueba } from "../utils/integracion";
import { crearServidorTienda, type ServidorTienda } from "../utils/servidorTienda";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-linking", () => ({
  createURL: (path: string) => `syscommobile://${path}`,
}));
jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: jest.fn(),
  StripeProvider: ({ children }: { children: unknown }) => children,
}));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

const initPaymentSheet = jest.fn();
const presentPaymentSheet = jest.fn();
let servidor: ServidorTienda;
let ultimoPaymentIntent = "";

const DIRECCION = {
  calle: "Av. Juárez 123",
  colonia: "Centro",
  ciudad: "Huejutla",
  estado: "Hidalgo",
  codigo_postal: "43000",
};

beforeEach(() => {
  jest.useFakeTimers();
  adapter.mockReset();
  servidor = crearServidorTienda(adapter as never, [
    { id: 7, nombre: "Mouse inalámbrico", precio: 250, stock: 10 },
    { id: 9, nombre: "Teclado", precio: 300, stock: 1 },
  ]);
  initPaymentSheet.mockReset();
  presentPaymentSheet.mockReset();
  (useStripe as jest.Mock).mockReturnValue({ initPaymentSheet, presentPaymentSheet });
  // PaymentSheet toma el secreto del PaymentIntent que creó el backend.
  initPaymentSheet.mockImplementation(async ({ paymentIntentClientSecret }: { paymentIntentClientSecret: string }) => {
    ultimoPaymentIntent = paymentIntentClientSecret.replace(/_secret_abc$/, "");
    return {};
  });
  // Pago correcto por defecto: Stripe cobra y el webhook queda "armado".
  presentPaymentSheet.mockImplementation(async () => {
    servidor.confirmarPago(ultimoPaymentIntent);
    return {};
  });
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
  usePaymentStore.setState({ locked: false, pendingPaymentIntentId: null });
  useCheckoutStore.setState({ selectedAddressId: null });
});

afterEach(() => {
  jest.useRealTimers();
});

const montar = () =>
  renderHook(
    () => ({
      cart: useCart(),
      add: useAddToCart(),
      addresses: useAddresses(),
      createAddress: useCreateAddress(),
      payment: usePayment(),
      orders: useOrders(),
      selectedId: useCheckoutStore((s) => s.selectedAddressId),
    }),
    { wrapper },
  );

/** Deja correr el reloj falso dentro de act: resuelve promesas y avanza el polling. */
const avanzar = (ms = 20) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

type Hook = Awaited<ReturnType<typeof montar>>["result"];

async function agregarAlCarrito(result: Hook, productoId: number, veces = 1) {
  for (let i = 0; i < veces; i += 1) {
    await act(async () => {
      await result.current.add.mutateAsync(productoId);
    });
  }
  await avanzar();
}

async function guardarDireccion(result: Hook) {
  await act(async () => {
    await result.current.createAddress.mutateAsync(DIRECCION);
  });
  await avanzar();
}

async function pagar(result: Hook, idDireccion: number, ms = 60000) {
  let promesa!: Promise<void>;
  await act(async () => {
    promesa = result.current.payment.pay(idDireccion);
  });
  await avanzar(ms);
  await act(async () => {
    await promesa;
  });
}

describe("integración: compra de extremo a extremo", () => {
  it("carrito → dirección → pago → pedido → historial y detalle", async () => {
    let bloqueadoConLaHojaAbierta = false;
    presentPaymentSheet.mockImplementation(async () => {
      bloqueadoConLaHojaAbierta = usePaymentStore.getState().locked;
      servidor.confirmarPago(ultimoPaymentIntent);
      return {};
    });
    servidor.estado.retrasoWebhook = 2;
    const { result } = await montar();
    await avanzar();

    // Estado inicial: sin carrito, sin direcciones y sin pedidos.
    expect(result.current.cart.data?.items).toEqual([]);
    expect(result.current.addresses.data).toEqual([]);
    expect(result.current.orders.data?.orders).toEqual([]);
    expect(canProceedToPayment(result.current.cart.data, null)).toBe(false);

    // Dos veces el mismo producto: el total lo calcula el servidor.
    await agregarAlCarrito(result, 7, 2);
    expect(result.current.cart.data?.items).toHaveLength(1);
    expect(result.current.cart.data?.items[0].cantidad).toBe(2);
    expect(result.current.cart.data?.totalPrice).toBe("500.00");

    // Sin dirección todavía no se puede pagar; al guardarla queda elegida sola.
    await guardarDireccion(result);
    const direccion = resolveSelectedAddress(result.current.addresses.data, result.current.selectedId);
    expect(direccion).not.toBeNull();
    expect(result.current.selectedId).toBe(direccion?.id_direccion);
    expect(canProceedToPayment(result.current.cart.data, direccion)).toBe(true);

    // Pago: el pedido aparece tras 3 consultas, como un webhook que tarda un poco.
    await pagar(result, direccion?.id_direccion as number);

    expect(result.current.payment.state).toMatchObject({ phase: "paid", orderId: 8, paymentIntentId: "pi_1" });
    expect(bloqueadoConLaHojaAbierta).toBe(true);
    expect(initPaymentSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantDisplayName: "SYSCOM",
        allowsDelayedPaymentMethods: false,
        returnURL: "syscommobile://stripe-redirect",
      }),
    );
    expect(servidor.veces("POST /payments/checkout")).toBe(1);
    expect(servidor.veces("GET /payments/order-status/pi_1")).toBe(3);
    expect(usePaymentStore.getState().locked).toBe(false);

    // El webhook vació el carrito y descontó stock; la app lo refleja sin recargar.
    await avanzar();
    expect(result.current.cart.data?.items).toEqual([]);
    expect(servidor.producto(7)?.stock).toBe(8);

    // El historial muestra el pedido nuevo arriba.
    expect(result.current.orders.data?.orders.map((o) => o.id_pedido)).toEqual([8]);
    expect(result.current.orders.data?.orders[0]).toMatchObject({ estado: "confirmado", total: "500.00" });

    // El detalle trae productos, dirección y método de pago.
    const detalle = await renderHook(() => useOrder("8"), { wrapper });
    await avanzar();
    expect(formatOrderFolio(detalle.result.current.data?.id_pedido as number)).toBe("SYS-000008");
    expect(detalle.result.current.data?.items).toHaveLength(1);
    expect(detalle.result.current.data?.direccion?.calle).toBe("Av. Juárez 123");
    expect(detalle.result.current.data?.pago).toMatchObject({ metodo_pago: "stripe", estado_pago: "completado" });
  });
});

describe("integración: el pago no se completa", () => {
  it("tarjeta rechazada: sin pedido, carrito intacto y el reintento crea otro PaymentIntent", async () => {
    presentPaymentSheet.mockReset();
    presentPaymentSheet
      .mockResolvedValueOnce({ error: { code: "Failed", message: "x", declineCode: "insufficient_funds" } })
      .mockImplementationOnce(async () => {
        servidor.confirmarPago(ultimoPaymentIntent);
        return {};
      });
    const { result } = await montar();
    await avanzar();
    await agregarAlCarrito(result, 7);
    await guardarDireccion(result);
    const id = resolveSelectedAddress(result.current.addresses.data, result.current.selectedId)?.id_direccion as number;

    await pagar(result, id);

    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: "Tu tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.",
    });
    expect(servidor.pedidos).toHaveLength(0);
    expect(servidor.veces("GET /payments/order-status/pi_1")).toBe(0);
    expect(result.current.cart.data?.items).toHaveLength(1);

    await pagar(result, id);

    expect(servidor.veces("POST /payments/checkout")).toBe(2);
    expect(result.current.payment.state).toMatchObject({ phase: "paid", paymentIntentId: "pi_2" });
  });

  it("cancelar la hoja: sin cobro, sin pedido y sin consultar el pedido", async () => {
    presentPaymentSheet.mockReset();
    presentPaymentSheet.mockResolvedValue({ error: { code: "Canceled", message: "canceled" } });
    const { result } = await montar();
    await avanzar();
    await agregarAlCarrito(result, 7);
    await guardarDireccion(result);
    const id = resolveSelectedAddress(result.current.addresses.data, result.current.selectedId)?.id_direccion as number;

    await pagar(result, id);

    expect(result.current.payment.state).toMatchObject({
      phase: "canceled",
      message: "Pago cancelado. No se te cobró.",
    });
    expect(servidor.pedidos).toHaveLength(0);
    expect(servidor.llamadas.filter((l) => l.startsWith("GET /payments/order-status"))).toHaveLength(0);
    expect(usePaymentStore.getState().locked).toBe(false);
  });

  it("webhook que tarda: queda pendiente con el carrito bloqueado y 'Verificar de nuevo' no crea otro pago", async () => {
    servidor.estado.retrasoWebhook = 1000;
    const { result } = await montar();
    await avanzar();
    await agregarAlCarrito(result, 7);
    await guardarDireccion(result);
    const id = resolveSelectedAddress(result.current.addresses.data, result.current.selectedId)?.id_direccion as number;

    await pagar(result, id);

    expect(result.current.payment.state).toMatchObject({
      phase: "pending",
      message: "Pago recibido, estamos confirmando tu pedido.",
    });
    expect(servidor.veces("GET /payments/order-status/pi_1")).toBe(20);
    expect(usePaymentStore.getState()).toMatchObject({ locked: true, pendingPaymentIntentId: "pi_1" });

    // El webhook por fin llega: la siguiente consulta ya encuentra el pedido.
    servidor.estado.retrasoWebhook = 0;
    let promesa!: Promise<void>;
    await act(async () => {
      promesa = result.current.payment.recheck();
    });
    await avanzar(10000);
    await act(async () => {
      await promesa;
    });

    expect(result.current.payment.state).toMatchObject({ phase: "paid", orderId: 8 });
    expect(servidor.veces("POST /payments/checkout")).toBe(1);
    expect(usePaymentStore.getState().locked).toBe(false);
  });

  it("stock insuficiente: el backend responde 400 y la app lo explica sin abrir la hoja", async () => {
    const { result } = await montar();
    await avanzar();
    await agregarAlCarrito(result, 9, 2); // el stock del Teclado es 1
    await guardarDireccion(result);
    const id = resolveSelectedAddress(result.current.addresses.data, result.current.selectedId)?.id_direccion as number;

    await pagar(result, id);

    expect(initPaymentSheet).not.toHaveBeenCalled();
    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: 'Solo quedan 1 de "Teclado". Ajusta tu carrito para continuar.',
    });
    expect(servidor.pedidos).toHaveLength(0);
  });

  it("carrito vacío: el backend lo rechaza con un mensaje claro", async () => {
    const { result } = await montar();
    await avanzar();
    await guardarDireccion(result);
    const id = resolveSelectedAddress(result.current.addresses.data, result.current.selectedId)?.id_direccion as number;

    await pagar(result, id);

    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: "Tu carrito está vacío. Agrega productos para continuar.",
    });
  });
});

describe("integración: errores del servidor en direcciones", () => {
  it("un 400 de validación llega por campo desde el repository real", async () => {
    servidor.fallarProxima("POST /profile/addresses", {
      status: 400,
      message: "La calle debe tener al menos 5 caracteres",
      errors: [
        { field: "calle", message: "La calle debe tener al menos 5 caracteres" },
        { field: "codigo_postal", message: "El código postal debe tener exactamente 5 dígitos" },
      ],
    });
    const { result } = await montar();
    await avanzar();

    let error: unknown;
    await act(async () => {
      try {
        await result.current.createAddress.mutateAsync({ ...DIRECCION, calle: "abc", codigo_postal: "1" });
      } catch (e) {
        error = e;
      }
    });
    await avanzar();

    const { fields, general } = mapServerFieldErrors(error);
    expect(fields).toEqual({
      calle: "La calle debe tener al menos 5 caracteres",
      codigo_postal: "El código postal debe tener exactamente 5 dígitos",
    });
    expect(general).toBeUndefined();
    expect(result.current.addresses.data).toEqual([]);
    expect(result.current.selectedId).toBeNull();
  });

  it("un 500 nunca expone el texto interno del servidor", async () => {
    servidor.fallarProxima("POST /profile/addresses", {
      status: 500,
      message: "Invalid `prisma.direcciones_envio.create()` invocation",
    });
    const { result } = await montar();
    await avanzar();

    let error: unknown;
    await act(async () => {
      try {
        await result.current.createAddress.mutateAsync(DIRECCION);
      } catch (e) {
        error = e;
      }
    });

    expect(mapServerFieldErrors(error).general).toBe(
      "No pudimos completar la operación. Intenta de nuevo más tarde.",
    );
  });
});
