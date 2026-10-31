// Recorrido completo de un cliente (HU #2, #3, #4, #6–#15 y #19): inicia sesión con 2FA, ve las Ofertas en el
// Inicio, junta un producto con descuento en el carrito, paga, ve su pedido, lo recibe, deja una reseña, la
// ve «Pendiente» en Mis reseñas y cierra sesión; con una variante de tarjeta rechazada y reintento, y la
// comprobación de que la cuenta siguiente no ve nada de la anterior.
// Piezas reales: las pantallas (login, verificar código, Inicio, carrito, detalle de pedido, escribir reseña,
// Mis reseñas, Mi cuenta), los hooks de sesión y de pago, los repositories, los selectores, el cliente Axios
// con su interceptor Bearer (solo su adapter es falso), el authStore y el queryClient REAL de la app (el que
// vacía el cierre de sesión). Simulados: expo-router, expo-secure-store, expo-notifications, el SDK de Stripe,
// los iconos y los servidores (sesión, tienda, reseñas y contenido público vacío). Sin red real, sin
// producción ni credenciales.
// Valida el contrato que la app espera de un servidor falso, NO el comportamiento del backend real ni del
// dispositivo. El servidor de la tienda solo modela una cuenta (carrito y pedidos son únicos): por eso la
// comprobación entre cuentas se hace sobre la caché, el perfil, Mis reseñas y el Bearer de cada petición.
import { notifyManager } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import LoginScreen from "@/app/(auth)/login";
import VerifyCodeScreen from "@/app/(auth)/verify-code";
import CartScreen from "@/app/(tabs)/cart";
import HomeScreen from "@/app/(tabs)/index";
import OrderScreen from "@/app/orders/[id]";
import ProfileTab from "@/app/profile/index";
import MyReviewsScreen from "@/app/reviews";
import NewReviewRoute from "@/app/reviews/new";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { useCreateAddress } from "@/features/addresses/hooks/useCreateAddress";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useChatStore } from "@/features/chatbot/chatStore";
import { usePayment } from "@/features/payments/hooks/usePayment";
import { usePaymentStore } from "@/features/payments/paymentStore";
import { queryClient } from "@/shared/api/queryClient";
import { getTokenSync } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";
import { useStripe } from "@stripe/stripe-react-native";

import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearAxiosFalso } from "../utils/axiosFake";
import { crearTiendaEnrutable, instalarEnrutador } from "../utils/enrutadorServidores";
import { ok } from "../utils/integracion";
import { crearServidorAuth, type ServidorAuth } from "../utils/servidorAuth";
import { contenidoPublicoVacio } from "../utils/servidorContenidoPublico";
import { crearServidorResenas, type ServidorResenas } from "../utils/servidorResenas";
import type { ServidorTienda } from "../utils/servidorTienda";

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  const navegacion = {
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  };
  return {
    router: navegacion,
    useRouter: () => navegacion,
    useLocalSearchParams: () => mockParams,
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirige a ${href}`),
    Stack: Object.assign(() => null, { Screen: () => null }),
  };
});
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-linking", () => ({ createURL: (path: string) => `syscommobile://${path}` }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "proyecto-de-prueba" } } } },
}));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "ExponentPushToken[dispositivo-de-prueba]" })),
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: jest.fn(),
  StripeProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.setTimeout(30000);

const { adapter } = crearAxiosFalso();

// Excepción a "un QueryClient por prueba": authStore.logout vacía el singleton de shared/api/queryClient,
/// así que esa instancia es la que se usa, vaciada entre pruebas. Con reintentos apagados y SIN descarte automático
// de consultas (gcTime infinito): así solo `clear()` puede quitar los datos y la prueba detecta si el cierre de sesión no lo hace.
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: Infinity },
    mutations: { retry: false, gcTime: 0 },
  });
});
afterAll(() => {
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
});

const CORREO = "ana@example.com";
const PASSWORD = "Password1!";
const DIRECCION = {
  calle: "Av. Juárez 123",
  colonia: "Centro",
  ciudad: "Huejutla",
  estado: "Hidalgo",
  codigo_postal: "43000",
};
const COMENTARIO = "Excelente mouse, la batería dura semanas y es muy cómodo.";

let auth: ServidorAuth;
let tienda: ServidorTienda;
let resenas: ServidorResenas;
let enrutador: ReturnType<typeof instalarEnrutador>;
let desregistros: unknown[];

