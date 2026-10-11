import {
  hasDangerousContent,
  sanitizeAddressField,
  toCreatePayload,
  toUpdatePayload,
  validateAddress,
} from "@/features/addresses/addressValidation";

import { makeAddressInput } from "./fixtures";

describe("sanitizeAddressField", () => {
  it("recorta los espacios de los extremos", () => {
    expect(sanitizeAddressField("  Av. Juárez 123  ")).toBe("Av. Juárez 123");
  });
  it("quita etiquetas, javascript: y eventos en línea como el backend", () => {
    expect(sanitizeAddressField("Calle <b>Norte</b> 5")).toBe("Calle Norte 5");
    expect(sanitizeAddressField("javascript:alert 1")).toBe("alert 1");
    expect(sanitizeAddressField("Calle onclick=x 5")).toBe("Calle x 5");
  });
  it("conserva símbolos habituales de una dirección", () => {
    expect(sanitizeAddressField("Av. 5 de Mayo #12 & Reforma, Int. 3")).toBe(
      "Av. 5 de Mayo #12 & Reforma, Int. 3",
    );
  });
  it("conserva un solo < o un solo >", () => {
    expect(sanitizeAddressField("Entre 5 < 10")).toBe("Entre 5 < 10");
    expect(sanitizeAddressField("Mayor > 3")).toBe("Mayor > 3");
  });
});

describe("hasDangerousContent", () => {
  it.each(["<b>x</b>", "a < b y c > d", "javascript:alert(1)", "JAVASCRIPT:x", "onclick=alert", "onerror = x"])(
    "detecta %p",
    (texto) => {
      expect(hasDangerousContent(texto)).toBe(true);
    },
  );
  it.each(["Av. Juárez 123", "Entre 5 < 10", "Mayor > 3", "Condominio Monte", "Calle 5 de Mayo"])(
    "no marca %p",
    (texto) => {
      expect(hasDangerousContent(texto)).toBe(false);
    },
  );
});

