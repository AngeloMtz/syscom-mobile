import { CHAT_SUGGESTIONS, parseChatText, shouldShowChatFab } from "@/features/chatbot/chatSelectors";

describe("shouldShowChatFab", () => {
  it.each(["/", "/catalog", "/services", "/more"])("se muestra en %s", (ruta) => {
    expect(shouldShowChatFab(ruta)).toBe(true);
  });

  it("se oculta en el carrito para no tapar el pago", () => {
    expect(shouldShowChatFab("/cart")).toBe(false);
  });
});

describe("parseChatText", () => {
  it("texto sin formato es un solo segmento", () => {
    expect(parseChatText("Hola, ¿en qué te ayudo?")).toEqual([{ text: "Hola, ¿en qué te ayudo?", bold: false }]);
  });

  it("separa las negritas del resto", () => {
    expect(parseChatText("Abrimos **lunes** a viernes")).toEqual([
      { text: "Abrimos ", bold: false },
      { text: "lunes", bold: true },
      { text: " a viernes", bold: false },
    ]);
  });

  it("varias negritas y una al inicio", () => {
    expect(parseChatText("**Lunes:** 9 y **Martes:** 10")).toEqual([
      { text: "Lunes:", bold: true },
      { text: " 9 y ", bold: false },
      { text: "Martes:", bold: true },
      { text: " 10", bold: false },
    ]);
  });

  it("convierte las viñetas de lista en •", () => {
    const texto = parseChatText("Horario:\n- Lunes\n* Martes").map((s) => s.text).join("");
    expect(texto).toBe("Horario:\n• Lunes\n• Martes");
  });

  it("una negrita sin cerrar se deja tal cual", () => {
    expect(parseChatText("precio **desde")).toEqual([{ text: "precio **desde", bold: false }]);
  });

  it("texto vacío no genera segmentos", () => {
    expect(parseChatText("")).toEqual([]);
  });
});

describe("CHAT_SUGGESTIONS", () => {
  it("son preguntas que caben en un mensaje válido (máx. 500 caracteres)", () => {
    expect(CHAT_SUGGESTIONS.length).toBeGreaterThan(0);
    CHAT_SUGGESTIONS.forEach((q) => expect(q.length).toBeLessThanOrEqual(500));
  });
});