const initPaymentSheet = jest.fn();
const presentPaymentSheet = jest.fn();
let ultimoPaymentIntent = "";

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  adapter.mockReset();
  queryClient.clear();
  auth = crearServidorAuth();
  const t = crearTiendaEnrutable([
    { id: 7, nombre: "Mouse inalámbrico", precio: 250, stock: 10, precioPromocion: 225 },
    { id: 9, nombre: "Teclado mecánico", precio: 300, stock: 10 },
  ]);
  tienda = t.servidor;
  resenas = crearServidorResenas({ tienda, cuentaDe: auth.cuentaDe });
  desregistros = [];
  const notificaciones = (config: { method?: string; url?: string; data?: unknown }) =>
    config.method === "delete" && config.url === "/notifications/push/expo/unregister"
      ? (desregistros.push(config.data), ok(config as never, { message: "Token desactivado" }))
      : undefined;
  enrutador = instalarEnrutador(adapter as never, [
    auth.manejar,
    resenas.manejar,
    t.manejador,
    contenidoPublicoVacio,
    notificaciones as never,
  ]);
  await reiniciarSesion();
  useChatStore.getState().reset();
  usePaymentStore.setState({ locked: false, pendingPaymentIntentId: null });
  useCheckoutStore.setState({ selectedAddressId: null });

  initPaymentSheet.mockReset();
  presentPaymentSheet.mockReset();
  (useStripe as jest.Mock).mockReturnValue({ initPaymentSheet, presentPaymentSheet });
  initPaymentSheet.mockImplementation(async ({ paymentIntentClientSecret }: { paymentIntentClientSecret: string }) => {
    ultimoPaymentIntent = paymentIntentClientSecret.replace(/_secret_abc$/, "");
    return {};
  });
  // Pago correcto por defecto: Stripe cobra y el webhook queda "armado".
  presentPaymentSheet.mockImplementation(async () => {
    tienda.confirmarPago(ultimoPaymentIntent);
    return {};
  });
});

afterEach(() => {
  queryClient.clear();
});

const escribir = (placeholder: string, texto: string) =>
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), texto);

/** El campo del código de 6 dígitos es el único TextInput de la pantalla y no tiene etiqueta. */
const escribirCodigo = (codigo: string) => fireEvent.changeText(screen.getByDisplayValue(""), codigo);

async function iniciarSesionEnPantalla(correo: string, password: string) {
  await render(<LoginScreen />, { wrapper });
  await escribir("tu@email.com", correo);
  await escribir("Tu contraseña", password);
  await fireEvent.press(screen.getByText("Iniciar sesión"));
}

async function soloSesion(correo = CORREO) {
  const cuenta = auth.agregarCuenta(correo, PASSWORD);
  await useAuthStore.getState().setSession({ ...cuenta.user }, auth.emitirToken(correo));
  return cuenta;
}

async function agregarAlCarrito(idProducto: number) {
  const { result } = await renderHook(() => useAddToCart(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync(idProducto);
  });
}

/** Prepara el hook de pago con una dirección guardada. */
async function prepararPago() {
  const montado = await renderHook(() => ({ pago: usePayment(), direccion: useCreateAddress() }), { wrapper });
  await act(async () => {
    await montado.result.current.direccion.mutateAsync(DIRECCION);
  });
  return montado.result;
}

/** Paga con el reloj falso (el seguimiento del pedido espera 2 s entre consultas) y vuelve al reloj real. */
async function pagar(result: Awaited<ReturnType<typeof prepararPago>>) {
  jest.useFakeTimers();
  try {
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
  } finally {
    jest.useRealTimers();
  }
}

/** Entradas de la caché de TanStack Query que ya tienen datos (las pendientes sin datos no cuentan). */
const consultasConDatos = () => queryClient.getQueryCache().getAll().filter((q) => q.state.data !== undefined);

