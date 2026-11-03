import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { makeApiError, makeUser } from "./fixtures";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const URL_API = "https://api.example.com/api";
const ENV_ORIGINAL = process.env.EXPO_PUBLIC_API_URL;
const DEV_ORIGINAL = (globalThis as { __DEV__?: boolean }).__DEV__;

/** Simula una compilación de producción (__DEV__ = false) o de desarrollo (true). */
const fijarDev = (valor: boolean) => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = valor;
};

/**
 * Carga client.ts y secureToken.ts del mismo registro de módulos (la URL se lee
 * al importar). Reemplaza el adapter de Axios por uno falso: los interceptores
 * corren de verdad, pero nunca sale una petición a la red.
 */
function cargarCliente(apiUrl?: string) {
  jest.resetModules();
  if (apiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = apiUrl;

  const client = jest.requireActual<typeof import("@/shared/api/client")>("@/shared/api/client");
  const token = jest.requireActual<typeof import("@/shared/api/secureToken")>(
    "@/shared/api/secureToken",
  );

  const peticiones: InternalAxiosRequestConfig[] = [];
  const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>(async (config) => {
    peticiones.push(config);
    return { data: makeUser(), status: 200, statusText: "OK", headers: {}, config } as AxiosResponse;
  });
  client.default.defaults.adapter = adapter;
  return { ...client, ...token, api: client.default, adapter, peticiones };
}

afterEach(() => {
  if (ENV_ORIGINAL === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = ENV_ORIGINAL;
  fijarDev(DEV_ORIGINAL ?? true);
  jest.restoreAllMocks();
});

describe("cliente HTTP: configuración", () => {
  it("usa EXPO_PUBLIC_API_URL como baseURL", () => {
    const { api, API_URL } = cargarCliente(URL_API);
    expect(API_URL).toBe(URL_API);
    expect(api.defaults.baseURL).toBe(URL_API);
  });

  it("en desarrollo cae a localhost:4000 con una advertencia si EXPO_PUBLIC_API_URL no está definida", () => {
    fijarDev(true);
    const aviso = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const { api } = cargarCliente(undefined);

    expect(api.defaults.baseURL).toBe("http://localhost:4000/api");
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(aviso.mock.calls[0][0]).toContain("EXPO_PUBLIC_API_URL");
  });

  it("en producción falla con un mensaje claro si EXPO_PUBLIC_API_URL no está definida", () => {
    fijarDev(false);

    expect(() => cargarCliente(undefined)).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(() => cargarCliente(undefined)).toThrow(/compilaci[oó]n/);
  });

  it("en producción trata una EXPO_PUBLIC_API_URL vacía o en blanco como ausente", () => {
    fijarDev(false);

    expect(() => cargarCliente("")).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(() => cargarCliente("   ")).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it("en producción con la variable definida usa su valor, sin advertencias", () => {
    fijarDev(false);
    const aviso = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const { api } = cargarCliente(URL_API);

    expect(api.defaults.baseURL).toBe(URL_API);
    expect(aviso).not.toHaveBeenCalled();
  });

  it("en desarrollo con la variable definida usa su valor, sin advertencias", () => {
    fijarDev(true);
    const aviso = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const { api } = cargarCliente(URL_API);

    expect(api.defaults.baseURL).toBe(URL_API);
    expect(aviso).not.toHaveBeenCalled();
  });

  it("corta las peticiones a los 15 segundos", () => {
    expect(cargarCliente(URL_API).api.defaults.timeout).toBe(15000);
  });

  it("identifica el canal móvil y envía JSON", () => {
    const { api } = cargarCliente(URL_API);
    expect(api.defaults.headers["X-Client"]).toBe("mobile");
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });
});

describe("cliente HTTP: interceptor de autenticación", () => {
  it("agrega Authorization: Bearer <JWT> cuando hay token", async () => {
    const { api, saveToken, peticiones } = cargarCliente(URL_API);
    await saveToken("jwt-123");

    await api.get("/auth/me");

    expect(peticiones[0].headers.Authorization).toBe("Bearer jwt-123");
  });

  it("no agrega Authorization cuando no hay token", async () => {
    const { api, peticiones } = cargarCliente(URL_API);

    await api.get("/catalog/categories");

    expect(peticiones[0].headers.Authorization).toBeUndefined();
  });

  it("deja de enviar el Bearer tras cerrar sesión", async () => {
    const { api, saveToken, clearToken, peticiones } = cargarCliente(URL_API);
    await saveToken("jwt-123");
    await clearToken();

    await api.get("/auth/me");

    expect(peticiones[0].headers.Authorization).toBeUndefined();
  });

  it("usa el token vigente en cada petición", async () => {
    const { api, saveToken, peticiones } = cargarCliente(URL_API);
    await saveToken("jwt-viejo");
    await api.get("/auth/me");
    await saveToken("jwt-nuevo");
    await api.get("/auth/me");

    expect(peticiones.map((p) => p.headers.Authorization)).toEqual([
      "Bearer jwt-viejo",
      "Bearer jwt-nuevo",
    ]);
  });

  it("combina baseURL y ruta en la petición", async () => {
    const { api, peticiones } = cargarCliente(URL_API);

    await api.get("/auth/me");

    expect(peticiones[0].baseURL).toBe(URL_API);
    expect(peticiones[0].url).toBe("/auth/me");
  });

  it("devuelve los datos de la respuesta", async () => {
    const { api } = cargarCliente(URL_API);

    const { data } = await api.get("/auth/me");

    expect(data).toEqual(makeUser());
  });

  it("propaga el error del servidor sin alterarlo", async () => {
    const { api, adapter } = cargarCliente(URL_API);
    const error = makeApiError({ status: 401, message: "Token inválido" });
    adapter.mockRejectedValueOnce(error);

    await expect(api.get("/auth/me")).rejects.toBe(error);
  });
});

describe("cliente HTTP: sesión caducada", () => {
  /** El adapter rechaza como lo hace Axios: el error lleva la `config` de la petición que lo causó. */
  const rechazar = (
    adapter: jest.Mock,
    status: number,
    message: string,
    antes?: () => Promise<void> | void,
  ) =>
    adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
      await antes?.();
      throw Object.assign(makeApiError({ status, message }), { config });
    });

  const RUTAS_PUBLICAS = [
    "/auth/login",
    "/auth/verify-2fa-login",
    "/auth/register",
    "/auth/verify-registration",
    "/auth/resend-code",
    "/auth/forgot-password",
    "/auth/verify-recovery",
    "/auth/reset-password",
  ];

  async function conSesion() {
    const cliente = cargarCliente(URL_API);
    await cliente.saveToken("jwt-actual");
    const caducada = jest.fn();
    cliente.setSessionExpiredHandler(caducada);
    return { ...cliente, caducada };
  }

  it("el texto del backend para un token caducado vive en una constante", () => {
    const { SESSION_EXPIRED_MESSAGE } = cargarCliente(URL_API);
    expect(SESSION_EXPIRED_MESSAGE).toBe("Token inválido o expirado");
  });

  it("un 401 de una petición con el token actual cierra la sesión y el error sigue llegando a quien llamó", async () => {
    const { api, adapter, caducada } = await conSesion();
    rechazar(adapter, 401, "Tu cuenta ha sido suspendida. Contacta al administrador.");

    await expect(api.get("/cart")).rejects.toMatchObject({ response: { status: 401 } });

    expect(caducada).toHaveBeenCalledTimes(1);
  });

  it("un 403 con «Token inválido o expirado» cierra la sesión", async () => {
    const { api, adapter, caducada, SESSION_EXPIRED_MESSAGE } = await conSesion();
    rechazar(adapter, 403, SESSION_EXPIRED_MESSAGE);

    await expect(api.get("/profile")).rejects.toMatchObject({ response: { status: 403 } });

    expect(caducada).toHaveBeenCalledTimes(1);
  });

  it("un 403 de otro tipo (por ejemplo, un rol sin permiso) no cierra la sesión", async () => {
    const { api, adapter, caducada } = await conSesion();
    rechazar(adapter, 403, "No tienes permisos para realizar esta acción");

    await expect(api.get("/profile")).rejects.toMatchObject({ response: { status: 403 } });

    expect(caducada).not.toHaveBeenCalled();
  });

  it.each(RUTAS_PUBLICAS)("un 401 en %s (credenciales o código incorrectos) no cierra la sesión", async (ruta) => {
    const { api, adapter, caducada } = await conSesion();
    rechazar(adapter, 401, "Correo o contraseña incorrectos.");

    await expect(api.post(ruta, {})).rejects.toMatchObject({ response: { status: 401 } });

    expect(caducada).not.toHaveBeenCalled();
  });

  it("un 403 en una ruta pública (acceso móvil denegado) no cierra la sesión aunque lleve el mensaje de token", async () => {
    const { api, adapter, caducada, SESSION_EXPIRED_MESSAGE } = await conSesion();
    rechazar(adapter, 403, SESSION_EXPIRED_MESSAGE);

    await expect(api.post("/auth/login", {})).rejects.toMatchObject({ response: { status: 403 } });

    expect(caducada).not.toHaveBeenCalled();
  });

  it("sin token (la petición no llevaba Authorization) no hay sesión que cerrar", async () => {
    const cliente = cargarCliente(URL_API);
    const caducada = jest.fn();
    cliente.setSessionExpiredHandler(caducada);
    rechazar(cliente.adapter, 401, "No autenticado");

    await expect(cliente.api.get("/cart")).rejects.toMatchObject({ response: { status: 401 } });

    expect(caducada).not.toHaveBeenCalled();
  });

  it("si mientras tanto se inició otra sesión (token distinto al enviado) no la cierra", async () => {
    const { api, adapter, caducada, saveToken } = await conSesion();
    rechazar(adapter, 403, "Token inválido o expirado", () => saveToken("jwt-nuevo"));

    await expect(api.get("/cart")).rejects.toMatchObject({ response: { status: 403 } });

    expect(caducada).not.toHaveBeenCalled();
  });

  it("tres peticiones en paralelo con el mismo token vencido cierran la sesión una sola vez", async () => {
    const { api, adapter, caducada } = await conSesion();
    // El cierre tarda: no libera el token, así que solo la bandera evita las repeticiones.
    caducada.mockReturnValue(new Promise(() => undefined));
    for (let i = 0; i < 3; i += 1) rechazar(adapter, 403, "Token inválido o expirado");

    await Promise.allSettled([api.get("/cart"), api.get("/profile"), api.get("/favorites")]);

    expect(caducada).toHaveBeenCalledTimes(1);
  });

  it("terminado el cierre, una sesión posterior que también caduca vuelve a cerrarse", async () => {
    const { api, adapter, caducada } = await conSesion();
    caducada.mockResolvedValue(undefined);
    rechazar(adapter, 403, "Token inválido o expirado");
    await expect(api.get("/cart")).rejects.toBeDefined();
    await new Promise((resolver) => setTimeout(resolver, 0));

    rechazar(adapter, 403, "Token inválido o expirado");
    await expect(api.get("/cart")).rejects.toBeDefined();

    expect(caducada).toHaveBeenCalledTimes(2);
  });

  it("un error sin `config` (no es de una petición) se propaga y no cierra la sesión", async () => {
    const { api, adapter, caducada } = await conSesion();
    const error = makeApiError({ status: 401, message: "sin config" });
    adapter.mockRejectedValueOnce(error);

    await expect(api.get("/cart")).rejects.toBe(error);

    expect(caducada).not.toHaveBeenCalled();
  });

  it("sin manejador registrado el error se propaga igual", async () => {
    const { api, adapter, setSessionExpiredHandler, saveToken } = cargarCliente(URL_API);
    await saveToken("jwt-actual");
    setSessionExpiredHandler(null);
    rechazar(adapter, 401, "No autenticado");

    await expect(api.get("/cart")).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("si el manejador falla, quien llamó recibe el error original de la petición", async () => {
    const { api, adapter, caducada } = await conSesion();
    caducada.mockImplementation(() => {
      throw new Error("falló el cierre");
    });
    rechazar(adapter, 403, "Token inválido o expirado");

    await expect(api.get("/cart")).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("una respuesta correcta no toca la sesión", async () => {
    const { api, caducada } = await conSesion();

    await api.get("/cart");

    expect(caducada).not.toHaveBeenCalled();
  });
});
