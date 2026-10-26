import { act, renderHook } from "@testing-library/react-native";

import { AGENT_TYPING_MS, TYPING_THROTTLE_MS, useLiveChat } from "@/features/chatbot/hooks/useLiveChat";
import { liveChatGateway, type LiveChatHandlers } from "@/features/chatbot/liveChat/liveChatGateway";

jest.mock("@/features/chatbot/liveChat/liveChatGateway", () => ({ liveChatGateway: { open: jest.fn() } }));

const open = liveChatGateway.open as jest.Mock;

const makeConnection = () => ({
  sendMessage: jest.fn(),
  sendTyping: jest.fn(),
  ping: jest.fn(),
  leave: jest.fn(),
  close: jest.fn(),
});

let conn: ReturnType<typeof makeConnection>;
let handlers: LiveChatHandlers;

const GUEST = { name: "Luis", email: "luis@correo.com" };
const T = "2026-10-26T12:00:00.000Z";

beforeEach(() => {
  jest.resetAllMocks();
  conn = makeConnection();
  open.mockImplementation((h: LiveChatHandlers) => {
    handlers = h;
    return conn;
  });
});

afterEach(() => {
  jest.useRealTimers();
});

const emit = (fn: () => void) =>
  act(async () => {
    fn();
  });

/** Monta el hook, inicia el chat y deja al asesor conectado. */
const montarActivo = async () => {
  const hook = await renderHook(() => useLiveChat());
  await emit(() => hook.result.current.start(GUEST));
  await emit(() => handlers.onStarted({ agentName: "Ana", conversationId: 7 }));
  return hook;
};

describe("useLiveChat: conexión", () => {
  it("start pasa a conectando y abre la conexión con los datos del invitado", async () => {
    const { result } = await renderHook(() => useLiveChat());

    await emit(() => result.current.start(GUEST));

    expect(result.current.state.status).toBe("connecting");
    expect(open).toHaveBeenCalledWith(expect.any(Object), { guest: GUEST });
  });

  it("start sin datos (con sesión) abre la conexión sin invitado", async () => {
    const { result } = await renderHook(() => useLiveChat());

    await emit(() => result.current.start());

    expect(open).toHaveBeenCalledWith(expect.any(Object), { guest: undefined });
  });

  it("iniciar de nuevo cierra la conexión anterior", async () => {
    const { result } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));

    await emit(() => result.current.start(GUEST));

    expect(conn.close).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(2);
  });

  it("traduce los eventos del servidor al estado: fila, posición, asesor, mensajes y reanudación", async () => {
    const { result } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));

    await emit(() => handlers.onQueued({ conversationId: 9, position: 3 }));
    expect(result.current.state).toMatchObject({ status: "queued", conversationId: 9, position: 3 });

    await emit(() => handlers.onPosition(1));
    expect(result.current.state.position).toBe(1);

    await emit(() => handlers.onStarted({ agentName: "Ana" }));
    expect(result.current.state).toMatchObject({ status: "active", agentName: "Ana" });

    await emit(() => handlers.onMessage({ content: "hola", senderType: "agent", createdAt: T }));
    expect(result.current.state.messages.at(-1)).toMatchObject({ from: "agent", content: "hola", createdAt: T });

    await emit(() => handlers.onMessage({ content: "sin fecha", senderType: "system" }));
    expect(result.current.state.messages.at(-1)).toMatchObject({ from: "system", content: "sin fecha" });
    expect(result.current.state.messages.at(-1)?.createdAt).not.toBe("");

    await emit(() =>
      handlers.onResumed({
        conversationId: 9,
        messages: [{ id_mensaje: 1, tipo_remitente: "client", contenido: "antes", created_at: T }],
      }),
    );
    expect(result.current.state.messages).toHaveLength(1);
  });

  it("avisos, no disponible, cierre y errores", async () => {
    const { result } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));
    await emit(() => handlers.onStarted({ agentName: "Ana", conversationId: 7 }));

    await emit(() => handlers.onNotice("¿Sigues ahí?"));
    expect(result.current.state.notice).toBe("¿Sigues ahí?");

    await emit(() => handlers.onError("Demasiados mensajes. Espera un momento."));
    expect(result.current.state).toMatchObject({ status: "active", notice: "Demasiados mensajes. Espera un momento." });

    await emit(() => handlers.onClosed("agent"));
    expect(result.current.state).toMatchObject({ status: "closed", closedReason: "agent" });
  });

  it("no disponible y falla de conexión son estados finales y cierran la conexión", async () => {
    const { result } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));

    await emit(() => handlers.onUnavailable({ reason: "no_agent", hours: null }));
    expect(result.current.state).toMatchObject({ status: "unavailable", unavailable: { reason: "no_agent" } });
    expect(conn.close).toHaveBeenCalledTimes(1);

    await emit(() => result.current.start(GUEST));
    await emit(() => handlers.onFailed("Sin conexión"));
    expect(result.current.state).toMatchObject({ status: "error", error: "Sin conexión" });
    expect(conn.close).toHaveBeenCalledTimes(2);
  });

  it("al cerrarse la conversación cierra la conexión", async () => {
    const { result } = await montarActivo();

    await emit(() => handlers.onClosed("timeout"));

    expect(result.current.state.status).toBe("closed");
    expect(conn.close).toHaveBeenCalledTimes(1);
  });
});

