// Certificate pinning: qué dominio se fija, con qué llaves y cuándo se omite.
// La librería nativa se simula: en Jest, como en Expo Go, no existe el módulo nativo.
import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable,
  type ErrorListenerCallback,
} from "react-native-ssl-public-key-pinning";

jest.mock("react-native-ssl-public-key-pinning", () => ({
  addSslPinningErrorListener: jest.fn(),
  initializeSslPinning: jest.fn(),
  isSslPinningAvailable: jest.fn(),
}));
jest.mock("@/shared/api/client", () => ({ API_URL: "https://api.ejemplo.com/api" }));

const disponible = isSslPinningAvailable as jest.Mock;
const inicializar = initializeSslPinning as jest.Mock;
const escuchar = addSslPinningErrorListener as jest.Mock;

/** Módulo nuevo en cada prueba: el registro del listener es estado del módulo. */
const cargar = () => {
  let modulo!: typeof import("@/shared/api/sslPinning");
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require("@/shared/api/sslPinning");
  });
  return modulo;
};

const URL_PRODUCCION = "https://syscom-backend-production-dced.up.railway.app/api";

let aviso: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  disponible.mockReturnValue(true);
  inicializar.mockResolvedValue(undefined);
  aviso = jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  aviso.mockRestore();
});

describe("pinnedHost", () => {
  it.each([
    [URL_PRODUCCION, "syscom-backend-production-dced.up.railway.app"],
    ["https://API.Ejemplo.com:8443/api?x=1", "api.ejemplo.com"],
    ["  https://api.ejemplo.com  ", "api.ejemplo.com"],
  ])("con HTTPS fija el dominio de %s", (url, dominio) => {
    expect(cargar().pinnedHost(url)).toBe(dominio);
  });

  it.each(["http://192.168.0.111:4000/api", "http://localhost:4000/api", ""])(
    "sin HTTPS no fija nada (%s)",
    (url) => {
      expect(cargar().pinnedHost(url)).toBeNull();
    },
  );
});

describe("llaves fijadas", () => {
  it("son al menos dos, como exige iOS, y sin repetir", () => {
    const { API_PUBLIC_KEY_HASHES } = cargar();

    expect(API_PUBLIC_KEY_HASHES.length).toBeGreaterThanOrEqual(2);
    expect(new Set(API_PUBLIC_KEY_HASHES).size).toBe(API_PUBLIC_KEY_HASHES.length);
  });

  it("cada una es un SHA-256 en base64 (32 bytes)", () => {
    for (const hash of cargar().API_PUBLIC_KEY_HASHES) {
      expect(hash).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    }
  });

  it("se aplican solo al dominio de la API, sin subdominios", () => {
    const { pinningOptions, API_PUBLIC_KEY_HASHES } = cargar();

    expect(pinningOptions("api.ejemplo.com")).toEqual({
      "api.ejemplo.com": { includeSubdomains: false, publicKeyHashes: API_PUBLIC_KEY_HASHES },
    });
  });
});

describe("enableSslPinning", () => {
  it("activa el pinning para el dominio de la API configurada", async () => {
    const { enableSslPinning, pinningOptions } = cargar();

    await expect(enableSslPinning()).resolves.toBe("activo");

    expect(inicializar).toHaveBeenCalledWith(pinningOptions("api.ejemplo.com"));
  });

  it("con un backend local por HTTP no lo activa", async () => {
    await expect(cargar().enableSslPinning("http://192.168.0.111:4000/api")).resolves.toBe("sin-https");

    expect(inicializar).not.toHaveBeenCalled();
  });

  it("sin el módulo nativo (Expo Go) no lo activa ni rompe el arranque", async () => {
    disponible.mockReturnValue(false);

    await expect(cargar().enableSslPinning(URL_PRODUCCION)).resolves.toBe("no-disponible");

    expect(inicializar).not.toHaveBeenCalled();
  });

  it("si la librería falla, lo avisa y no lanza", async () => {
    inicializar.mockRejectedValueOnce(new Error("pin inválido"));

    await expect(cargar().enableSslPinning(URL_PRODUCCION)).resolves.toBe("error");

    expect(aviso).toHaveBeenCalled();
    expect(escuchar).not.toHaveBeenCalled();
  });

  it("registra un solo listener aunque se llame dos veces", async () => {
    const { enableSslPinning } = cargar();

    await enableSslPinning(URL_PRODUCCION);
    await enableSslPinning(URL_PRODUCCION);

    expect(inicializar).toHaveBeenCalledTimes(2);
    expect(escuchar).toHaveBeenCalledTimes(1);
  });

  it("una conexión rechazada se avisa con el dominio, sin datos de la petición", async () => {
    await cargar().enableSslPinning(URL_PRODUCCION);
    const listener = escuchar.mock.calls[0][0] as ErrorListenerCallback;

    listener({ serverHostname: "syscom-backend-production-dced.up.railway.app", message: "pin mismatch" });

    expect(aviso).toHaveBeenCalledWith(
      "Certificate pinning: se rechazó la conexión con syscom-backend-production-dced.up.railway.app",
    );
  });
});
