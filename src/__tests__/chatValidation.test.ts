import { CHAT_MESSAGE_MAX, validateChatMessage } from "@/features/chatbot/validation";

describe("validateChatMessage", () => {
  it("acepta un mensaje normal y le quita los espacios de los extremos", () => {
    expect(validateChatMessage("  hola  ")).toEqual({ ok: true, text: "hola" });
  });

  it("rechaza un mensaje vacío o solo con espacios", () => {
    expect(validateChatMessage("")).toEqual({ ok: false, error: "Escribe un mensaje." });
    expect(validateChatMessage("   ")).toEqual({ ok: false, error: "Escribe un mensaje." });
  });

  it("acepta exactamente 500 caracteres", () => {
    const texto = "a".repeat(CHAT_MESSAGE_MAX);
    expect(validateChatMessage(texto)).toEqual({ ok: true, text: texto });
  });

  it("rechaza más de 500 caracteres", () => {
    const resultado = validateChatMessage("a".repeat(CHAT_MESSAGE_MAX + 1));
    expect(resultado).toEqual({ ok: false, error: "El mensaje no puede pasar de 500 caracteres." });
  });

  it("cuenta el largo después de recortar los espacios", () => {
    const texto = "a".repeat(CHAT_MESSAGE_MAX);
    expect(validateChatMessage(`   ${texto}   `)).toEqual({ ok: true, text: texto });
  });
});
