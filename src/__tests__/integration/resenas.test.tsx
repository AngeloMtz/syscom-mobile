// Integración de las reseñas (HU #19): quién puede reseñar, el envío, "Mis reseñas", la reseña aprobada en
// el detalle del producto y los errores del servidor, contra servidores falsos con estado (sesión, tienda
// y reseñas con aprobación de un administrador).
// Piezas reales: ProductReviewsSection (lo que el detalle del producto incrusta), la pantalla de escribir
// reseña, Mis reseñas, RequireAuth, los hooks, reviewRepository, los selectores, el cliente Axios con su
// interceptor Bearer (solo su adapter es falso), TanStack Query y los stores. Simulados: expo-router,
// expo-secure-store y los iconos. Sin red real, sin producción ni credenciales.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real: las formas de
// respuesta y los textos de `reason` salen del código de la app, no de respuestas reales.
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import MyReviewsScreen from "@/app/reviews";
import NewReviewRoute from "@/app/reviews/new";
import ProductReviewsSection from "@/features/reviews/components/ProductReviewsSection";
import { useAuthStore } from "@/shared/store/authStore";

import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearAxiosFalso } from "../utils/axiosFake";
import { crearTiendaEnrutable, instalarEnrutador } from "../utils/enrutadorServidores";
import { usarClientePorPrueba } from "../utils/integracion";
import { crearServidorAuth, type ServidorAuth } from "../utils/servidorAuth";
import { crearServidorResenas, type ServidorResenas } from "../utils/servidorResenas";
import type { ServidorTienda } from "../utils/servidorTienda";

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  const navegacion = {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
    replace: jest.fn(),
    canGoBack: () => true,
  };
  return {
    router: navegacion,
    useRouter: () => navegacion,
    useLocalSearchParams: () => mockParams,
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirige a ${href}`),
    Stack: { Screen: () => null },
  };
});
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

const CORREO = "ana@example.com";
const COMENTARIO = "Excelente mouse, la batería dura semanas y es muy cómodo.";

let auth: ServidorAuth;
let tienda: ServidorTienda;
let resenas: ServidorResenas;
let enrutador: ReturnType<typeof instalarEnrutador>;

/** Una sesión que ya existía: cuenta del servidor, token vigente y store con el usuario. */
async function conSesion() {
  const cuenta = auth.agregarCuenta(CORREO, "Password1!");
  await useAuthStore.getState().setSession({ ...cuenta.user }, auth.emitirToken(CORREO));
}

/** Escribe la reseña en la pantalla de escribir reseña y la envía. */
async function escribirYEnviar(estrellas = 5, comentario = COMENTARIO) {
  await fireEvent.press(await screen.findByLabelText(`Calificar con ${estrellas} ${estrellas === 1 ? "estrella" : "estrellas"}`));
  await fireEvent.changeText(screen.getByLabelText("Comentario"), comentario);
  await fireEvent.press(screen.getByLabelText("Enviar reseña"));
}

const detalleDelProducto = () => <ProductReviewsSection productId={7} productName="Mouse inalámbrico" />;

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = { productId: "7", productName: "Mouse inalámbrico" };
  adapter.mockReset();
  auth = crearServidorAuth();
  const t = crearTiendaEnrutable([
    { id: 7, nombre: "Mouse inalámbrico", precio: 250, stock: 10 },
    { id: 9, nombre: "Teclado mecánico", precio: 300, stock: 10 },
  ]);
  tienda = t.servidor;
  resenas = crearServidorResenas({ tienda, cuentaDe: auth.cuentaDe });
  enrutador = instalarEnrutador(adapter as never, [auth.manejar, resenas.manejar, t.manejador]);
  await reiniciarSesion();
});

describe("integración: quién puede reseñar", () => {
  it("sin ninguna compra no hay formulario: el detalle da el motivo del servidor y no ofrece «Escribir reseña»", async () => {
    await conSesion();

    await render(detalleDelProducto(), { wrapper });

    expect(await screen.findByText("Solo puedes reseñar productos de un pedido entregado.")).toBeTruthy();
    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
    expect(screen.getByText("Aún no hay reseñas de este producto.")).toBeTruthy();
  });

  it("sin compra, la pantalla de escribir reseña dice «No puedes reseñar este producto» y no muestra el formulario", async () => {
    await conSesion();

    await render(<NewReviewRoute />, { wrapper });

    expect(await screen.findByText("No puedes reseñar este producto")).toBeTruthy();
    expect(screen.getByText("Solo puedes reseñar productos de un pedido entregado.")).toBeTruthy();
    expect(screen.queryByLabelText("Enviar reseña")).toBeNull();
    expect(resenas.veces("POST /reviews")).toBe(0);
  });

  it("un pedido que aún no se entrega no da derecho a reseñar; al entregarse sí", async () => {
    await conSesion();
    tienda.sembrarPedido([7], "confirmado");
    const primera = await render(detalleDelProducto(), { wrapper });
    expect(await screen.findByText("Solo puedes reseñar productos de un pedido entregado.")).toBeTruthy();
    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
    await primera.unmount();

    tienda.marcarEntregado(tienda.pedidos[0].id_pedido);
    await render(detalleDelProducto(), { wrapper });

    expect(await screen.findByLabelText("Escribir reseña")).toBeTruthy();
  });

  it("con un pedido entregado el detalle ofrece «Escribir reseña» y abre el formulario del producto", async () => {
    await conSesion();
    tienda.sembrarPedido([7]);
    await render(detalleDelProducto(), { wrapper });

    await fireEvent.press(await screen.findByLabelText("Escribir reseña"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/reviews/new",
      params: { productId: "7", productName: "Mouse inalámbrico" },
    });
  });

  it("el pedido entregado de otro producto no da derecho a reseñar este", async () => {
    await conSesion();
    tienda.sembrarPedido([9]);

    await render(detalleDelProducto(), { wrapper });

    expect(await screen.findByText("Solo puedes reseñar productos de un pedido entregado.")).toBeTruthy();
    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
  });
});

describe("integración: enviar la reseña y seguirla hasta que se publica", () => {
  it("el envío manda el pedido que dio derecho, queda «Pendiente» en Mis reseñas y el detalle avisa «Ya dejaste una reseña»", async () => {
    await conSesion();
    const pedido = tienda.sembrarPedido([7]);
    const formulario = await render(<NewReviewRoute />, { wrapper });

    await escribirYEnviar(5);

    expect(await screen.findByText("¡Gracias por tu reseña!")).toBeTruthy();
    expect(screen.getByText("Se publicará cuando un administrador la apruebe.")).toBeTruthy();
    const envio = enrutador.de("POST", "/reviews");
    expect(envio).toHaveLength(1);
    expect(envio[0].cuerpo).toEqual({
      tipo: "producto",
      id_producto: 7,
      id_pedido: pedido.id_pedido,
      calificacion: 5,
      comentario: COMENTARIO,
    });
    expect(envio[0].autorizacion).toBe(`Bearer ${auth.tokenDe(CORREO)}`);
    expect(resenas.resenas).toHaveLength(1);
    expect(resenas.resenas[0].estado).toBe("pendiente");
    await formulario.unmount();

    // Mis reseñas: la reseña está, con su estado y el producto.
    const mias = await render(<MyReviewsScreen />, { wrapper });
    expect(await screen.findByText("Pendiente")).toBeTruthy();
    expect(screen.getByText("Mouse inalámbrico")).toBeTruthy();
    expect(screen.getByText(COMENTARIO)).toBeTruthy();
    await mias.unmount();

    // El detalle: ya no ofrece escribir otra y no la publica todavía (sigue pendiente).
    await render(detalleDelProducto(), { wrapper });
    expect(await screen.findByText("Ya dejaste una reseña para este producto.")).toBeTruthy();
    expect(screen.queryByLabelText("Escribir reseña")).toBeNull();
    expect(screen.getByText("Aún no hay reseñas de este producto.")).toBeTruthy();
    expect(screen.queryByText(COMENTARIO)).toBeNull();
  });

  it("al aprobarla un administrador, el detalle la muestra con su autor y el promedio de las aprobadas", async () => {
    await conSesion();
    tienda.sembrarPedido([7]);
    const formulario = await render(<NewReviewRoute />, { wrapper });
    await escribirYEnviar(5);
    await screen.findByText("¡Gracias por tu reseña!");
    await formulario.unmount();
    // Otra cliente ya había reseñado y su reseña está aprobada (3 estrellas); la pendiente no cuenta.
    resenas.resenas.push({
      id_resena: 90,
      id_usuario: 999,
      id_producto: 7,
      id_pedido: 1,
      calificacion: 3,
      titulo: null,
      comentario: "Cumple, sin más.",
      estado: "aprobada",
      created_at: "2026-10-10T10:00:00.000Z",
    });
    const antes = await render(detalleDelProducto(), { wrapper });
    expect(await screen.findByText("Cumple, sin más.")).toBeTruthy();
    expect(screen.getByText("3.0")).toBeTruthy();
    expect(screen.getByText("1 reseña")).toBeTruthy();
    expect(screen.queryByText(COMENTARIO)).toBeNull();
    await antes.unmount();

    resenas.aprobarResena(resenas.resenas.find((r) => r.id_usuario !== 999)!.id_resena);
    await render(detalleDelProducto(), { wrapper });

    expect(await screen.findByText(COMENTARIO)).toBeTruthy();
    expect(screen.getByText("Cumple, sin más.")).toBeTruthy();
    expect(screen.getByText("4.0")).toBeTruthy();
    expect(screen.getByText("2 reseñas")).toBeTruthy();
    // El autor sale con el nombre y la inicial del apellido; si el servidor no lo trae, uno genérico.
    expect(screen.getByText("Ana P.")).toBeTruthy();
    expect(screen.getByText("Cliente de SYSCOM")).toBeTruthy();
  });

  it("una reseña rechazada por el administrador aparece como «Rechazada» en Mis reseñas y nunca en el detalle", async () => {
    await conSesion();
    tienda.sembrarPedido([7]);
    const formulario = await render(<NewReviewRoute />, { wrapper });
    await escribirYEnviar(2);
    await screen.findByText("¡Gracias por tu reseña!");
    await formulario.unmount();

    resenas.rechazarResena(resenas.resenas[0].id_resena);

    const mias = await render(<MyReviewsScreen />, { wrapper });
    expect(await screen.findByText("Rechazada")).toBeTruthy();
    await mias.unmount();
    await render(detalleDelProducto(), { wrapper });
    expect(await screen.findByText("Aún no hay reseñas de este producto.")).toBeTruthy();
    expect(screen.queryByText(COMENTARIO)).toBeNull();
  });
});

describe("integración: errores del servidor y sin sesión", () => {
  it.each([
    [400, "Los datos de la reseña no son válidos."],
    [409, "Ya dejaste una reseña para este producto."],
    [500, "Error interno del servidor."],
  ])("si el servidor responde %i, la app muestra su mensaje, conserva lo escrito y permite reintentar", async (status, mensaje) => {
    await conSesion();
    tienda.sembrarPedido([7]);
    resenas.fallarProxima("POST /reviews", { status, message: mensaje });
    await render(<NewReviewRoute />, { wrapper });

    await escribirYEnviar(4);

    expect(await screen.findByText(mensaje)).toBeTruthy();
    expect(screen.queryByText("¡Gracias por tu reseña!")).toBeNull();
    expect(screen.getByDisplayValue(COMENTARIO)).toBeTruthy();
    expect(resenas.resenas).toHaveLength(0);

    // El reintento (sin fallo forzado) sí crea la reseña.
    await fireEvent.press(screen.getByLabelText("Enviar reseña"));
    expect(await screen.findByText("¡Gracias por tu reseña!")).toBeTruthy();
    expect(resenas.resenas).toHaveLength(1);
  });

  it("si falla la verificación de la compra, ofrece «Reintentar» y al reintentar muestra el formulario", async () => {
    await conSesion();
    tienda.sembrarPedido([7]);
    resenas.fallarProxima("GET /reviews/can-review/:id", { status: 500, message: "Error interno del servidor." });
    await render(<NewReviewRoute />, { wrapper });

    expect(await screen.findByText("No pudimos verificar si puedes reseñar este producto")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Reintentar"));

    expect(await screen.findByLabelText("Enviar reseña")).toBeTruthy();
  });

  it("sin sesión el detalle muestra las reseñas públicas, «Escribir reseña» lleva al login y no se consulta lo privado", async () => {
    resenas.resenas.push({
      id_resena: 90,
      id_usuario: 999,
      id_producto: 7,
      id_pedido: 1,
      calificacion: 4,
      titulo: "Buen producto",
      comentario: "Cumple muy bien.",
      estado: "aprobada",
      created_at: "2026-10-10T10:00:00.000Z",
    });
    await render(detalleDelProducto(), { wrapper });

    expect(await screen.findByText("Cumple muy bien.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Escribir reseña"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
    expect(enrutador.de("GET", "/reviews/can-review/7")).toHaveLength(0);
    expect(enrutador.de("GET", "/reviews/product/7")[0].autorizacion).toBeUndefined();
  });

  it("sin sesión, Mis reseñas y escribir reseña redirigen al login sin pedir nada al servidor", async () => {
    const mias = await render(<MyReviewsScreen />, { wrapper });
    expect(screen.getByText("redirige a /(auth)/login")).toBeTruthy();
    await mias.unmount();
    await render(<NewReviewRoute />, { wrapper });
    expect(screen.getByText("redirige a /(auth)/login")).toBeTruthy();

    await waitFor(() => expect(enrutador.peticiones).toHaveLength(0));
  });
});
