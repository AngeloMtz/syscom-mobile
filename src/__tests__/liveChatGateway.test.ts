import { io } from "socket.io-client";

import { liveChatGateway, type LiveChatHandlers } from "@/features/chatbot/liveChat/liveChatGateway";
import { getTokenSync } from "@/shared/api/secureToken";

jest.mock("socket.io-client", () => ({ io: jest.fn() }));
jest.mock("@/shared/api/secureToken", () => ({ getTokenSync: jest.fn() }));
jest.mock("@/shared/api/client", () => ({ API_URL: "https://api.test/api" }));

class FakeSocket {
  handlers: Record<string, (payload?: any) => void> = {};
  managerHandlers: Record<string, () => void> = {};
  emit = jest.fn();
  disconnect = jest.fn();
  io = {
    on: (event: string, fn: () => void) => {
      this.managerHandlers[event] = fn;
    },
  };

  on(event: string, fn: (payload?: any) => void) {
    this.handlers[event] = fn;
    return this;
  }

  trigger(event: string, payload?: any) {
    this.handlers[event]?.(payload);
  }
}

const makeHandlers = (): jest.Mocked<LiveChatHandlers> => ({
  onQueued: jest.fn(),
  onPosition: jest.fn(),
  onStarted: jest.fn(),
  onMessage: jest.fn(),
  onResumed: jest.fn(),
  onTyping: jest.fn(),
  onNotice: jest.fn(),
  onUnavailable: jest.fn(),
  onClosed: jest.fn(),
  onError: jest.fn(),
  onFailed: jest.fn(),
});

let socket: FakeSocket;
let handlers: jest.Mocked<LiveChatHandlers>;

beforeEach(() => {
  jest.resetAllMocks();
  socket = new FakeSocket();
  handlers = makeHandlers();
  (io as jest.Mock).mockReturnValue(socket);
  (getTokenSync as jest.Mock).mockReturnValue(null);
});

describe("liveChatGateway.open: conexión", () => {
  it("se conecta al namespace /contact solo por websocket y sin token si no hay sesión", () => {
    liveChatGateway.open(handlers);

    expect(io).toHaveBeenCalledWith(
      "https://api.test/contact",
      expect.objectContaining({ transports: ["websocket"], auth: {} }),
    );
  });

  it("con sesión manda el JWT en auth", () => {
    (getTokenSync as jest.Mock).mockReturnValue("jwt-123");

    liveChatGateway.open(handlers);

    expect(io).toHaveBeenCalledWith("https://api.test/contact", expect.objectContaining({ auth: { token: "jwt-123" } }));
  });

  it("al conectar inicia el chat con los datos del invitado", () => {
    liveChatGateway.open(handlers, { guest: { name: "Luis", email: "luis@correo.com" }, productId: 5 });

    socket.trigger("connect");

    expect(socket.emit).toHaveBeenCalledWith("chat:init", {
      guestName: "Luis",
      guestEmail: "luis@correo.com",
      productId: 5,
    });
  });

  it("con sesión inicia el chat sin datos extra", () => {
    liveChatGateway.open(handlers);

    socket.trigger("connect");

    expect(socket.emit).toHaveBeenCalledWith("chat:init", {});
  });

  it("al reconectar reanuda la misma conversación", () => {
    liveChatGateway.open(handlers);
    socket.trigger("connect");
    socket.trigger("chat:queued", { conversationId: 42, position: 2 });

    socket.trigger("connect");

    expect(socket.emit).toHaveBeenLastCalledWith("chat:init", { existingConversationId: 42 });
  });

  it("si el servidor asigna al asesor con su conversación, también la recuerda", () => {
    liveChatGateway.open(handlers);
    socket.trigger("chat:started", { conversationId: 8, agentName: "Ana" });

    socket.trigger("connect");

    expect(socket.emit).toHaveBeenLastCalledWith("chat:init", { existingConversationId: 8 });
    expect(handlers.onStarted).toHaveBeenCalledWith({ agentName: "Ana", conversationId: 8 });
  });

  it("chat:started sin conversationId (salió de la fila) conserva la que ya tenía", () => {
    liveChatGateway.open(handlers);
    socket.trigger("chat:queued", { conversationId: 42, position: 1 });
    socket.trigger("chat:started", { agentName: "Ana" });

    socket.trigger("connect");

    expect(socket.emit).toHaveBeenLastCalledWith("chat:init", { existingConversationId: 42 });
  });

  it("tras cerrarse la conversación ya no intenta reanudarla", () => {
    liveChatGateway.open(handlers);
    socket.trigger("chat:queued", { conversationId: 42, position: 1 });
    socket.trigger("chat:closed", { reason: "agent" });

    socket.trigger("connect");

    expect(socket.emit).toHaveBeenLastCalledWith("chat:init", {});
    expect(handlers.onClosed).toHaveBeenCalledWith("agent");
  });
});

