import { getPrincipalImageUrl, getTotalStock } from "@/features/catalog/selectors";
import { formatPrice } from "@/shared/utils/format";
import { makeProduct, makeProductImage, makeProductVariant } from "./fixtures";

const img = (id: number, url: string, es_principal: boolean) =>
  makeProductImage({ id, url, es_principal, orden: id });
const variante = (stock: number) => makeProductVariant({ stock });

describe("getPrincipalImageUrl", () => {
  it("prefiere la imagen marcada como principal", () => {
    const p = makeProduct({ imagenes: [img(1, "a.jpg", false), img(2, "b.jpg", true)] });
    expect(getPrincipalImageUrl(p)).toBe("b.jpg");
  });
  it("usa la primera si ninguna es principal", () => {
    expect(getPrincipalImageUrl({ imagenes: [img(1, "a.jpg", false)] })).toBe("a.jpg");
  });
  it("devuelve undefined si el producto no tiene imágenes", () => {
    expect(getPrincipalImageUrl({ imagenes: [] })).toBeUndefined();
  });
});

describe("getTotalStock", () => {
  it("suma el stock de todas las variantes", () => {
    expect(getTotalStock({ variantes: [variante(3), variante(4)] })).toBe(7);
  });
  it("es 0 sin variantes o con stock vacío", () => {
    expect(getTotalStock({ variantes: [] })).toBe(0);
    expect(getTotalStock({ variantes: [variante(0)] })).toBe(0);
  });
});

describe("formatPrice", () => {
  it("formatea pesos mexicanos con dos decimales", () => {
    const f = formatPrice(1234.5);
    expect(f).toContain("1,234.50");
    expect(f).toContain("$");
  });
});
