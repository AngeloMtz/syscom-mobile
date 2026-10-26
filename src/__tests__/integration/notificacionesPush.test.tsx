// Integración de las notificaciones push (HU #17), con servicios simulados:
// permiso → token de Expo → registro en el backend → bandeja y preferencias → cierre de sesión.
// Piezas reales: useRegisterPushToken, pushNotifications, notificationRepository, useLogout,
// la pantalla NotificationsScreen, el cliente Axios (solo su adapter es falso), TanStack Query
// y los stores. Se simulan expo-notifications, expo-constants y expo-router: no hay red real,
// ni dispositivo, ni Firebase/Expo Push, ni credenciales.
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import NotificationsScreen from "@/app/notifications/index";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useChatStore } from "@/features/chatbot/chatStore";
import { useRegisterPushToken } from "@/features/notifications/hooks/useRegisterPushToken";
import { getTokenSync } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeNetworkError, makeNotification, makeUser } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { ok, usarClientePorPrueba } from "../utils/integracion";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "proyecto-eas-de-prueba" } } } },
}));

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return {
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
    Stack: { Screen: () => null },
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirige:${href}`),
  };
});

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

const permisos = Notifications.getPermissionsAsync as jest.Mock;
const pedirPermiso = Notifications.requestPermissionsAsync as jest.Mock;
const obtenerToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const canal = Notifications.setNotificationChannelAsync as jest.Mock;

const TOKEN_EXPO = "ExponentPushToken[abc123]";

/** El projectId de EAS que lee getExpoPushToken; las pruebas lo quitan para simular un build sin configurar. */
const proyectoEas = Constants.expoConfig as unknown as { extra: { eas: { projectId?: string } } };

// — Backend falso con estado (forma tomada del código del backend; sin contrastar con respuestas vivas) —
type Llamada = { metodo?: string; ruta?: string; autorizacion?: unknown; cuerpo?: any };
type Fallo = { status?: number; red?: boolean; message?: string };

const backend = {
  tokens: new Set<string>(),
  preferencias: { email: true, push: false },
  notificaciones: [] as ReturnType<typeof makeNotification>[],
  fallos: new Map<string, Fallo>(),
  llamadas: [] as Llamada[],
  /** Si se define, el PUT de preferencias espera a esta promesa (para ver el cambio optimista). */
  compuertaPreferencias: null as Promise<void> | null,
  /** Libera la compuerta; se invoca siempre al terminar para no dejar una petición colgada si la prueba falla. */
  soltarPreferencias: null as (() => void) | null,
};

const cuerpoDe = (config: { data?: unknown }) => (typeof config.data === "string" ? JSON.parse(config.data) : config.data);
const veces = (metodo: string, ruta: string) =>
  backend.llamadas.filter((l) => l.metodo === metodo && l.ruta === ruta);

beforeEach(async () => {
  jest.clearAllMocks();
  backend.tokens.clear();
  backend.preferencias = { email: true, push: false };
  backend.notificaciones = [
    makeNotification({ id_notificacion: 1, titulo: "Tu pedido está en camino", leida: false }),
    makeNotification({ id_notificacion: 2, titulo: "Promoción de octubre", tipo: "campana", leida: false }),
    makeNotification({ id_notificacion: 3, titulo: "Pedido entregado", leida: true }),
  ];
  backend.fallos.clear();
  backend.llamadas = [];
  backend.compuertaPreferencias = null;
  proyectoEas.extra.eas.projectId = "proyecto-eas-de-prueba";
  jest.replaceProperty(Platform, "OS", "android");
  permisos.mockResolvedValue({ granted: true, canAskAgain: true });
  obtenerToken.mockResolvedValue({ data: TOKEN_EXPO });
  await useAuthStore.getState().logout();
  useChatStore.getState().reset();

  adapter.mockReset();
  adapter.mockImplementation(async (config) => {
    const metodo = config.method;
    const ruta = config.url ?? "";
    const cuerpo = cuerpoDe(config);
    backend.llamadas.push({ metodo, ruta, autorizacion: config.headers?.Authorization, cuerpo });

    const fallo = backend.fallos.get(`${metodo} ${ruta}`);
    if (fallo?.red) throw makeNetworkError();
    if (fallo) throw makeApiError({ status: fallo.status ?? 500, message: fallo.message ?? "Error del servidor" });

    if (metodo === "post" && ruta === "/notifications/push/expo/register") {
      backend.tokens.add(cuerpo.token);
      return ok(config, {});
    }
    if (metodo === "delete" && ruta === "/notifications/push/expo/unregister") {
      backend.tokens.delete(cuerpo.token);
      return ok(config, {});
    }
    if (metodo === "get" && ruta === "/notifications") {
      return ok(config, {
        data: backend.notificaciones,
        total: backend.notificaciones.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    }
    if (metodo === "get" && ruta === "/notifications/preferences") return ok(config, { data: { ...backend.preferencias } });
    if (metodo === "put" && ruta === "/notifications/preferences") {
      if (backend.compuertaPreferencias) await backend.compuertaPreferencias;
      backend.preferencias = { email: cuerpo.email, push: cuerpo.push };
      return ok(config, {});
    }
    if (metodo === "put" && ruta === "/notifications/read-all") {
      backend.notificaciones = backend.notificaciones.map((n) => ({ ...n, leida: true }));
      return ok(config, {});
    }
    const leer = /^\/notifications\/(\d+)\/read$/.exec(ruta);
    if (metodo === "put" && leer) {
      backend.notificaciones = backend.notificaciones.map((n) =>
        n.id_notificacion === Number(leer[1]) ? { ...n, leida: true } : n,
      );
      return ok(config, {});
    }
    throw makeApiError({ status: 404, message: "Ruta no encontrada" });
  });
});

afterEach(() => {
  backend.soltarPreferencias?.();
  backend.soltarPreferencias = null;
  jest.restoreAllMocks();
});

const iniciarSesion = (token = "jwt-A") =>
  act(async () => {
    await useAuthStore.getState().setSession(makeUser({ id_usuario: 1 }), token);
  });

/** Deja correr la cadena asíncrona (permiso → token → petición) cuando no hay nada visible que esperar. */
const asentar = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });

describe("integración push: permiso → token → registro en el backend", () => {
  it("sin sesión no pide permiso ni toca el backend", async () => {
    await renderHook(() => useRegisterPushToken());
    await asentar();

    expect(permisos).not.toHaveBeenCalled();
    expect(backend.llamadas).toHaveLength(0);
  });

  it("al iniciar sesión con el permiso concedido registra el token en el backend, con la sesión", async () => {
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion("jwt-A");

    await waitFor(() => expect(backend.tokens.has(TOKEN_EXPO)).toBe(true));
    expect(canal).toHaveBeenCalledWith("default", expect.objectContaining({ name: "General" }));
    expect(obtenerToken).toHaveBeenCalledWith({ projectId: "proyecto-eas-de-prueba" });
    const registro = veces("post", "/notifications/push/expo/register");
    expect(registro).toHaveLength(1);
    expect(registro[0]).toMatchObject({ cuerpo: { token: TOKEN_EXPO }, autorizacion: "Bearer jwt-A" });
    expect(pedirPermiso).not.toHaveBeenCalled();
  });

  it("si nunca se había preguntado, pide el permiso y, al concederlo, registra el token", async () => {
    permisos.mockResolvedValue({ granted: false, canAskAgain: true });
    pedirPermiso.mockResolvedValue({ granted: true });
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion();

    await waitFor(() => expect(backend.tokens.has(TOKEN_EXPO)).toBe(true));
    expect(pedirPermiso).toHaveBeenCalledTimes(1);
  });

  it("si la persona deniega el permiso, no se obtiene token ni se registra nada", async () => {
    permisos.mockResolvedValue({ granted: false, canAskAgain: true });
    pedirPermiso.mockResolvedValue({ granted: false });
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion();
    await waitFor(() => expect(pedirPermiso).toHaveBeenCalledTimes(1));
    await asentar();

    expect(obtenerToken).not.toHaveBeenCalled();
    expect(veces("post", "/notifications/push/expo/register")).toHaveLength(0);
    expect(backend.tokens.size).toBe(0);
  });

  it("si el permiso ya se había rechazado y no se puede volver a preguntar, no insiste ni registra", async () => {
    permisos.mockResolvedValue({ granted: false, canAskAgain: false });
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion();
    await waitFor(() => expect(permisos).toHaveBeenCalledTimes(1));
    await asentar();

    expect(pedirPermiso).not.toHaveBeenCalled();
    expect(obtenerToken).not.toHaveBeenCalled();
    expect(backend.llamadas).toHaveLength(0);
  });

  it("sin projectId de EAS no hay token y no se registra nada", async () => {
    proyectoEas.extra.eas.projectId = undefined;
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion();
    await waitFor(() => expect(permisos).toHaveBeenCalled());
    await asentar();

    expect(obtenerToken).not.toHaveBeenCalled();
    expect(backend.llamadas).toHaveLength(0);
  });

  it("si Expo no entrega el token (error o sin Google Play Services) no se registra y no se rompe", async () => {
    obtenerToken.mockRejectedValue(new Error("SERVICE_NOT_AVAILABLE"));
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion();
    await waitFor(() => expect(obtenerToken).toHaveBeenCalled());
    await asentar();

    expect(backend.llamadas).toHaveLength(0);
  });

  it("si el backend rechaza el registro (500) o no responde, la app sigue y reintenta en el siguiente inicio de sesión", async () => {
    backend.fallos.set("post /notifications/push/expo/register", { status: 500 });
    await renderHook(() => useRegisterPushToken());

    await iniciarSesion("jwt-A");
    await waitFor(() => expect(veces("post", "/notifications/push/expo/register")).toHaveLength(1));
    await asentar();
    expect(backend.tokens.size).toBe(0);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    backend.fallos.set("post /notifications/push/expo/register", { red: true });
    await act(async () => {
      await useAuthStore.getState().logout();
    });
    await iniciarSesion("jwt-B");
    await waitFor(() => expect(veces("post", "/notifications/push/expo/register")).toHaveLength(2));
    await asentar();
    expect(backend.tokens.size).toBe(0);

    backend.fallos.clear();
    await act(async () => {
      await useAuthStore.getState().logout();
    });
    await iniciarSesion("jwt-C");

    await waitFor(() => expect(backend.tokens.has(TOKEN_EXPO)).toBe(true));
    expect(veces("post", "/notifications/push/expo/register")[2].autorizacion).toBe("Bearer jwt-C");
  });
});

describe("integración push: cierre de sesión", () => {
  const cerrarSesion = async () => {
    const { result } = await renderHook(() => useLogout());
    await act(async () => {
      await result.current();
    });
  };

  it("desregistra el token ANTES de borrar la sesión (con la sesión aún activa) y borra la conversación del chatbot", async () => {
    await iniciarSesion("jwt-A");
    backend.tokens.add(TOKEN_EXPO);
    useChatStore.getState().addMessage("user", "hola");

    await cerrarSesion();

    const baja = veces("delete", "/notifications/push/expo/unregister");
    expect(baja).toHaveLength(1);
    expect(baja[0]).toMatchObject({ cuerpo: { token: TOKEN_EXPO }, autorizacion: "Bearer jwt-A" });
    expect(backend.tokens.has(TOKEN_EXPO)).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("si el backend rechaza el desregistro, igual se cierra la sesión", async () => {
    await iniciarSesion("jwt-A");
    backend.fallos.set("delete /notifications/push/expo/unregister", { status: 500 });

    await cerrarSesion();

    expect(veces("delete", "/notifications/push/expo/unregister")).toHaveLength(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();
  });

  it("sin token de push en el dispositivo (sin projectId) no llama al backend pero cierra la sesión", async () => {
    proyectoEas.extra.eas.projectId = undefined;
    await iniciarSesion("jwt-A");

    await cerrarSesion();

    expect(backend.llamadas).toHaveLength(0);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("integración push: bandeja y preferencias (pantalla Notificaciones)", () => {
  const abrirBandeja = async () => {
    await iniciarSesion("jwt-A");
    await render(<NotificationsScreen />, { wrapper });
  };
  const interruptor = (nombre: string) => screen.getByLabelText(nombre);
  // En Android el Switch nativo expone `on` y `enabled`; en iOS, `value` y `disabled`.
  const encendido = (nombre: string) => {
    const p = interruptor(nombre).props;
    return p.value ?? p.on;
  };
  const deshabilitado = (nombre: string) => {
    const p = interruptor(nombre).props;
    return p.disabled ?? p.enabled === false;
  };

  it("sin sesión redirige al inicio de sesión y no pide nada al backend", async () => {
    await render(<NotificationsScreen />, { wrapper });

    expect(screen.getByText("redirige:/(auth)/login")).toBeTruthy();
    expect(backend.llamadas).toHaveLength(0);
  });

  it("carga la bandeja y las preferencias del servidor, con la sesión", async () => {
    await abrirBandeja();

    expect(await screen.findByText("Tu pedido está en camino")).toBeTruthy();
    expect(screen.getByText("Promoción de octubre")).toBeTruthy();
    expect(screen.getByText("2 sin leer")).toBeTruthy();
    await waitFor(() => expect(encendido("Correo electrónico")).toBe(true));
    expect(encendido("Notificaciones push")).toBe(false);
    expect(veces("get", "/notifications")[0].autorizacion).toBe("Bearer jwt-A");
  });

  it("cambiar una preferencia se ve al instante y se guarda con las dos (email y push) en el backend", async () => {
    backend.compuertaPreferencias = new Promise<void>((resolve) => (backend.soltarPreferencias = resolve));
    await abrirBandeja();
    await waitFor(() => expect(encendido("Correo electrónico")).toBe(true));

    await fireEvent(interruptor("Notificaciones push"), "valueChange", true);

    // Respuesta retenida: el interruptor ya cambió y el servidor todavía no.
    await waitFor(() => expect(encendido("Notificaciones push")).toBe(true));
    expect(backend.preferencias.push).toBe(false);

    await act(async () => {
      backend.soltarPreferencias?.();
    });
    await waitFor(() => expect(backend.preferencias).toEqual({ email: true, push: true }));
    expect(veces("put", "/notifications/preferences")[0].cuerpo).toEqual({ email: true, push: true });
  });

  it("si el servidor rechaza el cambio, el interruptor vuelve a su valor anterior y se muestra el mensaje", async () => {
    backend.fallos.set("put /notifications/preferences", { status: 500, message: "No se pudo guardar tu preferencia." });
    await abrirBandeja();
    await waitFor(() => expect(encendido("Correo electrónico")).toBe(true));

    await fireEvent(interruptor("Correo electrónico"), "valueChange", false);

    expect(await screen.findByText("No se pudo guardar tu preferencia.")).toBeTruthy();
    await waitFor(() => expect(encendido("Correo electrónico")).toBe(true));
    expect(backend.preferencias).toEqual({ email: true, push: false });
  });

  it("si no se pueden cargar las preferencias avisa y deja los interruptores deshabilitados", async () => {
    backend.fallos.set("get /notifications/preferences", { status: 500 });
    await abrirBandeja();

    expect(await screen.findByText("No pudimos cargar tus preferencias.")).toBeTruthy();
    expect(deshabilitado("Notificaciones push")).toBe(true);
    expect(veces("put", "/notifications/preferences")).toHaveLength(0);
  });

  it("tocar una notificación sin leer la marca como leída en el backend, baja el contador y abre su detalle", async () => {
    await abrirBandeja();
    await screen.findByText("2 sin leer");

    await fireEvent.press(
      screen.getByLabelText(/^Sin leer\. Pedido\. Tu pedido está en camino/),
    );

    await waitFor(() => expect(screen.getByText("1 sin leer")).toBeTruthy());
    expect(veces("put", "/notifications/1/read")).toHaveLength(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/notifications/[id]", params: { id: "1" } });
  });

  it("tocar una ya leída solo abre el detalle, sin pedir nada al backend", async () => {
    await abrirBandeja();
    await screen.findByText("Pedido entregado");

    await fireEvent.press(screen.getByLabelText(/^Pedido\. Pedido entregado/));

    expect(veces("put", "/notifications/3/read")).toHaveLength(0);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/notifications/[id]", params: { id: "3" } });
  });

  it("'Marcar todas como leídas' las marca en el backend y deja la bandeja al día", async () => {
    await abrirBandeja();
    await screen.findByText("2 sin leer");

    await fireEvent.press(screen.getByLabelText("Marcar todas como leídas"));

    expect(await screen.findByText("Todo al día")).toBeTruthy();
    expect(veces("put", "/notifications/read-all")).toHaveLength(1);
    expect(backend.notificaciones.every((n) => n.leida)).toBe(true);
  });

  it("si la bandeja falla (500) muestra el error con 'Reintentar' y, al recuperarse el servidor, carga", async () => {
    backend.fallos.set("get /notifications", { status: 500, message: "Error de conexión. Intenta de nuevo más tarde." });
    await abrirBandeja();

    expect(await screen.findByText("No pudimos cargar tus notificaciones")).toBeTruthy();
    expect(screen.getByText("Error de conexión. Intenta de nuevo más tarde.")).toBeTruthy();

    backend.fallos.clear();
    await fireEvent.press(screen.getByLabelText("Reintentar"));

    expect(await screen.findByText("Tu pedido está en camino")).toBeTruthy();
  });

  it("sin notificaciones muestra el estado vacío", async () => {
    backend.notificaciones = [];
    await abrirBandeja();

    expect(await screen.findByText("Sin notificaciones")).toBeTruthy();
  });
});
