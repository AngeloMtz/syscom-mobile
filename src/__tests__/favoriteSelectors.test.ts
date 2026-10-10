import {
  applyFavoriteChange,
  dedupeFavorites,
  favoriteIds,
  isFavorite,
  parsePrice,
  toFavoriteCardData,
  toFavoriteProduct,
} from "@/features/favorites/favoriteSelectors";

import {
  makeFavoriteItem,
  makeFavoriteItemFor,
  makeFavoriteProduct,
  makeFavoritesResult,
  makeProduct,
  makeProductImage,
} from "./fixtures";

describe("parsePrice", () => {
  it("acepta un número", () => {
    expect(parsePrice(7200)).toBe(7200);
    expect(parsePrice(0)).toBe(0);
  });
  it("convierte un texto numérico (Decimal serializado)", () => {
    expect(parsePrice("7200")).toBe(7200);
    expect(parsePrice("7200.50")).toBe(7200.5);
    expect(parsePrice(" 15.5 ")).toBe(15.5);
  });
  it.each([null, undefined, "", "  ", "abc", "12abc", NaN, Infinity, {}, []])(
    "devuelve null para %p",
    (valor) => {
      expect(parsePrice(valor)).toBeNull();
    },
  );
});

describe("toFavoriteCardData", () => {
  it("arma los datos de la tarjeta con precio numérico", () => {
    const item = makeFavoriteItem({
      productos: makeFavoriteProduct({ id_producto: 5, nombre: "Mouse", precio_base: 250, envio_gratis: true }),
    });
    expect(toFavoriteCardData(item)).toEqual({
      id: 5,
      nombre: "Mouse",
      marca: "HP",
      precio: 250,
      imagenUrl: "https://example.com/producto-1.jpg",
      envioGratis: true,
      disponible: true,
    });
  });
  it("convierte el precio cuando llega como texto", () => {
    const item = makeFavoriteItem({ productos: makeFavoriteProduct({ precio_base: "7200.00" }) });
    expect(toFavoriteCardData(item).precio).toBe(7200);
  });
  it("deja el precio en null si no es válido", () => {
    const item = makeFavoriteItem({ productos: makeFavoriteProduct({ precio_base: "n/d" }) });
    expect(toFavoriteCardData(item).precio).toBeNull();
  });
  it("tolera marca e imágenes ausentes", () => {
    const item = makeFavoriteItem({
      productos: makeFavoriteProduct({ marcas: null, producto_imagenes: [] }),
    });
    const data = toFavoriteCardData(item);
    expect(data.marca).toBeNull();
    expect(data.imagenUrl).toBeUndefined();
  });
  it("marca como no disponible un producto que ya no está activo", () => {
    const item = makeFavoriteItem({ productos: makeFavoriteProduct({ estado: "inactivo" }) });
    expect(toFavoriteCardData(item).disponible).toBe(false);
  });
});

describe("toFavoriteProduct", () => {
  it("convierte un producto de listado a la forma del favorito", () => {
    const p = makeProduct({
      id: 9,
      nombre: "Teclado",
      slug: "teclado",
      precio_base: 300,
      envio_gratis: true,
      marca: { id: 1, nombre: "Acer", slug: "acer", logo_url: null },
      imagenes: [
        makeProductImage({ id: 1, url: "https://x/a.jpg", es_principal: false }),
        makeProductImage({ id: 2, url: "https://x/b.jpg", es_principal: true }),
      ],
    });
    expect(toFavoriteProduct(p)).toEqual({
      id_producto: 9,
      nombre: "Teclado",
      slug: "teclado",
      precio_base: 300,
      estado: "activo",
      envio_gratis: true,
      marcas: { nombre: "Acer", slug: "acer" },
      producto_imagenes: [{ url_imagen: "https://x/b.jpg" }],
    });
  });
  it("sin marca ni imágenes deja marcas en null y la lista vacía", () => {
    const p = makeProduct({ marca: null, imagenes: [] });
    const f = toFavoriteProduct(p);
    expect(f.marcas).toBeNull();
    expect(f.producto_imagenes).toEqual([]);
  });
});

describe("dedupeFavorites", () => {
  it("conserva el primero de cada producto y el orden", () => {
    const items = [makeFavoriteItemFor(1), makeFavoriteItemFor(2), makeFavoriteItemFor(1, { nombre: "Repetido" })];
    const result = dedupeFavorites(items);
    expect(result.map((i) => i.productos.id_producto)).toEqual([1, 2]);
    expect(result[0].productos.nombre).not.toBe("Repetido");
  });
  it("devuelve lista vacía con lista vacía", () => {
    expect(dedupeFavorites([])).toEqual([]);
  });
});

describe("favoriteIds / isFavorite", () => {
  it("lista los ids de producto", () => {
    expect(favoriteIds([makeFavoriteItemFor(3), makeFavoriteItemFor(8)])).toEqual([3, 8]);
  });
  it("isFavorite indica si el id está en la lista", () => {
    expect(isFavorite([3, 8], 8)).toBe(true);
    expect(isFavorite([3, 8], 4)).toBe(false);
    expect(isFavorite([], 1)).toBe(false);
  });
});

describe("applyFavoriteChange", () => {
  const nuevo = makeFavoriteProduct({ id_producto: 20, nombre: "Nuevo" });

  it("agrega al inicio y suma al total", () => {
    const actual = makeFavoritesResult({ items: [makeFavoriteItemFor(1)], total: 1 });
    const result = applyFavoriteChange(actual, nuevo, true);
    expect(result.items.map((i) => i.productos.id_producto)).toEqual([20, 1]);
    expect(result.total).toBe(2);
  });
  it("no duplica si el producto ya estaba", () => {
    const actual = makeFavoritesResult({ items: [makeFavoriteItemFor(20)], total: 1 });
    const result = applyFavoriteChange(actual, nuevo, true);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
  it("quita el producto y resta del total", () => {
    const actual = makeFavoritesResult({ items: [makeFavoriteItemFor(1), makeFavoriteItemFor(20)], total: 2 });
    const result = applyFavoriteChange(actual, nuevo, false);
    expect(result.items.map((i) => i.productos.id_producto)).toEqual([1]);
    expect(result.total).toBe(1);
  });
  it("al quitar un producto que no estaba no cambia el total", () => {
    const actual = makeFavoritesResult({ items: [makeFavoriteItemFor(1)], total: 1 });
    expect(applyFavoriteChange(actual, nuevo, false).total).toBe(1);
  });
  it("sin datos previos parte de una lista vacía", () => {
    const result = applyFavoriteChange(undefined, nuevo, true);
    expect(result).toMatchObject({ total: 1, truncated: false });
    expect(result.items).toHaveLength(1);
  });
  it("no modifica el resultado recibido", () => {
    const actual = makeFavoritesResult({ items: [makeFavoriteItemFor(1)], total: 1 });
    applyFavoriteChange(actual, nuevo, true);
    expect(actual.items).toHaveLength(1);
    expect(actual.total).toBe(1);
  });
});