describe("liveChatGateway.open: eventos del servidor", () => {
  beforeEach(() => {
    liveChatGateway.open(handlers);
  });

  it("chat:queued, chat:position y chat:typing", () => {
    socket.trigger("chat:queued", { conversationId: 3, position: 4 });
    socket.trigger("chat:position", { position: 2 });
    socket.trigger("chat:typing");

    expect(handlers.onQueued).toHaveBeenCalledWith({ conversationId: 3, position: 4 });
    expect(handlers.onPosition).toHaveBeenCalledWith(2);
    expect(handlers.onTyping).toHaveBeenCalledTimes(1);
  });

  it("chat:message", () => {
    socket.trigger("chat:message", { content: "hola", senderType: "agent", createdAt: "2026-10-26T12:00:00Z" });

    expect(handlers.onMessage).toHaveBeenCalledWith({
      content: "hola",
      senderType: "agent",
      createdAt: "2026-10-26T12:00:00Z",
    });
  });

  it("chat:resumed entrega los mensajes (lista vacía si no vienen)", () => {
    const messages = [{ id_mensaje: 1, tipo_remitente: "client", contenido: "hola", created_at: "t" }];

    socket.trigger("chat:resumed", { conversationId: 3, messages });
    socket.trigger("chat:resumed", { conversationId: 3 });

    expect(handlers.onResumed).toHaveBeenNthCalledWith(1, { conversationId: 3, messages });
    expect(handlers.onResumed).toHaveBeenNthCalledWith(2, { conversationId: 3, messages: [] });
  });

  it("chat:warning llega como aviso con su texto", () => {
    socket.trigger("chat:warning", { reason: "inactivity", secondsLeft: 60 });
    socket.trigger("chat:warning", undefined);

    expect(handlers.onNotice).toHaveBeenNthCalledWith(
      1,
      "¿Sigues ahí? La conversación se cerrará en 60 segundos por inactividad.",
    );
    expect(handlers.onNotice).toHaveBeenNthCalledWith(2, "Aviso del servidor.");
  });

  it("chat:unavailable manda el motivo y el horario (null si no viene)", () => {
    const hours = { lunes: { inicio: "09:00", fin: "19:00", activo: true } };

    socket.trigger("chat:unavailable", { reason: "closed", hours });
    socket.trigger("chat:unavailable", { reason: "no_agent" });

    expect(handlers.onUnavailable).toHaveBeenNthCalledWith(1, { reason: "closed", hours });
    expect(handlers.onUnavailable).toHaveBeenNthCalledWith(2, { reason: "no_agent", hours: null });
  });

  it("chat:error usa el mensaje del servidor o uno por defecto", () => {
    socket.trigger("chat:error", { message: "Demasiados mensajes. Espera un momento." });
    socket.trigger("chat:error", undefined);

    expect(handlers.onError).toHaveBeenNthCalledWith(1, "Demasiados mensajes. Espera un momento.");
    expect(handlers.onError).toHaveBeenNthCalledWith(2, "Ocurrió un error en el chat.");
  });

  it("una desconexión inesperada avisa que reconecta; la voluntaria no", () => {
    socket.trigger("disconnect", "transport close");
    socket.trigger("disconnect", "io client disconnect");

    expect(handlers.onNotice).toHaveBeenCalledTimes(1);
    expect(handlers.onNotice).toHaveBeenCalledWith("Conexión perdida. Reconectando…");
  });

  it("si se agotan los reintentos de conexión avisa que falló", () => {
    socket.managerHandlers["reconnect_failed"]();

    expect(handlers.onFailed).toHaveBeenCalledWith(
      "No se pudo conectar con el chat. Revisa tu internet e intenta de nuevo.",
    );
  });
});

describe("liveChatGateway.open: acciones del cliente", () => {
  it("sendMessage, sendTyping y ping emiten sus eventos", () => {
    const connection = liveChatGateway.open(handlers);

    connection.sendMessage("hola");
    connection.sendTyping();
    connection.ping();

    expect(socket.emit).toHaveBeenCalledWith("chat:message", { content: "hola" });
    expect(socket.emit).toHaveBeenCalledWith("chat:typing");
    expect(socket.emit).toHaveBeenCalledWith("chat:ping");
  });

  it("leave termina la conversación y cierra la conexión", () => {
    const connection = liveChatGateway.open(handlers);

    connection.leave();

    expect(socket.emit).toHaveBeenCalledWith("chat:leave");
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("close solo cierra la conexión, sin terminar la conversación", () => {
    const connection = liveChatGateway.open(handlers);

    connection.close();

    expect(socket.emit).not.toHaveBeenCalledWith("chat:leave");
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("después de cerrar, los eventos rezagados ya no llegan a la pantalla", () => {
    const connection = liveChatGateway.open(handlers);
    connection.close();

    socket.trigger("chat:message", { content: "tarde", senderType: "agent" });
    socket.managerHandlers["reconnect_failed"]();

    expect(handlers.onMessage).not.toHaveBeenCalled();
    expect(handlers.onFailed).not.toHaveBeenCalled();
  });
});
