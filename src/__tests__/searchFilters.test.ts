import { buildProductFilters, hasActiveFilters } from "@/features/catalog/searchFilters";

const vacio = { texto: "", minTxt: "", maxTxt: "" };

describe("catalog/searchFilters", () => {
  describe("buildProductFilters", () => {
    it("sin nada escrito devuelve un objeto sin claves de filtro", () => {
      expect(buildProductFilters(vacio)).toEqual({});
    });

    it("recorta el texto con trim", () => {
      expect(buildProductFilters({ ...vacio, texto: "  router  " })).toEqual({ search: "router" });
    });

    it("un texto de solo espacios se omite", () => {
      expect(buildProductFilters({ ...vacio, texto: "    " })).toEqual({});
    });

    it("incluye la categoría cuando se elige", () => {
      expect(buildProductFilters({ ...vacio, categoria: 7 })).toEqual({ categoria: 7 });
    });

    it("solo mínimo", () => {
      expect(buildProductFilters({ ...vacio, minTxt: "100" })).toEqual({ precioMin: 100 });
    });

    it("solo máximo", () => {
      expect(buildProductFilters({ ...vacio, maxTxt: "500" })).toEqual({ precioMax: 500 });
    });

    it("el 0 como mínimo se envía (no se descarta por ser falsy)", () => {
      expect(buildProductFilters({ ...vacio, minTxt: "0" })).toEqual({ precioMin: 0 });
    });

    it("interpreta separador de miles y punto decimal", () => {
      expect(buildProductFilters({ ...vacio, minTxt: "1,500.50", maxTxt: "2,000" })).toEqual({
        precioMin: 1500.5,
        precioMax: 2000,
      });
    });

    it("combina texto, categoría y rango", () => {
      expect(
        buildProductFilters({ texto: " cámara ", minTxt: "100", maxTxt: "900", categoria: 3 }),
      ).toEqual({ search: "cámara", categoria: 3, precioMin: 100, precioMax: 900 });
    });

    it("rango invertido: no envía precios pero conserva texto y categoría", () => {
      expect(
        buildProductFilters({ texto: "cable", minTxt: "900", maxTxt: "100", categoria: 3 }),
      ).toEqual({ search: "cable", categoria: 3 });
    });

    it("precio inválido (coma decimal): no envía ningún precio", () => {
      expect(buildProductFilters({ ...vacio, minTxt: "10", maxTxt: "1500,5" })).toEqual({});
    });

    it("precio enorme: no envía precios", () => {
      expect(buildProductFilters({ ...vacio, maxTxt: "99999999999" })).toEqual({});
    });

    it("no incluye claves con undefined", () => {
      const f = buildProductFilters({ ...vacio, texto: "a" });
      expect(Object.keys(f)).toEqual(["search"]);
    });
  });

  describe("hasActiveFilters", () => {
    it("falso sin criterios", () => {
      expect(hasActiveFilters({})).toBe(false);
    });

    it("verdadero con texto", () => {
      expect(hasActiveFilters({ search: "a" })).toBe(true);
    });

    it("verdadero con categoría", () => {
      expect(hasActiveFilters({ categoria: 1 })).toBe(true);
    });

    it("verdadero con solo precio mínimo, incluido 0", () => {
      expect(hasActiveFilters({ precioMin: 100 })).toBe(true);
      expect(hasActiveFilters({ precioMin: 0 })).toBe(true);
    });

    it("verdadero con solo precio máximo, incluido 0", () => {
      expect(hasActiveFilters({ precioMax: 500 })).toBe(true);
      expect(hasActiveFilters({ precioMax: 0 })).toBe(true);
    });

    it("ignora limit y ordenar, que no son criterios de búsqueda", () => {
      expect(hasActiveFilters({ limit: 10, ordenar: "nombre" })).toBe(false);
    });

    it("un texto vacío no cuenta", () => {
      expect(hasActiveFilters({ search: "" })).toBe(false);
    });
  });
});
