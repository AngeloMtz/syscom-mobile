// Integración del arranque de la app (HU #3 y #5): hidratación de la sesión y del onboarding en
// RootLayout, con almacenamiento simulado en memoria.
// Piezas reales: RootLayout, OnboardingFlow, authStore, onboardingStore, secureToken, el flag de
// onboarding, useMe, el cliente Axios con su interceptor Bearer (solo su adapter es falso) y
// TanStack Query. Simulados: expo-router (el Stack), expo-secure-store, AsyncStorage, Stripe y
// expo-notifications. Sin red real, sin producción ni credenciales.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real
// ni del dispositivo (splash, primer arranque nativo).
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";

import RootLayout from "@/app/_layout";
import { useMe } from "@/features/auth/hooks/useMe";
import { getTokenSync } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";
import { useOnboardingStore } from "@/shared/store/onboardingStore";

import { reiniciarSesion } from "../utils/authHooksSetup";
import { crearAxiosFalso } from "../utils/axiosFake";
import { instalarEnrutador } from "../utils/enrutadorServidores";
import { usarClientePorPrueba } from "../utils/integracion";
import { crearServidorAuth, type ServidorAuth } from "../utils/servidorAuth";

const mockSecure = new Map<string, string>();
const mockAsync = new Map<string, string>();
let mockLeerToken: (clave: string) => Promise<string | null>;
let mockAsyncFalla = false;

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  function Stack({ children }: { children?: unknown }) {
    return React.createElement(View, { testID: "navegacion" }, children);
  }
  function Pantalla() {
    return null;
  }
  Stack.Screen = Pantalla;
  return { Stack };
});
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(async (clave: string, valor: string) => {
    mockSecure.set(clave, valor);
  }),
  getItemAsync: jest.fn((clave: string) => mockLeerToken(clave)),
  deleteItemAsync: jest.fn(async (clave: string) => {
    mockSecure.delete(clave);
  }),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (clave: string) => {
      if (mockAsyncFalla) throw new Error("almacenamiento ilegible");
      return mockAsync.get(clave) ?? null;
    }),
    setItem: jest.fn(async (clave: string, valor: string) => {
      mockAsync.set(clave, valor);
    }),
    removeItem: jest.fn(async (clave: string) => {
      mockAsync.delete(clave);
    }),
  },
}));
jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: jest.fn(),
  StripeProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "denied", canAskAgain: false })),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

const CORREO = "ana@example.com";
const BANDERA = "onboarding_completed";
const CLAVE_TOKEN = "syscom.token";

let auth: ServidorAuth;
let enrutador: ReturnType<typeof instalarEnrutador>;

beforeEach(async () => {
  jest.clearAllMocks();
  mockSecure.clear();
  mockAsync.clear();
  mockAsyncFalla = false;
  mockLeerToken = async (clave) => mockSecure.get(clave) ?? null;
  adapter.mockReset();
  auth = crearServidorAuth();
  enrutador = instalarEnrutador(adapter as never, [auth.manejar]);
  await reiniciarSesion();
  mockSecure.clear();
  // Arranque en frío: ninguna de las dos lecturas ha terminado.
  useAuthStore.setState({ isHydrating: true });
  useOnboardingStore.setState({ isChecking: true, completed: false });
});

describe("integración: arranque de la app", () => {
  it("primer arranque: sin bandera ni token muestra la bienvenida, sin sesión y sin peticiones", async () => {
    await render(<RootLayout />);

    expect(await screen.findByText("Bienvenido a SYSCOM")).toBeTruthy();
    expect(screen.queryByTestId("navegacion")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(adapter).not.toHaveBeenCalled();
  });

  it("completar la bienvenida guarda la bandera, abre la navegación y al reabrir la app ya no aparece", async () => {
    await render(<RootLayout />);
    await fireEvent.press(await screen.findByText("Omitir"));

    expect(await screen.findByTestId("navegacion")).toBeTruthy();
    expect(mockAsync.get(BANDERA)).toBe("true");
    expect(screen.queryByText("Bienvenido a SYSCOM")).toBeNull();

    // "Cerrar y volver a abrir la app": la memoria se pierde, el almacenamiento no.
    await screen.unmount();
    useAuthStore.setState({ isHydrating: true });
    useOnboardingStore.setState({ isChecking: true, completed: false });
    await render(<RootLayout />);

    expect(await screen.findByTestId("navegacion")).toBeTruthy();
    expect(screen.queryByText("Bienvenido a SYSCOM")).toBeNull();
  });

  it("con un token guardado reconoce la sesión al abrir y el Bearer viaja en la primera petición", async () => {
    auth.agregarCuenta(CORREO, "Password1!");
    const token = auth.emitirToken(CORREO);
    mockSecure.set(CLAVE_TOKEN, token);
    mockAsync.set(BANDERA, "true");

    await render(<RootLayout />);
    expect(await screen.findByTestId("navegacion")).toBeTruthy();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getTokenSync()).toBe(token);
    // El usuario no se persiste: tras reiniciar hay token pero no objeto user hasta que useMe lo pide.
    expect(useAuthStore.getState().user).toBeNull();

    const me = await renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(me.result.current.data?.correo).toBe(CORREO));
    expect(enrutador.de("GET", "/auth/me")[0].autorizacion).toBe(`Bearer ${token}`);
    expect(useAuthStore.getState().user?.correo).toBe(CORREO);
  });

  it("sin token guardado no hay sesión y useMe no consulta al backend", async () => {
    mockAsync.set(BANDERA, "true");

    await render(<RootLayout />);
    expect(await screen.findByTestId("navegacion")).toBeTruthy();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();
    await renderHook(() => useMe(), { wrapper });
    expect(enrutador.peticiones).toHaveLength(0);
  });

  it("mientras se leen el token y la bandera no se pinta nada", async () => {
    mockAsync.set(BANDERA, "true");
    let liberar!: (token: string | null) => void;
    mockLeerToken = () => new Promise((resolver) => (liberar = resolver));

    await render(<RootLayout />);

    expect(screen.toJSON()).toBeNull();
    liberar(null);
    expect(await screen.findByTestId("navegacion")).toBeTruthy();
  });

  it("si el almacenamiento de la bandera falla, asume que ya la vio y no deja al usuario atrapado en la bienvenida", async () => {
    mockAsyncFalla = true;

    await render(<RootLayout />);

    expect(await screen.findByTestId("navegacion")).toBeTruthy();
    expect(screen.queryByText("Bienvenido a SYSCOM")).toBeNull();
  });

  it("si el almacén seguro falla al leer, la app abre sin sesión en vez de romperse", async () => {
    mockAsync.set(BANDERA, "true");
    mockLeerToken = async () => {
      throw new Error("keystore no disponible");
    };

    await render(<RootLayout />);

    expect(await screen.findByTestId("navegacion")).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
