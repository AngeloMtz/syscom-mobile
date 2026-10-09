import {
  cleanDescription,
  formatStock,
  getDiscountInfo,
  getGalleryImageUrls,
  getVisibleAttributes,
  isProductSoldOut,
  isVariantAvailable,
  parseProductId,
  pickInitialVariant,
} from "@/features/catalog/productDetail";

import {
  makeProduct,
  makeProductAttribute,
  makeProductImage,
  makeProductVariant,
} from "./fixtures";

describe("parseProductId", () => {
  it("convierte un texto numérico en entero positivo", () => {
    expect(parseProductId("12")).toBe(12);
  });
  it("toma el primer valor si llega un arreglo", () => {
    expect(parseProductId(["7", "8"])).toBe(7);
  });
  it.each([undefined, "", "abc", "0", "-3", "1.5", "12abc", " "])(
    "devuelve null para %p",
    (raw) => {
      expect(parseProductId(raw as string | undefined)).toBeNull();
    },
  );
});

describe("isVariantAvailable", () => {
  it("es true con variante activa y stock", () => {
    expect(isVariantAvailable(makeProductVariant({ stock: 1 }))).toBe(true);
  });
  it("es false sin stock o con stock negativo", () => {
    expect(isVariantAvailable(makeProductVariant({ stock: 0 }))).toBe(false);
    expect(isVariantAvailable(makeProductVariant({ stock: -2 }))).toBe(false);
  });
  it("es false si la variante no está activa", () => {
    expect(isVariantAvailable(makeProductVariant({ estado: "inactiva", stock: 5 }))).toBe(false);
  });
});

describe("pickInitialVariant", () => {
  it("elige la primera variante disponible", () => {
    const variantes = [
      makeProductVariant({ id: 1, stock: 0 }),
      makeProductVariant({ id: 2, stock: 3 }),
      makeProductVariant({ id: 3, stock: 9 }),
    ];
    expect(pickInitialVariant(variantes)?.id).toBe(2);
  });
  it("devuelve null si ninguna está disponible", () => {
    expect(pickInitialVariant([makeProductVariant({ stock: 0 })])).toBeNull();
  });
  it("devuelve null sin variantes", () => {
    expect(pickInitialVariant([])).toBeNull();
  });
});

describe("isProductSoldOut", () => {
  it("es false si alguna variante está disponible", () => {
    const p = makeProduct({
      variantes: [makeProductVariant({ id: 1, stock: 0 }), makeProductVariant({ id: 2, stock: 1 })],
    });
    expect(isProductSoldOut(p)).toBe(false);
  });
  it("es true si todas están sin stock", () => {
    expect(isProductSoldOut(makeProduct({ variantes: [makeProductVariant({ stock: 0 })] }))).toBe(true);
  });
  it("es true sin variantes", () => {
    expect(isProductSoldOut(makeProduct({ variantes: [] }))).toBe(true);
  });
});

describe("getGalleryImageUrls", () => {
  it("pone la principal primero y el resto por orden", () => {
    const imagenes = [
      makeProductImage({ id: 1, url: "https://x/a.jpg", es_principal: false, orden: 2 }),
      makeProductImage({ id: 2, url: "https://x/b.jpg", es_principal: false, orden: 1 }),
      makeProductImage({ id: 3, url: "https://x/c.jpg", es_principal: true, orden: 3 }),
    ];
    expect(getGalleryImageUrls(imagenes)).toEqual([
      "https://x/c.jpg",
      "https://x/b.jpg",
      "https://x/a.jpg",
    ]);
  });
  it("descarta URLs vacías", () => {
    const imagenes = [makeProductImage({ url: "" }), makeProductImage({ id: 2, url: "https://x/a.jpg" })];
    expect(getGalleryImageUrls(imagenes)).toEqual(["https://x/a.jpg"]);
  });
  it("devuelve lista vacía sin imágenes o con valor ausente", () => {
    expect(getGalleryImageUrls([])).toEqual([]);
    expect(getGalleryImageUrls(undefined)).toEqual([]);
  });
  it("no modifica el arreglo recibido", () => {
    const imagenes = [
      makeProductImage({ id: 1, es_principal: false, orden: 2 }),
      makeProductImage({ id: 2, es_principal: true, orden: 1 }),
    ];
    getGalleryImageUrls(imagenes);
    expect(imagenes.map((i) => i.id)).toEqual([1, 2]);
  });
});

describe("formatStock", () => {
  it("describe agotado, una unidad y varias", () => {
    expect(formatStock(0)).toBe("Agotado");
    expect(formatStock(-1)).toBe("Agotado");
    expect(formatStock(1)).toBe("1 disponible");
    expect(formatStock(5)).toBe("5 disponibles");
  });
});

