// Integración del perfil y de Mi cuenta (HU #2, #4 y Mi cuenta): guarda de sesión, lectura y edición
// de los datos personales y cierre de sesión desde Mi cuenta, contra un servidor falso con estado.
// Piezas reales: las pantallas de profile, RequireAuth, useProfile, useUpdateProfile, useLogout,
// profileRepository, el cliente Axios con su interceptor Bearer (solo su adapter es falso),
// TanStack Query y los stores. Simulados: expo-router, expo-secure-store, expo-notifications y
// expo-constants. Sin red real, sin producción ni credenciales.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real.
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import PersonalDataScreen from "@/app/profile/personal-data";
import ProfileTab from "@/app/profile/index";
import { useChatStore } from "@/features/chatbot/chatStore";
import { getTokenSync } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearAxiosFalso } from "../utils/axiosFake";
import { instalarEnrutador } from "../utils/enrutadorServidores";
import { ok, usarClientePorPrueba } from "../utils/integracion";
import { crearServidorAuth, type ServidorAuth } from "../utils/servidorAuth";

const mockPush = jest.fn();

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return {
    useRouter: () => ({ push: mockPush }),
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirige a ${href}`),
  };
});
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
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
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { adapter } = crearAxiosFalso();
const { wrapper, cliente } = usarClientePorPrueba();

const CORREO = "ana@example.com";

let auth: ServidorAuth;
let enrutador: ReturnType<typeof instalarEnrutador>;
let desregistros: { token: unknown; autorizacion?: string }[];

/** Una sesión que ya existía: cuenta del servidor, token vigente y store con el usuario. */
async function conSesion(nombre = "Ana") {
  const cuenta = auth.agregarCuenta(CORREO, "Password1!", { nombre });
  const token = auth.emitirToken(CORREO);
  // Copia: el usuario del store no debe ser el mismo objeto que guarda el servidor falso.
  await useAuthStore.getState().setSession({ ...cuenta.user }, token);
  return { cuenta, token };
}

beforeEach(async () => {
  jest.clearAllMocks();
  adapter.mockReset();
  auth = crearServidorAuth();
  desregistros = [];
  // El backend de notificaciones no es parte de este flujo: solo se anota a quién se desregistra.
  const notificaciones = (config: { method?: string; url?: string; data?: unknown; headers?: Record<string, unknown> }) =>
    config.method === "delete" && config.url === "/notifications/push/expo/unregister"
      ? (desregistros.push({
          token: typeof config.data === "string" ? JSON.parse(config.data).token : undefined,
          autorizacion: config.headers?.Authorization as string | undefined,
        }),
        ok(config as never, { message: "Token desactivado" }))
      : undefined;
  enrutador = instalarEnrutador(adapter as never, [auth.manejar, notificaciones as never]);
  await reiniciarSesion();
  useChatStore.getState().reset();
});

describe("integración: guarda de sesión y Mi cuenta", () => {
  it("sin sesión, Mi cuenta redirige al login y no consulta el perfil", async () => {
    await render(<ProfileTab />, { wrapper });

    expect(screen.getByText("redirige a /(auth)/login")).toBeTruthy();
    expect(enrutador.peticiones).toHaveLength(0);
  });

  it("con sesión, saluda con el nombre que devuelve el servidor y la petición lleva el Bearer", async () => {
    const { token } = await conSesion("Ana");

    await render(<ProfileTab />, { wrapper });

    expect(await screen.findByText("¡Hola, Ana!")).toBeTruthy();
    expect(enrutador.de("GET", "/profile")[0].autorizacion).toBe(`Bearer ${token}`);
  });

  it("cerrar sesión: desregistra el token del dispositivo con la sesión aún vigente y luego la borra", async () => {
    const { token } = await conSesion();
    useChatStore.getState().addMessage("user", "Hola");
    await render(<ProfileTab />, { wrapper });
    await fireEvent.press(await screen.findByLabelText("Cerrar sesión"));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    // Primero el desregistro (necesita el Bearer), después se borra la sesión.
    expect(desregistros).toEqual([
      { token: "ExponentPushToken[dispositivo-de-prueba]", autorizacion: `Bearer ${token}` },
    ]);
    expect(getTokenSync()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("syscom.token");
    expect(useAuthStore.getState().user).toBeNull();
    // La conversación del chatbot es de esta cuenta: se borra.
    expect(useChatStore.getState().messages).toHaveLength(0);
    // La pantalla ya no tiene sesión: el guard la saca y no vuelve a pedir el perfil.
    expect(await screen.findByText("redirige a /(auth)/login")).toBeTruthy();
    expect(enrutador.de("GET", "/profile")).toHaveLength(1);
  });
});

describe("integración: datos personales", () => {
  it("muestra los datos del servidor en el formulario y el correo no es editable", async () => {
    await conSesion();

    await render(<PersonalDataScreen />, { wrapper });

    expect(await screen.findByDisplayValue("Ana")).toBeTruthy();
    expect(screen.getByDisplayValue("Pérez")).toBeTruthy();
    expect(screen.getByDisplayValue("López")).toBeTruthy();
    expect(screen.getByDisplayValue("7711234567")).toBeTruthy();
    expect(screen.getByLabelText(`Correo electrónico ${CORREO}, no se puede modificar`)).toBeTruthy();
  });

  it("editar y guardar: PUT con los campos nuevos, el servidor, la caché y el usuario de la sesión quedan al día", async () => {
    const { cuenta } = await conSesion();
    await render(<PersonalDataScreen />, { wrapper });
    await fireEvent.changeText(await screen.findByDisplayValue("Ana"), "Ana María");
    await fireEvent.changeText(screen.getByDisplayValue("7711234567"), "7717654321");

    await fireEvent.press(screen.getByText("Guardar cambios"));

    expect(await screen.findByText("Tus datos se actualizaron correctamente.")).toBeTruthy();
    expect(enrutador.de("PUT", "/profile")[0].cuerpo).toEqual({
      nombre: "Ana María",
      apellido_paterno: "Pérez",
      apellido_materno: "López",
      telefono: "7717654321",
    });
    expect(cuenta.perfil.nombre).toBe("Ana María");
    expect(cliente().getQueryData<{ nombre: string; telefono: string }>(["profile"])).toMatchObject({
      nombre: "Ana María",
      telefono: "7717654321",
    });
    expect(useAuthStore.getState().user).toMatchObject({ nombre: "Ana María", telefono: "7717654321" });
  });

  it("sin cambios el botón no envía nada", async () => {
    await conSesion();
    await render(<PersonalDataScreen />, { wrapper });
    await screen.findByDisplayValue("Ana");

    await fireEvent.press(screen.getByText("Guardar cambios"));

    expect(enrutador.de("PUT", "/profile")).toHaveLength(0);
  });

  it("un nombre demasiado corto se rechaza en la pantalla sin llamar al servidor", async () => {
    await conSesion();
    await render(<PersonalDataScreen />, { wrapper });
    await fireEvent.changeText(await screen.findByDisplayValue("Ana"), "An");

    await fireEvent.press(screen.getByText("Guardar cambios"));

    expect(await screen.findByText("El nombre debe tener al menos 3 caracteres")).toBeTruthy();
    expect(enrutador.de("PUT", "/profile")).toHaveLength(0);
  });

  it("si el servidor rechaza el guardado muestra su mensaje y no cambia la caché ni el usuario", async () => {
    // El perfil acepta de 3 a 40 caracteres en el nombre, igual que el registro: se parte de un nombre válido.
    const { cuenta } = await conSesion("Ana María");
    auth.fallarProxima("PUT /profile", {
      status: 400,
      message: "Ese teléfono ya está registrado en otra cuenta.",
      errors: [{ field: "telefono", message: "Ese teléfono ya está registrado en otra cuenta." }],
    });
    await render(<PersonalDataScreen />, { wrapper });
    await fireEvent.changeText(await screen.findByDisplayValue("7711234567"), "7717654321");

    await fireEvent.press(screen.getByText("Guardar cambios"));

    expect(await screen.findByText("Ese teléfono ya está registrado en otra cuenta.")).toBeTruthy();
    expect(screen.queryByText("Tus datos se actualizaron correctamente.")).toBeNull();
    expect(cuenta.perfil.telefono).toBe("7711234567");
    expect(cliente().getQueryData<{ telefono: string }>(["profile"])?.telefono).toBe("7711234567");
    expect(useAuthStore.getState().user?.telefono).toBe("7711234567");
  });

  it("si falla la carga ofrece reintentar y al reintentar muestra el formulario", async () => {
    await conSesion();
    auth.fallarProxima("GET /profile", { status: 500 });

    await render(<PersonalDataScreen />, { wrapper });
    expect(await screen.findByText("No pudimos cargar tus datos personales.")).toBeTruthy();

    await fireEvent.press(screen.getByText("Intentar de nuevo"));

    expect(await screen.findByDisplayValue("Ana")).toBeTruthy();
    expect(enrutador.de("GET", "/profile")).toHaveLength(2);
  });
});
