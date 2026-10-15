import { getServiceImageUrl, getServicePrice } from "@/features/services/selectors";
import type { ServiceListItem } from "@/features/services/types";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const base = (over: Partial<ServiceListItem> = {}): ServiceListItem => ({ id: 1, nombre: "Servicio", ...over });

describe("getServiceImageUrl", () => {
  it("usa la imagen principal (URL absoluta) tal cual", () => {
    const s = base({ imagen_principal: "https://cdn.com/a.jpg" });
    expect(getServiceImageUrl(s)).toBe("https://cdn.com/a.jpg");
  });

  it("si no hay principal, usa la primera de la galería", () => {
    const s = base({ imagen_principal: null, imagenes: [{ url: "https://cdn.com/b.jpg" }] });
    expect(getServiceImageUrl(s)).toBe("https://cdn.com/b.jpg");
  });

  it("devuelve undefined si no hay ninguna imagen", () => {
    expect(getServiceImageUrl(base({ imagen_principal: null, imagenes: [] }))).toBeUndefined();
  });
});

describe("getServicePrice", () => {
  it("prefiere el precio final", () => {
    expect(getServicePrice(base({ precio_base: 100, precio_final: 80 }))).toBe(80);
  });

  it("usa el base si no hay final", () => {
    expect(getServicePrice(base({ precio_base: 100, precio_final: null }))).toBe(100);
  });

  it("devuelve null si no hay precio", () => {
    expect(getServicePrice(base({ precio_base: null, precio_final: null }))).toBeNull();
  });
});
