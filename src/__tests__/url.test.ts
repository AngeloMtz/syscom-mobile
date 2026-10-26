import { API_URL } from "@/shared/api/client";
import { resolveAssetUrl } from "@/shared/utils/url";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Host del backend sin el sufijo /api, como lo arma resolveAssetUrl.
const HOST = API_URL.replace(/\/api\/?$/, "");

describe("resolveAssetUrl", () => {
  it("antepone el host a una ruta relativa que empieza con /", () => {
    expect(resolveAssetUrl("/uploads/x.png")).toBe(`${HOST}/uploads/x.png`);
  });

  it("antepone el host y la / a una ruta relativa sin barra inicial", () => {
    expect(resolveAssetUrl("uploads/x.png")).toBe(`${HOST}/uploads/x.png`);
  });

  it("deja intacta una URL absoluta http/https", () => {
    expect(resolveAssetUrl("https://cdn.cloudinary.com/x.png")).toBe("https://cdn.cloudinary.com/x.png");
    expect(resolveAssetUrl("http://ejemplo.com/y.png")).toBe("http://ejemplo.com/y.png");
  });

  it("devuelve undefined con cadena vacía o solo espacios", () => {
    expect(resolveAssetUrl("")).toBeUndefined();
    expect(resolveAssetUrl("   ")).toBeUndefined();
  });

  it("devuelve undefined con null o undefined", () => {
    expect(resolveAssetUrl(null)).toBeUndefined();
    expect(resolveAssetUrl(undefined)).toBeUndefined();
  });
});
