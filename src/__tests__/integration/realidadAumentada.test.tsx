// Integración de la Realidad Aumentada (HU #16), con servicios simulados:
// botón del detalle (ARButton) → useProductModels → modelsRepository → cliente Axios real
// (solo el adapter es falso) → pantalla del visor (Viewer3DScreen) con los parámetros que el
// botón pasó a la navegación. Se simulan los módulos nativos: WebView, expo-web-browser,
// Linking y expo-router. Nada sale a la red ni abre la cámara.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter, router } from "expo-router";

import ARButton from "@/features/ar/components/ARButton";
import Viewer3DScreen from "@/app/viewer3d";

import { makeApiError } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { ok, usarClientePorPrueba } from "../utils/integracion";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() },
  Stack: { Screen: () => null },
}));

jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));

// El visor real es un WebView con <model-viewer>: aquí solo se captura lo que recibe.
jest.mock("react-native-webview", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return { WebView: (props: object) => React.createElement(View, { testID: "webview", ...props }) };
});

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

const push = jest.fn();
const GLB = "https://cdn.example.com/laptop.glb";
const USDZ = "https://cdn.example.com/laptop.usdz";

type Respuesta = { modelos?: { id: number; url: string; formato: string }[]; status?: number };

/** Catálogo falso: modelos 3D por id de producto, con 404 y 500 reproducibles. */
const catalogo = new Map<number, Respuesta>();
let peticiones: { metodo?: string; ruta?: string; autorizacion?: unknown }[] = [];

beforeEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
  peticiones = [];
  catalogo.clear();
  (useRouter as jest.Mock).mockReturnValue({ push });
  (router.canGoBack as jest.Mock).mockReturnValue(true);
  jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  adapter.mockReset();
  adapter.mockImplementation(async (config) => {
    const coincide = /^\/catalog\/products\/(\d+)\/modelos-3d$/.exec(config.url ?? "");
    peticiones.push({ metodo: config.method, ruta: config.url, autorizacion: config.headers?.Authorization });
    const respuesta = coincide ? catalogo.get(Number(coincide[1])) : undefined;
    if (!respuesta) throw makeApiError({ status: 404, error: "Producto no encontrado" });
    if (respuesta.status && respuesta.status >= 400) {
      throw makeApiError({ status: respuesta.status, message: "Error del servidor" });
    }
    return ok(config, { data: respuesta.modelos ?? [] });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const modelos = (...formatos: [string, string][]) =>
  formatos.map(([formato, url], i) => ({ id: i + 1, url, formato }));

/** Espera a que la consulta de modelos salga y termine de resolverse (para casos donde no aparece nada). */
async function esperarConsulta(cantidad = 1) {
  await waitFor(() => expect(peticiones).toHaveLength(cantidad));
  await act(async () => {});
}

/** Pasa a la pantalla del visor los mismos parámetros que el botón mandó a la navegación. */
async function abrirVisorConLoQueMandoElBoton() {
  const destino = push.mock.calls[push.mock.calls.length - 1][0] as { pathname: string; params: Record<string, string> };
  (useLocalSearchParams as jest.Mock).mockReturnValue(destino.params);
  await render(<Viewer3DScreen />);
  return destino;
}

describe("integración AR: del botón al visor", () => {
  it("Android: botón → modelos del catálogo → visor con el modelo → Scene Viewer", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    catalogo.set(7, { modelos: modelos(["glb", GLB], ["usdz", USDZ]) });

    await render(<ARButton productId={7} productName="Lenovo ThinkPad" />, { wrapper });
    const boton = await screen.findByLabelText("Ver en Realidad Aumentada");

    // La petición es pública: va al catálogo, sin sesión y sin credenciales.
    expect(peticiones).toEqual([{ metodo: "get", ruta: "/catalog/products/7/modelos-3d", autorizacion: undefined }]);

    await fireEvent.press(boton);
    const destino = await abrirVisorConLoQueMandoElBoton();
    expect(destino).toEqual({
      pathname: "/viewer3d",
      params: { name: "Lenovo ThinkPad", glb: GLB, usdz: USDZ },
    });

    // El visor recibe el modelo: el HTML del WebView apunta al glb y deja el usdz para iOS.
    const html = screen.getByTestId("webview").props.source.html as string;
    expect(html).toContain(`src="${GLB}"`);
    expect(html).toContain(`ios-src="${USDZ}"`);

    await fireEvent.press(screen.getByLabelText("Ver en tu espacio con realidad aumentada"));

    const url = (Linking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith("https://arvr.google.com/scene-viewer/1.0?file=")).toBe(true);
    expect(url).toContain(`file=${encodeURIComponent(GLB)}`);
    expect(url).toContain("mode=ar_preferred");
    expect(url).toContain(`title=${encodeURIComponent("Lenovo ThinkPad")}`);
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it("iOS: el botón de RA abre Quick Look con el usdz en el navegador integrado", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    catalogo.set(7, { modelos: modelos(["glb", GLB], ["usdz", USDZ]) });

    await render(<ARButton productId={7} productName="Lenovo ThinkPad" />, { wrapper });
    await fireEvent.press(await screen.findByLabelText("Ver en Realidad Aumentada"));
    await abrirVisorConLoQueMandoElBoton();

    await fireEvent.press(screen.getByLabelText("Ver en tu espacio con realidad aumentada"));

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(USDZ);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("las rutas relativas del catálogo llegan al visor como URLs absolutas", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    catalogo.set(13, { modelos: modelos(["GLB", "/uploads/modelos/silla.glb"]) });

    await render(<ARButton productId={13} productName="Silla" />, { wrapper });
    await fireEvent.press(await screen.findByLabelText("Ver en Realidad Aumentada"));
    const { params } = await abrirVisorConLoQueMandoElBoton();

    expect(params.glb.startsWith("http")).toBe(true);
    expect(params.glb.endsWith("/uploads/modelos/silla.glb")).toBe(true);
    expect(screen.getByTestId("webview").props.source.html).toContain(`src="${params.glb}"`);
  });

  it.each([
    ["iOS con solo glb", "ios", [["glb", GLB]] as [string, string][]],
    ["Android con solo usdz", "android", [["usdz", USDZ]] as [string, string][]],
  ])("%s: se ve el modelo 3D pero no se ofrece 'Ver en tu espacio'", async (_caso, plataforma, formatos) => {
    jest.replaceProperty(Platform, "OS", plataforma as "ios" | "android");
    catalogo.set(7, { modelos: modelos(...formatos) });

    await render(<ARButton productId={7} productName="Laptop" />, { wrapper });
    await fireEvent.press(await screen.findByLabelText("Ver en Realidad Aumentada"));
    await abrirVisorConLoQueMandoElBoton();

    expect(screen.getByTestId("webview")).toBeTruthy();
    expect(screen.queryByLabelText("Ver en tu espacio con realidad aumentada")).toBeNull();
  });

  it("si la apertura de la RA falla, el visor sigue en pantalla sin romper", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error("No hay Scene Viewer"));
    catalogo.set(7, { modelos: modelos(["glb", GLB]) });

    await render(<ARButton productId={7} productName="Laptop" />, { wrapper });
    await fireEvent.press(await screen.findByLabelText("Ver en Realidad Aumentada"));
    await abrirVisorConLoQueMandoElBoton();

    await fireEvent.press(screen.getByLabelText("Ver en tu espacio con realidad aumentada"));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("webview")).toBeTruthy();
    expect(screen.getByLabelText("Ver en tu espacio con realidad aumentada")).toBeTruthy();
  });
});

