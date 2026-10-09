import {
  MAX_PRICE,
  parsePriceInput,
  validatePriceRange,
} from "@/features/catalog/validation";

describe("catalog/validation", () => {
  describe("parsePriceInput", () => {
    it.each(["", "   "])("vacío (%j) no es error y no tiene valor", (v) => {
      expect(parsePriceInput(v)).toEqual({ value: undefined });
    });

    it.each([
      ["1500", 1500],
      ["  1500  ", 1500],
      ["1500.5", 1500.5],
      ["0", 0],
      ["0.99", 0.99],
      ["1,500", 1500],
      ["1,500.50", 1500.5],
      ["1,234,567", 1234567],
      [String(MAX_PRICE), MAX_PRICE],
    ])("acepta %j como %d", (v, esperado) => {
      expect(parsePriceInput(v)).toEqual({ value: esperado });
    });

    it.each(["1500,5", "1,5", "12,34", "1,500,5", "1,50"])(
      "rechaza la coma como decimal: %j",
      (v) => {
        expect(parsePriceInput(v).error).toBe(
          "Usa punto para los decimales (ej. 1500.50)",
        );
      },
    );

    it.each(["abc", "12abc", "$100", "1e3", "1.2.3", ".5", "1500.", "--5", "1 000"])(
      "rechaza texto no numérico: %j",
      (v) => {
        expect(parsePriceInput(v).error).toBe("Escribe solo números");
      },
    );

    it.each(["-1", "-0.5", "-1500"])("rechaza negativos: %j", (v) => {
      expect(parsePriceInput(v).error).toBe("El precio no puede ser negativo");
    });

    it.each(["99999999999", String(MAX_PRICE + 1), "1,000,000,000,000"])(
      "rechaza un valor enorme: %j",
      (v) => {
        const r = parsePriceInput(v);
        expect(r.error).toBe("El precio es demasiado grande");
        expect(r.value).toBeUndefined();
      },
    );
  });

  describe("validatePriceRange", () => {
    it("sin nada escrito es válido y no trae precios", () => {
      expect(validatePriceRange("", "")).toEqual({
        precioMin: undefined,
        precioMax: undefined,
        errors: {},
        valid: true,
      });
    });

    it("solo mínimo", () => {
      const r = validatePriceRange("100", "");
      expect(r).toMatchObject({ precioMin: 100, precioMax: undefined, valid: true });
    });

    it("solo máximo", () => {
      const r = validatePriceRange("", "500");
      expect(r).toMatchObject({ precioMin: undefined, precioMax: 500, valid: true });
    });

    it("el 0 como mínimo es válido y se conserva (no se pierde por ser falsy)", () => {
      const r = validatePriceRange("0", "");
      expect(r.valid).toBe(true);
      expect(r.precioMin).toBe(0);
    });

    it("0 como mínimo y un máximo es un rango válido", () => {
      expect(validatePriceRange("0", "100")).toMatchObject({
        precioMin: 0,
        precioMax: 100,
        valid: true,
      });
    });

    it("0 como máximo con 0 como mínimo (iguales) es válido", () => {
      expect(validatePriceRange("0", "0").valid).toBe(true);
    });

    it("mínimo y máximo válidos", () => {
      expect(validatePriceRange("100", "500")).toMatchObject({
        precioMin: 100,
        precioMax: 500,
        errors: {},
        valid: true,
      });
    });

    it("mínimo igual al máximo es válido", () => {
      expect(validatePriceRange("250", "250").valid).toBe(true);
    });

    it("acepta separador de miles al comparar (1,500 vs 900)", () => {
      const r = validatePriceRange("1,500", "900");
      expect(r.valid).toBe(false);
      expect(r.errors.rango).toBe("El mínimo no puede ser mayor que el máximo");
    });

    it("mínimo mayor que el máximo marca error de rango", () => {
      const r = validatePriceRange("600", "500");
      expect(r.valid).toBe(false);
      expect(r.errors).toEqual({ rango: "El mínimo no puede ser mayor que el máximo" });
      expect(r.precioMin).toBeUndefined();
      expect(r.precioMax).toBeUndefined();
    });

    it("mínimo inválido: error en min y no trae precios", () => {
      const r = validatePriceRange("abc", "500");
      expect(r.valid).toBe(false);
      expect(r.errors.min).toBe("Escribe solo números");
      expect(r.errors.max).toBeUndefined();
      expect(r.precioMin).toBeUndefined();
      expect(r.precioMax).toBeUndefined();
    });

    it("máximo negativo: error en max", () => {
      const r = validatePriceRange("", "-5");
      expect(r.valid).toBe(false);
      expect(r.errors.max).toBe("El precio no puede ser negativo");
    });

    it("máximo con coma decimal: error en max", () => {
      const r = validatePriceRange("10", "1500,5");
      expect(r.valid).toBe(false);
      expect(r.errors.max).toBe("Usa punto para los decimales (ej. 1500.50)");
    });

    it("valor enorme en el máximo: error en max", () => {
      const r = validatePriceRange("", "99999999999");
      expect(r.valid).toBe(false);
      expect(r.errors.max).toBe("El precio es demasiado grande");
    });

    it("ambos inválidos: reporta los dos errores y no el de rango", () => {
      const r = validatePriceRange("x", "-1");
      expect(r.errors.min).toBeDefined();
      expect(r.errors.max).toBeDefined();
      expect(r.errors.rango).toBeUndefined();
    });
  });
});
