import {
  GUEST_EMAIL_MAX,
  GUEST_NAME_MAX,
  LIVE_MESSAGE_MAX,
  validateGuest,
  validateLiveMessage,
} from "@/features/chatbot/liveChat/validation";

describe("validateGuest", () => {
  it("acepta nombre y correo válidos y los recorta", () => {
    expect(validateGuest("  Luis  ", "  luis@correo.com ")).toEqual({
      ok: true,
      guest: { name: "Luis", email: "luis@correo.com" },
    });
  });

  it("pide nombre y correo cuando están vacíos", () => {
    expect(validateGuest("  ", "")).toEqual({
      ok: false,
      errors: { name: "Escribe tu nombre.", email: "Escribe tu correo." },
    });
  });

  it("rechaza un correo con formato inválido", () => {
    expect(validateGuest("Luis", "luis@")).toEqual({ ok: false, errors: { email: "Correo inválido." } });
  });

  it("respeta los máximos del backend (100 el nombre, 150 el correo)", () => {
    const nombre = validateGuest("a".repeat(GUEST_NAME_MAX + 1), "luis@correo.com");
    expect(nombre).toEqual({ ok: false, errors: { name: "El nombre no puede pasar de 100 caracteres." } });

    const largo = `${"a".repeat(GUEST_EMAIL_MAX)}@correo.com`;
    expect(validateGuest("Luis", largo)).toEqual({
      ok: false,
      errors: { email: "El correo no puede pasar de 150 caracteres." },
    });

    expect(validateGuest("a".repeat(GUEST_NAME_MAX), "luis@correo.com").ok).toBe(true);
  });
});

describe("validateLiveMessage", () => {
  it("acepta un mensaje y lo recorta", () => {
    expect(validateLiveMessage("  hola  ")).toEqual({ ok: true, text: "hola" });
  });

  it("rechaza vacío o solo espacios", () => {
    expect(validateLiveMessage("   ")).toEqual({ ok: false, error: "Escribe un mensaje." });
  });

  it("acepta 1000 caracteres y rechaza 1001", () => {
    expect(validateLiveMessage("a".repeat(LIVE_MESSAGE_MAX)).ok).toBe(true);
    expect(validateLiveMessage("a".repeat(LIVE_MESSAGE_MAX + 1))).toEqual({
      ok: false,
      error: "El mensaje no puede pasar de 1000 caracteres.",
    });
  });
});