describe("useLiveChat: envío", () => {
  it("antes de estar con un asesor no deja enviar", async () => {
    const { result } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));

    let motivo: string | null = null;
    await emit(() => {
      motivo = result.current.send("hola");
    });

    expect(motivo).toBe("Aún no estás conectado con un asesor.");
    expect(conn.sendMessage).not.toHaveBeenCalled();
  });

  it("con el asesor conectado envía el mensaje recortado y lo muestra", async () => {
    const { result } = await montarActivo();

    let motivo: string | null = "pendiente";
    await emit(() => {
      motivo = result.current.send("  hola  ");
    });

    expect(motivo).toBeNull();
    expect(conn.sendMessage).toHaveBeenCalledWith("hola");
    expect(result.current.state.messages.at(-1)).toMatchObject({ from: "client", content: "hola" });
  });

  it("un mensaje vacío no se envía y devuelve el motivo", async () => {
    const { result } = await montarActivo();

    let motivo: string | null = null;
    await emit(() => {
      motivo = result.current.send("   ");
    });

    expect(motivo).toBe("Escribe un mensaje.");
    expect(conn.sendMessage).not.toHaveBeenCalled();
  });
});

describe("useLiveChat: presencia", () => {
  it("notifyTyping avisa al asesor y al servidor, como máximo cada 3 segundos", async () => {
    const { result } = await montarActivo();
    const ahora = jest.spyOn(Date, "now");

    ahora.mockReturnValue(10_000);
    await emit(() => result.current.notifyTyping());
    ahora.mockReturnValue(10_000 + TYPING_THROTTLE_MS - 1);
    await emit(() => result.current.notifyTyping());
    ahora.mockReturnValue(10_000 + TYPING_THROTTLE_MS);
    await emit(() => result.current.notifyTyping());

    expect(conn.sendTyping).toHaveBeenCalledTimes(2);
    expect(conn.ping).toHaveBeenCalledTimes(2);
    ahora.mockRestore();
  });

  it("stillHere responde al aviso de inactividad y lo quita", async () => {
    const { result } = await montarActivo();
    await emit(() => handlers.onNotice("¿Sigues ahí?"));

    await emit(() => result.current.stillHere());

    expect(conn.ping).toHaveBeenCalledTimes(1);
    expect(result.current.state.notice).toBeNull();
  });

  it("el indicador de que el asesor escribe se apaga solo", async () => {
    jest.useFakeTimers();
    const { result } = await montarActivo();

    await emit(() => handlers.onTyping());
    expect(result.current.state.agentTyping).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(AGENT_TYPING_MS);
    });
    expect(result.current.state.agentTyping).toBe(false);
  });

  it("si el asesor sigue escribiendo, el apagado se reinicia", async () => {
    jest.useFakeTimers();
    const { result } = await montarActivo();

    await emit(() => handlers.onTyping());
    await act(async () => {
      jest.advanceTimersByTime(AGENT_TYPING_MS - 1000);
    });
    await emit(() => handlers.onTyping());
    await act(async () => {
      jest.advanceTimersByTime(AGENT_TYPING_MS - 1000);
    });

    expect(result.current.state.agentTyping).toBe(true);
  });
});

describe("useLiveChat: salir y reintentar", () => {
  it("leave termina la conversación y vuelve al inicio", async () => {
    const { result } = await montarActivo();

    await emit(() => result.current.leave());

    expect(conn.leave).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.messages).toEqual([]);
  });

  it("restart vuelve a conectar con los mismos datos de invitado", async () => {
    const { result } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));
    await emit(() => handlers.onClosed("agent"));

    await emit(() => result.current.restart());

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenLastCalledWith(expect.any(Object), { guest: GUEST });
    expect(result.current.state.status).toBe("connecting");
  });

  it("al salir de la pantalla con el chat activo termina la conversación", async () => {
    const { unmount } = await montarActivo();

    await unmount();

    expect(conn.leave).toHaveBeenCalledTimes(1);
  });

  it("al salir de la pantalla mientras conecta solo cierra la conexión", async () => {
    const { result, unmount } = await renderHook(() => useLiveChat());
    await emit(() => result.current.start(GUEST));

    await unmount();

    expect(conn.close).toHaveBeenCalledTimes(1);
    expect(conn.leave).not.toHaveBeenCalled();
  });
});
