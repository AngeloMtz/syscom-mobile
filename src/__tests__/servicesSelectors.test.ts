import { getServiceGalleryUrls, getServiceImageUrl, getServicePrice } from "@/features/services/selectors";
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

describe("getServiceGalleryUrls", () => {
  it("pone la imagen principal al frente y el resto después", () => {
    const s = base({
      imagen_principal: "https://cdn.com/p.jpg",
      imagenes: [{ url: "https://cdn.com/a.jpg" }, { url: "https://cdn.com/b.jpg" }],
    });
    expect(getServiceGalleryUrls(s)).toEqual([
      "https://cdn.com/p.jpg",
      "https://cdn.com/a.jpg",
      "https://cdn.com/b.jpg",
    ]);
  });

  it("no repite la principal si ya está en la galería", () => {
    const s = base({
      imagen_principal: "https://cdn.com/a.jpg",
      imagenes: [{ url: "https://cdn.com/a.jpg" }, { url: "https://cdn.com/b.jpg" }],
    });
    expect(getServiceGalleryUrls(s)).toEqual(["https://cdn.com/a.jpg", "https://cdn.com/b.jpg"]);
  });

  it("quita imágenes repetidas y las que no tienen url", () => {
    const s = base({
      imagen_principal: null,
      imagenes: [{ url: "https://cdn.com/a.jpg" }, { url: "https://cdn.com/a.jpg" }, { url: "" }],
    });
    expect(getServiceGalleryUrls(s)).toEqual(["https://cdn.com/a.jpg"]);
  });

  it("sin imágenes devuelve lista vacía", () => {
    expect(getServiceGalleryUrls(base({ imagen_principal: null, imagenes: [] }))).toEqual([]);
    expect(getServiceGalleryUrls(base())).toEqual([]);
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
