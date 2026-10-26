import {
  initialLiveChatState,
  liveChatReducer,
  type LiveChatAction,
} from "@/features/chatbot/liveChat/liveChatReducer";
import type { LiveChatState } from "@/features/chatbot/liveChat/types";

const T = "2026-10-26T12:00:00.000Z";

const run = (actions: LiveChatAction[], from: LiveChatState = initialLiveChatState) =>
  actions.reduce(liveChatReducer, from);

const activo = () =>
  run([
    { type: "connecting" },
    { type: "started", agentName: "Ana", conversationId: 7, createdAt: T },
  ]);

describe("liveChatReducer: conexión y fila", () => {
  it("connecting limpia lo anterior pero conserva el contador de ids", () => {
    const antes = run([{ type: "message", from: "client", content: "hola", createdAt: T }]);

    const despues = liveChatReducer(antes, { type: "connecting" });

    expect(despues).toEqual({ ...initialLiveChatState, status: "connecting", seq: 1 });
  });

  it("queued guarda la conversación y el lugar en la fila", () => {
    const state = run([{ type: "connecting" }, { type: "queued", conversationId: 9, position: 3 }]);

    expect(state).toMatchObject({ status: "queued", conversationId: 9, position: 3, notice: null });
  });

  it("position actualiza el lugar solo mientras está en la fila", () => {
    const enFila = run([{ type: "queued", conversationId: 9, position: 3 }]);
    expect(liveChatReducer(enFila, { type: "position", position: 1 }).position).toBe(1);

    const conectando = run([{ type: "connecting" }]);
    expect(liveChatReducer(conectando, { type: "position", position: 1 })).toBe(conectando);
  });

  it("started activa el chat, guarda al asesor y avisa que se unió", () => {
    const state = run([
      { type: "queued", conversationId: 9, position: 1 },
      { type: "started", agentName: "Ana", createdAt: T },
    ]);

    expect(state).toMatchObject({ status: "active", conversationId: 9, agentName: "Ana", position: null });
    expect(state.messages).toEqual([{ id: "1", from: "system", content: "Ana se unió a la conversación.", createdAt: T }]);
  });

  it("started con conversationId lo usa (asignación directa, sin pasar por la fila)", () => {
    expect(activo().conversationId).toBe(7);
  });
});

describe("liveChatReducer: mensajes", () => {
  it("message agrega con ids distintos y en orden", () => {
    const state = run(
      [
        { type: "message", from: "client", content: "hola", createdAt: T },
        { type: "message", from: "agent", content: "¿en qué te ayudo?", createdAt: T },
      ],
      activo(),
    );

    expect(state.messages.map((m) => [m.id, m.from, m.content])).toEqual([
      ["1", "system", "Ana se unió a la conversación."],
      ["2", "client", "hola"],
      ["3", "agent", "¿en qué te ayudo?"],
    ]);
  });

  it("un mensaje del asesor apaga el indicador de que escribe; uno del cliente no", () => {
    const escribiendo = run([{ type: "typing", typing: true }], activo());

    expect(liveChatReducer(escribiendo, { type: "message", from: "client", content: "x", createdAt: T }).agentTyping).toBe(true);
    expect(liveChatReducer(escribiendo, { type: "message", from: "agent", content: "x", createdAt: T }).agentTyping).toBe(false);
  });

  it("resumed reemplaza los mensajes por los del servidor y activa el chat", () => {
    const state = run([
      { type: "connecting" },
      {
        type: "resumed",
        conversationId: 7,
        messages: [
          { id_mensaje: 1, tipo_remitente: "client", contenido: "hola", created_at: T },
          { id_mensaje: 2, tipo_remitente: "agent", contenido: "buenas", created_at: T },
          { id_mensaje: 3, tipo_remitente: "otro", contenido: "aviso", created_at: T },
        ],
      },
    ]);

    expect(state).toMatchObject({ status: "active", conversationId: 7, notice: null });
    expect(state.messages.map((m) => [m.id, m.from, m.content])).toEqual([
      ["1", "client", "hola"],
      ["2", "agent", "buenas"],
      ["3", "system", "aviso"],
    ]);
    expect(state.seq).toBe(3);
  });

  it("typing y notice cambian solo su propio campo", () => {
    expect(run([{ type: "typing", typing: true }], activo()).agentTyping).toBe(true);
    expect(run([{ type: "notice", message: "¿Sigues ahí?" }], activo()).notice).toBe("¿Sigues ahí?");
    expect(run([{ type: "notice", message: null }], run([{ type: "notice", message: "x" }], activo())).notice).toBeNull();
  });
});

describe("liveChatReducer: cierres y errores", () => {
  it("unavailable guarda el motivo y el horario", () => {
    const hours = { lunes: { inicio: "09:00", fin: "19:00", activo: true } };

    const state = run([{ type: "connecting" }, { type: "unavailable", reason: "closed", hours }]);

    expect(state).toMatchObject({ status: "unavailable", unavailable: { reason: "closed", hours } });
  });

  it("closed termina la conversación y limpia lo pendiente", () => {
    const state = run([{ type: "notice", message: "aviso" }, { type: "typing", typing: true }, { type: "closed", reason: "agent" }], activo());

    expect(state).toMatchObject({
      status: "closed",
      closedReason: "agent",
      conversationId: null,
      notice: null,
      agentTyping: false,
    });
  });

  it("un error del servidor con la conversación en curso es solo un aviso", () => {
    const enCurso = liveChatReducer(activo(), { type: "error", message: "Demasiados mensajes. Espera un momento." });
    expect(enCurso).toMatchObject({ status: "active", notice: "Demasiados mensajes. Espera un momento." });

    const enFila = run([{ type: "queued", conversationId: 9, position: 2 }, { type: "error", message: "aviso" }]);
    expect(enFila).toMatchObject({ status: "queued", notice: "aviso" });
  });

  it("un error del servidor al conectar sí es fatal", () => {
    const state = run([{ type: "connecting" }, { type: "error", message: "Nombre y correo son requeridos" }]);

    expect(state).toMatchObject({ status: "error", error: "Nombre y correo son requeridos" });
  });

  it("failed es fatal aunque el chat estuviera activo", () => {
    const state = liveChatReducer(activo(), { type: "failed", message: "Sin conexión" });

    expect(state).toMatchObject({ status: "error", error: "Sin conexión", agentTyping: false });
  });

  it("reset vuelve al inicio sin repetir ids", () => {
    const state = run([{ type: "reset" }], activo());

    expect(state).toEqual({ ...initialLiveChatState, seq: 1 });
  });
});