describe("getDiscountInfo", () => {
  it("devuelve el precio anterior y el porcentaje con promoción", () => {
    const p = makeProduct({ en_promocion: true, precio_base: 1000, precio_final: 800, porcentaje_descuento: 20 });
    expect(getDiscountInfo(p)).toEqual({ precioAnterior: 1000, porcentaje: 20 });
  });
  it("redondea el porcentaje", () => {
    const p = makeProduct({ en_promocion: true, precio_base: 999, precio_final: 700, porcentaje_descuento: 29.93 });
    expect(getDiscountInfo(p)?.porcentaje).toBe(30);
  });
  it("devuelve null sin promoción aunque haya diferencia de precio", () => {
    const p = makeProduct({ en_promocion: false, precio_base: 1000, precio_final: 800, porcentaje_descuento: 20 });
    expect(getDiscountInfo(p)).toBeNull();
  });
  it("devuelve null si el precio final no es menor al base", () => {
    const p = makeProduct({ en_promocion: true, precio_base: 1000, precio_final: 1000, porcentaje_descuento: 0 });
    expect(getDiscountInfo(p)).toBeNull();
  });
  it("deja el porcentaje en null si redondea a cero", () => {
    const p = makeProduct({ en_promocion: true, precio_base: 1000, precio_final: 998, porcentaje_descuento: 0.2 });
    expect(getDiscountInfo(p)).toEqual({ precioAnterior: 1000, porcentaje: null });
  });
});

describe("cleanDescription", () => {
  it("conserva el texto plano y sus saltos de línea", () => {
    expect(cleanDescription("Producto: Teclado\n100% Nuevo")).toBe("Producto: Teclado\n100% Nuevo");
  });
  it("devuelve null con valor vacío, ausente o de solo espacios", () => {
    expect(cleanDescription(null)).toBeNull();
    expect(cleanDescription(undefined)).toBeNull();
    expect(cleanDescription("  \n ")).toBeNull();
  });
  it("normaliza saltos de Windows y recorta los extremos", () => {
    expect(cleanDescription("  Hola\r\nMundo  ")).toBe("Hola\nMundo");
  });
  it("reduce más de dos saltos seguidos a uno en blanco", () => {
    expect(cleanDescription("A\n\n\n\nB")).toBe("A\n\nB");
  });
  it("quita etiquetas HTML y deja su texto", () => {
    expect(cleanDescription("<p>Laptop <b>potente</b></p>")).toBe("Laptop potente");
  });
  it("elimina por completo el contenido de script y style", () => {
    expect(cleanDescription("Hola<script>alert(1)</script><style>a{}</style>")).toBe("Hola");
  });
  it("convierte <br> en salto de línea", () => {
    expect(cleanDescription("Línea 1<br>Línea 2<br/>Línea 3")).toBe("Línea 1\nLínea 2\nLínea 3");
  });
  it("decodifica entidades comunes", () => {
    expect(cleanDescription("Tom &amp; Jerry &lt;3 &quot;ok&quot; &#39;x&#39;&nbsp;fin")).toBe(
      "Tom & Jerry <3 \"ok\" 'x' fin",
    );
  });
  it("devuelve null si solo había etiquetas", () => {
    expect(cleanDescription("<p> </p><br>")).toBeNull();
  });
});

describe("getVisibleAttributes", () => {
  it("devuelve nombre y valor con su unidad", () => {
    expect(getVisibleAttributes([makeProductAttribute({ nombre: "RAM", valor: "16", unidad: "GB" })])).toEqual([
      { nombre: "RAM", valor: "16 GB" },
    ]);
  });
  it("omite la unidad si es null o vacía", () => {
    const attrs = [
      makeProductAttribute({ id: 1, nombre: "Color", valor: "Negro", unidad: null }),
      makeProductAttribute({ id: 2, nombre: "Modelo", valor: "X1", unidad: "" }),
    ];
    expect(getVisibleAttributes(attrs).map((a) => a.valor)).toEqual(["Negro", "X1"]);
  });
  it("descarta atributos sin nombre o sin valor", () => {
    const attrs = [
      makeProductAttribute({ id: 1, nombre: "", valor: "x" }),
      makeProductAttribute({ id: 2, nombre: "Peso", valor: "  " }),
      makeProductAttribute({ id: 3, nombre: "Color", valor: "Rojo", unidad: null }),
    ];
    expect(getVisibleAttributes(attrs)).toEqual([{ nombre: "Color", valor: "Rojo" }]);
  });
  it("devuelve lista vacía con valor ausente", () => {
    expect(getVisibleAttributes(undefined)).toEqual([]);
    expect(getVisibleAttributes([])).toEqual([]);
  });
});