describe("validateAddress", () => {
  it("no devuelve errores con una dirección válida", () => {
    expect(validateAddress(makeAddressInput())).toEqual({});
  });

  describe("calle (5 a 150)", () => {
    it("4 caracteres es muy corto", () => {
      expect(validateAddress(makeAddressInput({ calle: "Abcd" })).calle).toBe(
        "La calle debe tener al menos 5 caracteres",
      );
    });
    it("5 caracteres es válido", () => {
      expect(validateAddress(makeAddressInput({ calle: "Abcde" })).calle).toBeUndefined();
    });
    it("150 es válido y 151 excede", () => {
      expect(validateAddress(makeAddressInput({ calle: "a".repeat(150) })).calle).toBeUndefined();
      expect(validateAddress(makeAddressInput({ calle: "a".repeat(151) })).calle).toBe(
        "La calle no puede exceder 150 caracteres",
      );
    });
    it("vacía o solo espacios es muy corta", () => {
      expect(validateAddress(makeAddressInput({ calle: "" })).calle).toBeDefined();
      expect(validateAddress(makeAddressInput({ calle: "      " })).calle).toBeDefined();
    });
    it("mide el largo después de recortar", () => {
      expect(validateAddress(makeAddressInput({ calle: "  abcd  " })).calle).toBeDefined();
      expect(validateAddress(makeAddressInput({ calle: "  abcde  " })).calle).toBeUndefined();
    });
  });

  describe.each([
    ["colonia", "La colonia"],
    ["ciudad", "La ciudad"],
    ["estado", "El estado"],
  ] as const)("%s (3 a 100)", (campo, etiqueta) => {
    it("2 caracteres es muy corto", () => {
      expect(validateAddress(makeAddressInput({ [campo]: "ab" }))[campo]).toBe(
        `${etiqueta} debe tener al menos 3 caracteres`,
      );
    });
    it("3 es válido", () => {
      expect(validateAddress(makeAddressInput({ [campo]: "abc" }))[campo]).toBeUndefined();
    });
    it("100 es válido y 101 excede", () => {
      expect(validateAddress(makeAddressInput({ [campo]: "a".repeat(100) }))[campo]).toBeUndefined();
      expect(validateAddress(makeAddressInput({ [campo]: "a".repeat(101) }))[campo]).toBe(
        `${etiqueta} no puede exceder 100 caracteres`,
      );
    });
  });

  describe("código postal (5 dígitos)", () => {
    const mensaje = "El código postal debe tener exactamente 5 dígitos";
    it("4 dígitos es inválido", () => {
      expect(validateAddress(makeAddressInput({ codigo_postal: "4300" })).codigo_postal).toBe(mensaje);
    });
    it("5 dígitos es válido", () => {
      expect(validateAddress(makeAddressInput({ codigo_postal: "43000" })).codigo_postal).toBeUndefined();
    });
    it("6 dígitos es inválido", () => {
      expect(validateAddress(makeAddressInput({ codigo_postal: "430000" })).codigo_postal).toBe(mensaje);
    });
    it("con letras o símbolos es inválido", () => {
      expect(validateAddress(makeAddressInput({ codigo_postal: "43O00" })).codigo_postal).toBe(mensaje);
      expect(validateAddress(makeAddressInput({ codigo_postal: "43-00" })).codigo_postal).toBe(mensaje);
    });
    it("vacío es inválido y los espacios de los extremos se ignoran", () => {
      expect(validateAddress(makeAddressInput({ codigo_postal: "" })).codigo_postal).toBe(mensaje);
      expect(validateAddress(makeAddressInput({ codigo_postal: " 43000 " })).codigo_postal).toBeUndefined();
    });
  });

  describe("referencias (opcional, máximo 255)", () => {
    it("vacía es válida", () => {
      expect(validateAddress(makeAddressInput({ referencias: "" })).referencias).toBeUndefined();
    });
    it("255 es válida y 256 excede", () => {
      expect(validateAddress(makeAddressInput({ referencias: "a".repeat(255) })).referencias).toBeUndefined();
      expect(validateAddress(makeAddressInput({ referencias: "a".repeat(256) })).referencias).toBe(
        "Las referencias no pueden exceder 255 caracteres",
      );
    });
  });

  describe("contenido no permitido", () => {
    it("marca el campo con etiquetas, javascript: o eventos", () => {
      const errores = validateAddress(
        makeAddressInput({ calle: "Calle <b>Norte</b> 5", colonia: "javascript:x", referencias: "onclick=y" }),
      );
      expect(errores.calle).toBe("Este campo contiene caracteres no permitidos");
      expect(errores.colonia).toBe("Este campo contiene caracteres no permitidos");
      expect(errores.referencias).toBe("Este campo contiene caracteres no permitidos");
    });
    it("un solo < o > no es contenido no permitido", () => {
      expect(validateAddress(makeAddressInput({ referencias: "Entre 5 < 10" }))).toEqual({});
    });
  });

  it("acumula los errores de varios campos", () => {
    const errores = validateAddress(
      makeAddressInput({ calle: "ab", colonia: "", ciudad: "x", estado: "", codigo_postal: "1" }),
    );
    expect(Object.keys(errores).sort()).toEqual(["calle", "ciudad", "codigo_postal", "colonia", "estado"]);
  });
});

describe("toCreatePayload / toUpdatePayload", () => {
  it("recorta y limpia los campos", () => {
    const payload = toCreatePayload(
      makeAddressInput({ calle: "  Av. Juárez 123  ", colonia: "Centro <b>", referencias: "  junto al parque " }),
    );
    expect(payload).toEqual({
      calle: "Av. Juárez 123",
      colonia: "Centro",
      ciudad: "Huejutla",
      estado: "Hidalgo",
      codigo_postal: "43000",
      referencias: "junto al parque",
    });
  });
  it("al crear omite las referencias vacías", () => {
    const payload = toCreatePayload(makeAddressInput({ referencias: "   " }));
    expect(payload).not.toHaveProperty("referencias");
  });
  it("al editar envía las referencias vacías para borrarlas", () => {
    const payload = toUpdatePayload(makeAddressInput({ referencias: "" }));
    expect(payload.referencias).toBe("");
  });
});
