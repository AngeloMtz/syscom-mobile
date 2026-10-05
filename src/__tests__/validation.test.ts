import { PASSWORD_RULES, passwordIsValid, validateEmail } from "@/features/auth/validation";
import { validateProfile } from "@/features/profile/validation";

describe("auth/validation", () => {
  describe("validateEmail", () => {
    it("exige el correo", () => {
      expect(validateEmail("")).toBe("El correo es requerido");
    });
    it.each(["sin-arroba", "a@b", "a b@c.com", "@c.com"])("rechaza formato inválido: %s", (v) => {
      expect(validateEmail(v)).toBe("Formato de correo inválido");
    });
    it("rechaza correos de más de 150 caracteres", () => {
      expect(validateEmail(`${"a".repeat(145)}@x.com`)).toBe("El correo es demasiado largo");
    });
    it("acepta un correo válido", () => {
      expect(validateEmail("usuario@syscom.mx")).toBeUndefined();
    });
  });

  describe("passwordIsValid", () => {
    it("acepta una contraseña que cumple todas las reglas", () => {
      expect(passwordIsValid("Abcdef1@")).toBe(true);
    });
    it.each([
      ["Ab1@", "menos de 8 caracteres"],
      ["abcdef1@", "sin mayúscula"],
      ["ABCDEF1@", "sin minúscula"],
      ["Abcdefg@", "sin número"],
      ["Abcdefg1", "sin símbolo"],
    ])("rechaza %s (%s)", (pwd) => {
      expect(passwordIsValid(pwd)).toBe(false);
    });
    it("expone las 5 reglas que se muestran al usuario", () => {
      expect(PASSWORD_RULES).toHaveLength(5);
    });
  });
});

describe("profile/validateProfile", () => {
  const valido = {
    nombre: "Angel",
    apellido_paterno: "Martinez",
    apellido_materno: "Lopez",
    telefono: "7711234567",
  };

  it("no devuelve errores con datos válidos", () => {
    expect(validateProfile(valido)).toEqual({});
  });
  it("valida el largo del nombre (4 a 25)", () => {
    expect(validateProfile({ ...valido, nombre: "Ana" }).nombre).toMatch(/al menos 4/);
    expect(validateProfile({ ...valido, nombre: "a".repeat(26) }).nombre).toMatch(/25/);
  });
  it("ignora espacios al medir el nombre", () => {
    expect(validateProfile({ ...valido, nombre: "  Ana  " }).nombre).toBeDefined();
  });
  it("valida apellidos (2 a 100)", () => {
    const e = validateProfile({ ...valido, apellido_paterno: "M", apellido_materno: "x".repeat(101) });
    expect(e.apellido_paterno).toMatch(/al menos 2/);
    expect(e.apellido_materno).toMatch(/100/);
  });
  it.each(["123456789", "12345678901", "77112345ab", ""])("rechaza teléfono inválido: %j", (t) => {
    expect(validateProfile({ ...valido, telefono: t }).telefono).toMatch(/10 dígitos/);
  });
});
