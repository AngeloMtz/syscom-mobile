// Integración de la autenticación (HU #2 y #3): registro, login, 2FA y recuperación de contraseña
// contra un servidor falso con estado (cuentas, códigos de correo y tokens).
// Piezas reales: las pantallas de (auth), los hooks, authRepository, el cliente Axios con su
// interceptor Bearer (solo su adapter es falso), TanStack Query y authStore/secureToken.
// Simulados: expo-router (navegación) y expo-secure-store. Sin red real, sin producción ni credenciales.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real.
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import AuthLayout from "@/app/(auth)/_layout";
import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import LoginScreen from "@/app/(auth)/login";
import RegisterScreen from "@/app/(auth)/register";
import ResetPasswordScreen from "@/app/(auth)/reset-password";
import VerifyCodeScreen from "@/app/(auth)/verify-code";
import { useMe } from "@/features/auth/hooks/useMe";
import { useCart } from "@/features/cart/hooks/useCart";
import { getTokenSync } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeRegisterPayload } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { crearTiendaEnrutable, instalarEnrutador } from "../utils/enrutadorServidores";
import { usarClientePorPrueba } from "../utils/integracion";
import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearServidorAuth, type ServidorAuth } from "../utils/servidorAuth";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    useLocalSearchParams: () => mockParams,
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirige a ${href}`),
    Stack: () => React.createElement(Text, null, "navegación de sesión"),
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
const PASSWORD = "Password1!";

let auth: ServidorAuth;
let enrutador: ReturnType<typeof instalarEnrutador>;

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  adapter.mockReset();
  auth = crearServidorAuth();
  const tienda = crearTiendaEnrutable([{ id: 7, nombre: "Mouse inalámbrico", precio: 250, stock: 10 }]);
  enrutador = instalarEnrutador(adapter as never, [auth.manejar, tienda.manejador]);
  await reiniciarSesion();
});

const escribir = (placeholder: string, texto: string) =>
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), texto);

const tocar = (texto: string) => fireEvent.press(screen.getByText(texto));

/** El campo del código de 6 dígitos es el único TextInput de la pantalla y no tiene etiqueta. */
const escribirCodigo = (codigo: string) => fireEvent.changeText(screen.getByDisplayValue(""), codigo);

async function iniciarSesion(correo: string, password: string) {
  await render(<LoginScreen />, { wrapper });
  await escribir("tu@email.com", correo);
  await escribir("Tu contraseña", password);
  await tocar("Iniciar sesión");
}

describe("integración: inicio de sesión", () => {
  it("login sin 2FA: la sesión nace, el token se guarda y el Bearer viaja a perfil y carrito", async () => {
    auth.agregarCuenta(CORREO, PASSWORD);
    const layout = await render(<AuthLayout />, { wrapper });
    expect(screen.getByText("navegación de sesión")).toBeTruthy();
    await layout.unmount();

    await iniciarSesion(CORREO, PASSWORD);

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    const token = auth.tokenDe(CORREO) as string;
    expect(enrutador.de("POST", "/auth/login")[0].cuerpo).toEqual({ correo: CORREO, password: PASSWORD });
    expect(getTokenSync()).toBe(token);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("syscom.token", token);
    // Sin 2FA no hay segunda pantalla: la navegación la hace el guard de (auth).
    expect(mockPush).not.toHaveBeenCalled();

    await screen.unmount();
    await render(<AuthLayout />, { wrapper });
    expect(screen.getByText("redirige a /(tabs)")).toBeTruthy();

    // La sesión recién creada alcanza a otros módulos con el mismo cliente.
    const me = await renderHook(() => ({ me: useMe(), cart: useCart() }), { wrapper });
    await waitFor(() => expect(me.result.current.me.data?.correo).toBe(CORREO));
    await waitFor(() => expect(me.result.current.cart.isSuccess).toBe(true));
    expect(enrutador.de("GET", "/auth/me")[0].autorizacion).toBe(`Bearer ${token}`);
    expect(enrutador.de("GET", "/cart")[0].autorizacion).toBe(`Bearer ${token}`);
    expect(useAuthStore.getState().user?.correo).toBe(CORREO);
  });

  it("con un correo mal escrito no sale ninguna petición", async () => {
    await iniciarSesion("correo-sin-arroba", PASSWORD);

    expect(await screen.findByText("Formato de correo inválido")).toBeTruthy();
    expect(adapter).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("credenciales incorrectas: muestra el mensaje del servidor y no deja sesión ni token", async () => {
    auth.agregarCuenta(CORREO, PASSWORD);

    await iniciarSesion(CORREO, "OtraClave9!");

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("cuenta sin verificar: el servidor lo rechaza y la app lo explica sin crear sesión", async () => {
    await render(<RegisterScreen />, { wrapper });
    await llenarRegistro();
    // Se crea la cuenta pero nunca se confirma el código.
    await screen.unmount();

    await iniciarSesion(CORREO, PASSWORD);

    expect(await screen.findByText("Verifica tu correo antes de iniciar sesión.")).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("demasiados intentos (429 sin mensaje): la app explica que hay que esperar", async () => {
    auth.agregarCuenta(CORREO, PASSWORD);
    auth.fallarProxima("POST /auth/login", { status: 429 });

    await iniciarSesion(CORREO, PASSWORD);

    expect(
      await screen.findByText("Demasiados intentos. Espera unos minutos antes de volver a intentarlo."),
    ).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("integración: 2FA", () => {
  it("login con 2FA → pantalla de código → sesión: no hay sesión hasta confirmar el código", async () => {
    auth.agregarCuenta(CORREO, PASSWORD, { dosFactores: true });

    await iniciarSesion(CORREO, PASSWORD);

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/verify-code",
      params: { correo: CORREO, tipo: "2fa" },
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();

    // La pantalla siguiente recibe los parámetros que dejó la anterior.
    await screen.unmount();
    mockParams = mockPush.mock.calls[0][0].params;
    await render(<VerifyCodeScreen />, { wrapper });
    await escribirCodigo(auth.ultimoCodigo(CORREO, "2fa_login"));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(enrutador.de("POST", "/auth/verify-2fa-login")[0].cuerpo).toEqual({
      correo: CORREO,
      code: expect.stringMatching(/^\d{6}$/),
    });
    expect(getTokenSync()).toBe(auth.tokenDe(CORREO));
  });

  it("código incorrecto: se explica, el campo se vacía, no hay sesión y el correcto sí entra", async () => {
    auth.agregarCuenta(CORREO, PASSWORD, { dosFactores: true });
    await iniciarSesion(CORREO, PASSWORD);
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    await screen.unmount();
    mockParams = mockPush.mock.calls[0][0].params;
    await render(<VerifyCodeScreen />, { wrapper });

    await escribirCodigo("000000");

    expect(await screen.findByText("El código no es válido o ya expiró.")).toBeTruthy();
    expect(screen.getByDisplayValue("")).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();

    await escribirCodigo(auth.ultimoCodigo(CORREO, "2fa_login"));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
  });
});

async function llenarRegistro(payload = makeRegisterPayload({ correo: CORREO, password: PASSWORD, confirmPassword: PASSWORD })) {
  await escribir("Juan", payload.nombre);
  await escribir("García", payload.apellido_paterno);
  await escribir("López", payload.apellido_materno);
  await escribir("tu@email.com", payload.correo);
  await escribir("7711234567", payload.telefono);
  await escribir("Crea una contraseña", payload.password);
  await escribir("Repite la contraseña", payload.confirmPassword);
  await tocar("Acepto los Términos y Condiciones de uso del servicio");
  await fireEvent.press(screen.getAllByText("Crear cuenta").at(-1) as never);
  await waitFor(() => expect(mockReplace.mock.calls.length + screen.queryAllByText(/ya está registrado/).length).toBeGreaterThan(0));
}

describe("integración: registro", () => {
  it("registro → código del correo → la cuenta se activa y la sesión nace sin pasar por el login", async () => {
    await render(<RegisterScreen />, { wrapper });
    await llenarRegistro();

    expect(enrutador.de("POST", "/auth/register")[0].cuerpo).toEqual(
      makeRegisterPayload({ correo: CORREO, password: PASSWORD, confirmPassword: PASSWORD }),
    );
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(auth)/verify-code",
      params: { correo: CORREO, tipo: "registro" },
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(auth.cuentas.get(CORREO)?.activa).toBe(false);

    await screen.unmount();
    mockParams = mockReplace.mock.calls[0][0].params;
    await render(<VerifyCodeScreen />, { wrapper });
    await escribirCodigo(auth.ultimoCodigo(CORREO, "registration"));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(auth.cuentas.get(CORREO)?.activa).toBe(true);
    expect(getTokenSync()).toBe(auth.tokenDe(CORREO));
  });

  it("correo ya registrado: muestra el mensaje del servidor y no pasa a la verificación", async () => {
    auth.agregarCuenta(CORREO, PASSWORD);
    await render(<RegisterScreen />, { wrapper });

    await llenarRegistro();

    expect(await screen.findByText("Ese correo ya está registrado.")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("reenviar el código: se habilita a los 60 s, pide el tipo correcto y el código anterior deja de servir", async () => {
    jest.useFakeTimers();
    try {
      await render(<RegisterScreen />, { wrapper });
      await llenarRegistro();
      await screen.unmount();
      mockParams = mockReplace.mock.calls[0][0].params;
      const anterior = auth.ultimoCodigo(CORREO, "registration");

      await render(<VerifyCodeScreen />, { wrapper });
      expect(screen.getByText("Reenviar en 60s")).toBeTruthy();
      // La cuenta atrás reprograma su temporizador en cada render: se avanza un segundo a la vez.
      for (let segundo = 0; segundo < 60; segundo += 1) {
        await act(async () => {
          await jest.advanceTimersByTimeAsync(1000);
        });
      }
      await tocar("Reenviar código");

      expect(await screen.findByText("Te enviamos un código nuevo.")).toBeTruthy();
      expect(enrutador.de("POST", "/auth/resend-code")[0].cuerpo).toEqual({ correo: CORREO, type: "registration" });
      const nuevo = auth.ultimoCodigo(CORREO, "registration");
      expect(nuevo).not.toBe(anterior);

      await escribirCodigo(anterior);
      expect(await screen.findByText("El código no es válido o ya expiró.")).toBeTruthy();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      await escribirCodigo(nuevo);
      await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("integración: recuperación de contraseña", () => {
  it("correo → código → contraseña nueva: la clave anterior deja de servir y la nueva inicia sesión", async () => {
    auth.agregarCuenta(CORREO, PASSWORD);

    await render(<ForgotPasswordScreen />, { wrapper });
    await escribir("tu@email.com", CORREO);
    await tocar("Enviar código");
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(enrutador.de("POST", "/auth/forgot-password")[0].cuerpo).toEqual({ correo: CORREO, method: "code" });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/verify-code",
      params: { correo: CORREO, tipo: "recuperacion" },
    });

    await screen.unmount();
    mockParams = mockPush.mock.calls[0][0].params;
    await render(<VerifyCodeScreen />, { wrapper });
    const codigo = auth.ultimoCodigo(CORREO, "password_reset");
    await escribirCodigo(codigo);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(auth)/reset-password",
      params: { correo: CORREO, code: codigo },
    });
    // Verificar el código no inicia sesión.
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    await screen.unmount();
    mockParams = mockReplace.mock.calls[0][0].params;
    await render(<ResetPasswordScreen />, { wrapper });
    await escribir("Crea una contraseña", "NuevaClave2@");
    await escribir("Repite la contraseña", "NuevaClave2@");
    await tocar("Guardar contraseña");
    expect(await screen.findByText("Contraseña actualizada")).toBeTruthy();
    expect(enrutador.de("POST", "/auth/reset-password")[0].cuerpo).toEqual({
      correo: CORREO,
      code: codigo,
      newPassword: "NuevaClave2@",
      confirmPassword: "NuevaClave2@",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    await screen.unmount();
    await iniciarSesion(CORREO, PASSWORD);
    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeTruthy();

    await screen.unmount();
    await iniciarSesion(CORREO, "NuevaClave2@");
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
  });

  it("código de recuperación incorrecto: no avanza a la contraseña nueva", async () => {
    auth.agregarCuenta(CORREO, PASSWORD);
    await render(<ForgotPasswordScreen />, { wrapper });
    await escribir("tu@email.com", CORREO);
    await tocar("Enviar código");
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    await screen.unmount();
    mockParams = mockPush.mock.calls[0][0].params;
    await render(<VerifyCodeScreen />, { wrapper });

    await escribirCodigo("000000");

    expect(await screen.findByText("El código no es válido o ya expiró.")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(enrutador.de("POST", "/auth/reset-password")).toHaveLength(0);
  });
});
