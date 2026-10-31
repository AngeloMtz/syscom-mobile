// Integración de las ofertas y del descuento en el carrito (HU #11–#13): la sección Ofertas del Inicio,
// "Ver todas" (Promociones) y el precio con promoción en el carrito y en el pago, contra servidores
// falsos con estado (tienda, sesión y contenido público vacío).
// Piezas reales: HomeScreen, PromocionesScreen, CartScreen, RequireAuth, los hooks, los repositories,
// los selectores de precio, el cliente Axios con su interceptor Bearer (solo su adapter es falso),
// TanStack Query y los stores. Simulados: expo-router, expo-secure-store, el SDK de Stripe y los iconos.
// Sin red real, sin producción ni credenciales.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real: las formas
// de respuesta salen del código de la app, no de respuestas reales.
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";

import CartScreen from "@/app/(tabs)/cart";
import HomeScreen from "@/app/(tabs)/index";
import PromocionesScreen from "@/app/promociones";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { useCreateAddress } from "@/features/addresses/hooks/useCreateAddress";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { usePayment } from "@/features/payments/hooks/usePayment";
import { usePaymentStore } from "@/features/payments/paymentStore";
import { useAuthStore } from "@/shared/store/authStore";
import { useStripe } from "@stripe/stripe-react-native";

import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearAxiosFalso } from "../utils/axiosFake";
import { crearTiendaEnrutable, instalarEnrutador } from "../utils/enrutadorServidores";
import { usarClientePorPrueba } from "../utils/integracion";
import { crearServidorAuth, type ServidorAuth } from "../utils/servidorAuth";
import { contenidoPublicoVacio } from "../utils/servidorContenidoPublico";
import type { ProductoFalso, ServidorTienda } from "../utils/servidorTienda";

