import { buildSceneViewerUrl, hasAnyModel, isARAvailable, selectProductModels } from "@/features/ar/selectors";
import type { Product3DModel } from "@/features/ar/types";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const modelo = (over: Partial<Product3DModel> = {}): Product3DModel => ({
  id: 1,
  url: "https://cdn.com/m.glb",
  formato: "glb",
  ...over,
});

describe("selectProductModels", () => {
  it("agrupa por formato (glb y usdz)", () => {
    const result = selectProductModels([
      modelo({ id: 1, formato: "glb", url: "https://cdn.com/a.glb" }),
      modelo({ id: 2, formato: "usdz", url: "https://cdn.com/a.usdz" }),
    ]);
    expect(result).toEqual({ glb: "https://cdn.com/a.glb", usdz: "https://cdn.com/a.usdz" });
  });

  it("normaliza el formato (GLB → glb, USDZ → usdz)", () => {
    const result = selectProductModels([
      modelo({ id: 1, formato: "GLB", url: "https://cdn.com/a.glb" }),
      modelo({ id: 2, formato: "USDZ", url: "https://cdn.com/a.usdz" }),
    ]);
    expect(result).toEqual({ glb: "https://cdn.com/a.glb", usdz: "https://cdn.com/a.usdz" });
  });

  it("si hay varios del mismo formato se queda con el primero", () => {
    const result = selectProductModels([
      modelo({ id: 1, formato: "glb", url: "https://cdn.com/a.glb" }),
      modelo({ id: 2, formato: "glb", url: "https://cdn.com/b.glb" }),
    ]);
    expect(result.glb).toBe("https://cdn.com/a.glb");
  });

  it("ignora modelos sin url válida", () => {
    const result = selectProductModels([modelo({ id: 1, formato: "glb", url: "" })]);
    expect(result).toEqual({});
  });

  it("ignora formatos no reconocidos", () => {
    const result = selectProductModels([modelo({ id: 1, formato: "fbx", url: "https://cdn.com/a.fbx" })]);
    expect(result).toEqual({});
  });

  it("sin modelos devuelve objeto vacío", () => {
    expect(selectProductModels([])).toEqual({});
  });
});

describe("isARAvailable", () => {
  it("iOS necesita usdz", () => {
    expect(isARAvailable({ usdz: "x.usdz" }, "ios")).toBe(true);
    expect(isARAvailable({ glb: "x.glb" }, "ios")).toBe(false);
  });

  it("Android necesita glb", () => {
    expect(isARAvailable({ glb: "x.glb" }, "android")).toBe(true);
    expect(isARAvailable({ usdz: "x.usdz" }, "android")).toBe(false);
  });

  it("web u otras plataformas: no hay RA", () => {
    expect(isARAvailable({ glb: "x.glb", usdz: "x.usdz" }, "web")).toBe(false);
  });

  it("sin modelos no hay RA", () => {
    expect(isARAvailable({}, "ios")).toBe(false);
    expect(isARAvailable({}, "android")).toBe(false);
  });
});

describe("hasAnyModel", () => {
  it("es verdadero si hay al menos un formato", () => {
    expect(hasAnyModel({ glb: "x.glb" })).toBe(true);
    expect(hasAnyModel({ usdz: "x.usdz" })).toBe(true);
    expect(hasAnyModel({ glb: "x.glb", usdz: "y.usdz" })).toBe(true);
  });

  it("es falso sin modelos", () => {
    expect(hasAnyModel({})).toBe(false);
  });
});

describe("buildSceneViewerUrl", () => {
  it("arma la URL con mode=ar_preferred y codifica el modelo", () => {
    const url = buildSceneViewerUrl("https://cdn.com/a b.glb");
    expect(url).toContain("https://arvr.google.com/scene-viewer/1.0?file=");
    expect(url).toContain(encodeURIComponent("https://cdn.com/a b.glb"));
    expect(url).toContain("mode=ar_preferred");
    expect(url).not.toContain("title=");
  });

  it("agrega el título cuando se proporciona", () => {
    const url = buildSceneViewerUrl("https://cdn.com/a.glb", "Cámara IP");
    expect(url).toContain("title=" + encodeURIComponent("Cámara IP"));
  });
});
