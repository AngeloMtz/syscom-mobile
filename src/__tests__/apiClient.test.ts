import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { makeApiError, makeUser } from "./fixtures";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const URL_API = "https://api.example.com/api";
const ENV_ORIGINAL = process.env.EXPO_PUBLIC_API_URL;

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
});

describe("cliente HTTP: configuración", () => {
  it("usa EXPO_PUBLIC_API_URL como baseURL", () => {
    const { api, API_URL } = cargarCliente(URL_API);
    expect(API_URL).toBe(URL_API);
    expect(api.defaults.baseURL).toBe(URL_API);
  });

  it("cae a localhost:4000 si EXPO_PUBLIC_API_URL no está definida", () => {
    const { api } = cargarCliente(undefined);
    expect(api.defaults.baseURL).toBe("http://localhost:4000/api");
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