const mockPush = jest.fn();

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  const navegacion = { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn(), back: jest.fn() };
  return {
    useRouter: () => navegacion,
    router: navegacion,
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirige a ${href}`),
    Stack: { Screen: () => null },
  };
});
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-linking", () => ({ createURL: (path: string) => `syscommobile://${path}` }));
jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: jest.fn(),
  StripeProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { adapter } = crearAxiosFalso();
const { wrapper, cliente } = usarClientePorPrueba();

const CORREO = "ana@example.com";
const DIRECCION = {
  calle: "Av. Juárez 123",
  colonia: "Centro",
  ciudad: "Huejutla",
  estado: "Hidalgo",
  codigo_postal: "43000",
};

// Mouse: 250 → 225 (-10 %). Monitor: 1000 → 800 (-20 %). Teclado: sin promoción.
const MOUSE: ProductoFalso = { id: 7, nombre: "Mouse inalámbrico", precio: 250, stock: 10, precioPromocion: 225 };
const TECLADO: ProductoFalso = { id: 9, nombre: "Teclado mecánico", precio: 300, stock: 10 };
const MONITOR: ProductoFalso = { id: 11, nombre: "Monitor 24 pulgadas", precio: 1000, stock: 5, precioPromocion: 800 };

let auth: ServidorAuth;
let tienda: ServidorTienda;

/** Monta los servidores falsos con esos productos. */
function montarServidores(productos: ProductoFalso[]) {
  adapter.mockReset();
  auth = crearServidorAuth();
  const t = crearTiendaEnrutable(productos);
  tienda = t.servidor;
  instalarEnrutador(adapter as never, [auth.manejar, t.manejador, contenidoPublicoVacio]);
}

/** Una sesión que ya existía: cuenta del servidor, token vigente y store con el usuario. */
async function conSesion() {
  const cuenta = auth.agregarCuenta(CORREO, "Password1!");
  await useAuthStore.getState().setSession({ ...cuenta.user }, auth.emitirToken(CORREO));
}

async function agregarAlCarrito(idProducto: number, veces = 1) {
  const { result } = await renderHook(() => useAddToCart(), { wrapper });
  for (let i = 0; i < veces; i += 1) {
    await act(async () => {
      await result.current.mutateAsync(idProducto);
    });
  }
}

/** Los nombres de producto de las tarjetas, en el orden en que se pintan. */
const tarjetas = () =>
  screen
    .queryAllByRole("button")
    .map((b) => String(b.props.accessibilityLabel ?? ""))
    .filter((l) => /, \$[\d,]+\.\d{2}$/.test(l));

beforeEach(async () => {
  jest.clearAllMocks();
  montarServidores([MOUSE, TECLADO, MONITOR]);
  await reiniciarSesion();
  useCheckoutStore.setState({ selectedAddressId: null });
  usePaymentStore.setState({ locked: false, pendingPaymentIntentId: null });
});

describe("integración: ofertas en el Inicio y en «Ver todas»", () => {
  it("el Inicio muestra la sección Ofertas cuando hay productos con promoción", async () => {
    await conSesion();

    await render(<HomeScreen />, { wrapper });

    expect(await screen.findByText("Ofertas")).toBeTruthy();
    // La rebaja viaja en el catálogo: la etiqueta de descuento sale del porcentaje que manda el servidor.
    expect((await screen.findAllByText("-10%")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("-20%").length).toBeGreaterThan(0);
  });

  it("sin ninguna promoción vigente el Inicio no pinta la sección Ofertas", async () => {
    montarServidores([{ ...TECLADO }, { id: 12, nombre: "Cable HDMI", precio: 90, stock: 20 }]);
    await conSesion();

    await render(<HomeScreen />, { wrapper });
    await screen.findAllByText("Teclado mecánico");

    expect(screen.queryByText("Ofertas")).toBeNull();
    expect(screen.queryByText("Ver todas")).toBeNull();
  });

  it("«Ver todas» lleva a Promociones", async () => {
    await conSesion();
    await render(<HomeScreen />, { wrapper });

    await fireEvent.press(await screen.findByLabelText("Ver todas"));

    expect(mockPush).toHaveBeenCalledWith("/promociones");
  });

  it("Promociones lista solo los productos con promoción, del mayor al menor descuento", async () => {
    await render(<PromocionesScreen />, { wrapper });

    expect(await screen.findByText("2 ofertas")).toBeTruthy();
    expect(tarjetas()).toEqual(["Monitor 24 pulgadas, $800.00", "Mouse inalámbrico, $225.00"]);
    expect(screen.queryByLabelText(/Teclado mecánico/)).toBeNull();
  });

  it("Promociones sin ninguna promoción dice que no hay", async () => {
    montarServidores([TECLADO]);

    await render(<PromocionesScreen />, { wrapper });

    expect(await screen.findByText("No hay promociones por ahora")).toBeTruthy();
  });

  it("con más de 100 productos en oferta pide la segunda página del catálogo y los junta", async () => {
    const muchos: ProductoFalso[] = Array.from({ length: 101 }, (_, i) => ({
      id: 100 + i,
      nombre: `Oferta ${i + 1}`,
      precio: 200,
      stock: 3,
      precioPromocion: 150,
    }));
    montarServidores([...muchos, TECLADO]);

    await render(<PromocionesScreen />, { wrapper });

    expect(await screen.findByText("101 ofertas")).toBeTruthy();
    // El catálogo se recorre de 100 en 100 hasta una página corta: la 1.ª trae 100, la 2.ª trae 2.
    const pedidas = adapter.mock.calls
      .map(([c]) => c)
      .filter((c) => c.url === "/catalog/products" && c.params?.limit === 100)
      .map((c) => c.params.page);
    expect(pedidas).toEqual([1, 2]);
  });
});

describe("integración: descuento en el carrito", () => {
  it("la línea con promoción muestra el precio tachado, el precio con descuento por unidad y «-10 %»", async () => {
    await conSesion();
    await agregarAlCarrito(7, 2);

    await render(<CartScreen />, { wrapper });

    expect(await screen.findByText("$250.00")).toBeTruthy();
    expect(screen.getByText("$225.00 c/u")).toBeTruthy();
    expect(screen.getByText("-10 %")).toBeTruthy();
    // El total es el del servidor: 2 × $225.00, no 2 × $250.00.
    expect(screen.getByLabelText("Total $450.00")).toBeTruthy();
  });

  it("una línea sin promoción se pinta como siempre: sin precio tachado ni etiqueta de descuento", async () => {
    await conSesion();
    await agregarAlCarrito(9);

    await render(<CartScreen />, { wrapper });

    expect(await screen.findByText("$300.00 c/u")).toBeTruthy();
    expect(screen.queryByText(/-\d+ %/)).toBeNull();
    expect(screen.getByLabelText("Total $300.00")).toBeTruthy();
  });

  it("una línea con cupón muestra el precio del cupón y no la etiqueta de descuento de promoción", async () => {
    await conSesion();
    await agregarAlCarrito(7);
    tienda.aplicarCupon(7, "BIENVENIDA", 200);

    await render(<CartScreen />, { wrapper });

    expect(await screen.findByText("$200.00 c/u")).toBeTruthy();
    expect(screen.queryByText(/-\d+ %/)).toBeNull();
    expect(screen.getByLabelText("Total $200.00")).toBeTruthy();
  });

  it("al desactivar la promoción desaparece de Ofertas y el carrito vuelve al precio normal", async () => {
    await conSesion();
    await agregarAlCarrito(7);
    await render(<PromocionesScreen />, { wrapper });
    expect(await screen.findByText("2 ofertas")).toBeTruthy();

    tienda.fijarPromocion(7, null);
    // La lista de ofertas se guarda 5 min (staleTime): aquí se simula que ya venció, como al refrescar.
    await act(async () => {
      await cliente().invalidateQueries({ queryKey: ["products", "on-sale"] });
    });

    expect(await screen.findByText("1 oferta")).toBeTruthy();
    expect(screen.queryByLabelText(/Mouse inalámbrico/)).toBeNull();

    await render(<CartScreen />, { wrapper });
    expect(await screen.findByText("$250.00 c/u")).toBeTruthy();
    expect(screen.queryByText(/-\d+ %/)).toBeNull();
    expect(screen.getByLabelText("Total $250.00")).toBeTruthy();
  });
});

describe("integración: el pago cobra el precio con descuento", () => {
  const initPaymentSheet = jest.fn();
  const presentPaymentSheet = jest.fn();
  let ultimoPaymentIntent = "";

  beforeEach(() => {
    jest.useFakeTimers();
    initPaymentSheet.mockReset();
    presentPaymentSheet.mockReset();
    (useStripe as jest.Mock).mockReturnValue({ initPaymentSheet, presentPaymentSheet });
    initPaymentSheet.mockImplementation(async ({ paymentIntentClientSecret }: { paymentIntentClientSecret: string }) => {
      ultimoPaymentIntent = paymentIntentClientSecret.replace(/_secret_abc$/, "");
      return {};
    });
    presentPaymentSheet.mockImplementation(async () => {
      tienda.confirmarPago(ultimoPaymentIntent);
      return {};
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("el PaymentIntent y el pedido salen con el total descontado, no con el precio base", async () => {
    await conSesion();
    await agregarAlCarrito(7, 2);
    const { result } = await renderHook(() => ({ pago: usePayment(), direccion: useCreateAddress() }), { wrapper });
    await act(async () => {
      await result.current.direccion.mutateAsync(DIRECCION);
    });

    let promesa!: Promise<void>;
    await act(async () => {
      promesa = result.current.pago.pay(1);
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60000);
    });
    await act(async () => {
      await promesa;
    });

    // Lo que Stripe cobraría: 2 × $225.00 = $450.00 (con el precio base serían $500.00).
    expect(tienda.intents.get(ultimoPaymentIntent)?.monto).toBe(450);
    expect(tienda.pedidos).toHaveLength(1);
    expect(tienda.pedidos[0].total).toBe("450.00");
    expect(tienda.pedidos[0].items[0]).toMatchObject({ cantidad: 2, precio_unitario: "225.00", subtotal: "450.00" });
    await waitFor(() => expect(result.current.pago.state.phase).toBe("paid"));
  });
});