describe("integración AR: sin modelos y errores de carga", () => {
  it("un producto sin modelos 3D no muestra el botón", async () => {
    catalogo.set(8, { modelos: [] });

    await render(<ARButton productId={8} productName="Mouse" />, { wrapper });
    await esperarConsulta();

    expect(peticiones).toHaveLength(1);
    expect(screen.queryByLabelText("Ver en Realidad Aumentada")).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("un producto que el catálogo no conoce (404) no muestra el botón", async () => {
    await render(<ARButton productId={99} productName="Fantasma" />, { wrapper });
    await esperarConsulta();

    expect(peticiones).toEqual([{ metodo: "get", ruta: "/catalog/products/99/modelos-3d", autorizacion: undefined }]);
    expect(screen.queryByLabelText("Ver en Realidad Aumentada")).toBeNull();
  });

  it("si la carga de modelos falla (500) no se ofrece el botón ni se rompe el detalle", async () => {
    catalogo.set(9, { status: 500 });

    await render(<ARButton productId={9} productName="Laptop" />, { wrapper });
    await esperarConsulta();

    expect(peticiones).toHaveLength(1);
    expect(screen.queryByLabelText("Ver en Realidad Aumentada")).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("la pantalla del visor sin modelo en los parámetros explica que no hay vista 3D y permite volver", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ name: "Laptop", glb: "", usdz: "" });
    await render(<Viewer3DScreen />);

    expect(screen.getByText("Sin vista 3D disponible")).toBeTruthy();
    expect(screen.queryByTestId("webview")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Volver"));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("sin historial de navegación, 'Volver' lleva a las pestañas", async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    await render(<Viewer3DScreen />);

    await fireEvent.press(screen.getByLabelText("Volver"));

    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("un segundo botón del mismo producto, montado después, reutiliza los modelos ya cargados: una sola petición", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    catalogo.set(7, { modelos: modelos(["glb", GLB]) });

    const { rerender } = await render(<ARButton productId={7} productName="Laptop" />, { wrapper });
    await screen.findByLabelText("Ver en Realidad Aumentada");

    await rerender(
      <>
        <ARButton productId={7} productName="Laptop" />
        <ARButton productId={7} productName="Laptop" />
      </>,
    );
    await act(async () => {});

    expect(screen.getAllByLabelText("Ver en Realidad Aumentada")).toHaveLength(2);
    expect(peticiones).toHaveLength(1);
  });
});