describe("integración: recorrido completo de un cliente", () => {
  it("login con 2FA → Ofertas → carrito con descuento → pago → pedido → entregado → reseña Pendiente → cierre de sesión", async () => {
    auth.agregarCuenta(CORREO, PASSWORD, { dosFactores: true });

    // 1. Login con 2FA: no hay sesión hasta confirmar el código del correo.
    await iniciarSesionEnPantalla(CORREO, PASSWORD);
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    await screen.unmount();
    mockParams = mockPush.mock.calls[0][0].params;
    await render(<VerifyCodeScreen />, { wrapper });
    await escribirCodigo(auth.ultimoCodigo(CORREO, "2fa_login"));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    const token = auth.tokenDe(CORREO) as string;
    expect(getTokenSync()).toBe(token);
    await screen.unmount();

    // 2. Inicio: la sección Ofertas muestra la promoción de -10 %.
    mockParams = {};
    await render(<HomeScreen />, { wrapper });
    expect(await screen.findByText("Ofertas")).toBeTruthy();
    expect((await screen.findAllByText("-10%")).length).toBeGreaterThan(0);
    await screen.unmount();

    // 3. Carrito: la línea muestra el precio tachado, el precio con descuento y el total descontado.
    await agregarAlCarrito(7);
    await render(<CartScreen />, { wrapper });
    expect(await screen.findByText("$250.00")).toBeTruthy();
    expect(screen.getByText("$225.00 c/u")).toBeTruthy();
    expect(screen.getByText("-10 %")).toBeTruthy();
    expect(screen.getByLabelText("Total $225.00")).toBeTruthy();
    await screen.unmount();

    // 4. Pago: Stripe cobra el total descontado y el pedido se crea con él.
    const hooks = await prepararPago();
    await pagar(hooks);
    await waitFor(() => expect(hooks.current.pago.state.phase).toBe("paid"));
    const idPedido = hooks.current.pago.state.orderId as number;
    expect(tienda.intents.get(ultimoPaymentIntent)?.monto).toBe(225);

    // 5. Confirmación del pedido: el detalle coincide con el total descontado.
    mockParams = { id: String(idPedido), confirmed: "1" };
    await render(<OrderScreen />, { wrapper });
    expect(await screen.findByText("¡Pago exitoso!")).toBeTruthy();
    expect(screen.getByLabelText("Total $225.00")).toBeTruthy();
    expect(screen.getByText("1 × $225.00")).toBeTruthy();
    expect(screen.getByText("Confirmado")).toBeTruthy();
    await screen.unmount();

    // 5b. El detalle normal de un pedido que aún no se entrega no ofrece reseñar sus productos.
    mockParams = { id: String(idPedido) };
    await render(<OrderScreen />, { wrapper });
    expect(await screen.findByText("Confirmado")).toBeTruthy();
    expect(screen.queryByLabelText("Reseñar Mouse inalámbrico")).toBeNull();
    await screen.unmount();

    // 6. El pedido se entrega (acción simulada de prueba sobre el servidor falso): ahora se puede reseñar.
    tienda.marcarEntregado(idPedido);
    // El pedido se guarda 5 min en la caché (staleTime de la app): aquí se simula el refresco que hace
    // la persona al jalar para actualizar o al volver pasado ese tiempo.
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["order", idPedido] });
    });
    mockParams = { id: String(idPedido) };
    await render(<OrderScreen />, { wrapper });
    expect(await screen.findByText("Entregado")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Reseñar Mouse inalámbrico"));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/reviews/new",
      params: { productId: "7", productName: "Mouse inalámbrico" },
    });
    await screen.unmount();

    // 7. Reseña: el formulario sale del pedido entregado y la reseña queda «Pendiente» en Mis reseñas.
    mockParams = { productId: "7", productName: "Mouse inalámbrico" };
    await render(<NewReviewRoute />, { wrapper });
    await fireEvent.press(await screen.findByLabelText("Calificar con 5 estrellas"));
    await fireEvent.changeText(screen.getByLabelText("Comentario"), COMENTARIO);
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
    expect(await screen.findByText("¡Gracias por tu reseña!")).toBeTruthy();
    expect(enrutador.de("POST", "/reviews")[0].cuerpo).toMatchObject({ id_producto: 7, id_pedido: idPedido });
    await screen.unmount();
    await render(<MyReviewsScreen />, { wrapper });
    expect(await screen.findByText("Pendiente")).toBeTruthy();
    expect(screen.getByText("Mouse inalámbrico")).toBeTruthy();
    await screen.unmount();

    // 8. Cierre de sesión desde Mi cuenta: sin token, sin sesión y sin datos de la cuenta en la caché.
    await render(<ProfileTab />, { wrapper });
    expect(await screen.findByText("¡Hola, Ana!")).toBeTruthy();
    expect(consultasConDatos().length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText("Cerrar sesión"));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(getTokenSync()).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(consultasConDatos()).toHaveLength(0);
    expect(await screen.findByText("redirige a /(auth)/login")).toBeTruthy();
    // Además del perfil, no quedó ninguna reseña ni pedido de esa cuenta a la vista.
    expect(JSON.stringify(consultasConDatos().map((q) => q.state.data))).not.toContain("Mouse inalámbrico");
  });

  it("con la tarjeta rechazada no se cobra ni se crea el pedido, el carrito se conserva y el reintento con otra tarjeta funciona", async () => {
    await soloSesion();
    await agregarAlCarrito(7);
    const hooks = await prepararPago();
    presentPaymentSheet.mockImplementationOnce(async () => ({
      error: { code: "Failed", declineCode: "generic_decline", message: "Your card was declined." },
    }));

    await pagar(hooks);

    expect(hooks.current.pago.state.phase).toBe("failed");
    expect(hooks.current.pago.state.message).toBe("Tu tarjeta fue rechazada. Prueba con otra tarjeta.");
    expect(tienda.pedidos).toHaveLength(0);
    expect(tienda.intents.get(ultimoPaymentIntent)?.pagado).toBe(false);
    expect(usePaymentStore.getState().locked).toBe(false);
    // El carrito sigue igual, con el descuento y sin editarse a escondidas.
    await render(<CartScreen />, { wrapper });
    expect(await screen.findByText("$225.00 c/u")).toBeTruthy();
    expect(screen.getByLabelText("Total $225.00")).toBeTruthy();
    await screen.unmount();

    // Reintento: el servidor crea un PaymentIntent nuevo y ahora sí cobra el total descontado.
    await pagar(hooks);

    await waitFor(() => expect(hooks.current.pago.state.phase).toBe("paid"));
    expect(tienda.veces("POST /payments/checkout")).toBe(2);
    expect(tienda.intents.size).toBe(2);
    expect(tienda.intents.get(ultimoPaymentIntent)?.monto).toBe(225);
    expect(tienda.pedidos).toHaveLength(1);
    expect(tienda.pedidos[0].total).toBe("225.00");
    expect(tienda.carrito).toHaveLength(0);
  });

  it("la cuenta siguiente en el mismo dispositivo no ve nada de la anterior: ni caché, ni perfil, ni reseñas, ni su token", async () => {
    // Cuenta A con datos propios en caché: perfil y una reseña.
    const cuentaA = await soloSesion(CORREO);
    tienda.sembrarPedido([7]);
    resenas.resenas.push({
      id_resena: 1,
      id_usuario: cuentaA.user.id_usuario,
      id_producto: 7,
      id_pedido: tienda.pedidos[0].id_pedido,
      calificacion: 5,
      titulo: null,
      comentario: COMENTARIO,
      estado: "pendiente",
      created_at: "2026-10-20T10:01:00.000Z",
    });
    const tokenA = auth.tokenDe(CORREO) as string;
    await render(<MyReviewsScreen />, { wrapper });
    expect(await screen.findByText(COMENTARIO)).toBeTruthy();
    await screen.unmount();
    await render(<ProfileTab />, { wrapper });
    expect(await screen.findByText("¡Hola, Ana!")).toBeTruthy();

    // A cierra sesión.
    await fireEvent.press(screen.getByLabelText("Cerrar sesión"));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(consultasConDatos()).toHaveLength(0);
    await screen.unmount();

    // B inicia sesión en el mismo dispositivo.
    auth.agregarCuenta("beto@example.com", PASSWORD, { nombre: "Beto" });
    const peticionesAntes = enrutador.peticiones.length;
    await iniciarSesionEnPantalla("beto@example.com", PASSWORD);
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    const tokenB = auth.tokenDe("beto@example.com") as string;
    expect(tokenB).not.toBe(tokenA);
    await screen.unmount();

    await render(<ProfileTab />, { wrapper });
    expect(await screen.findByText("¡Hola, Beto!")).toBeTruthy();
    expect(screen.queryByText("¡Hola, Ana!")).toBeNull();
    await screen.unmount();
    await render(<MyReviewsScreen />, { wrapper });
    expect(await screen.findByText("Aún no has escrito reseñas")).toBeTruthy();
    expect(screen.queryByText(COMENTARIO)).toBeNull();

    // Todo lo que se pidió con sesión después del login de B va con el token de B, nunca con el de A.
    const conSesion = enrutador.peticiones
      .slice(peticionesAntes)
      .filter((p) => p.autorizacion !== undefined && p.ruta !== "/auth/login");
    expect(conSesion.length).toBeGreaterThan(0);
    expect(conSesion.every((p) => p.autorizacion === `Bearer ${tokenB}`)).toBe(true);
    expect(JSON.stringify(consultasConDatos().map((q) => q.state.data))).not.toContain("Ana");
    expect(JSON.stringify(consultasConDatos().map((q) => q.state.data))).not.toContain(COMENTARIO);
  });
});
