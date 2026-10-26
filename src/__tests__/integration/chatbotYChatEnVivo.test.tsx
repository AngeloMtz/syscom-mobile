// Integración del chatbot de soporte (HU #18), con servicios simulados. Dos flujos:
//  1. Asistente virtual (HTTP): ChatbotScreen → useChatbot → chatbotRepository → cliente Axios real
//     (solo su adapter es falso) → chatStore.
//  2. Chat en vivo con un asesor (Socket.io): LiveChatScreen → useLiveChat → liveChatGateway → un
//     socket falso que reproduce el protocolo del namespace /contact (fila, asesor, mensajes,
//     inactividad, reconexión, fuera de horario, cierre y errores).
// No se usa red real, ni el chatbot de producción, ni asesores, ni credenciales.
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";
import { io } from "socket.io-client";
import { useRouter } from "expo-router";

import ChatbotScreen from "@/app/chatbot";
import LiveChatScreen from "@/app/live-chat";
import { CHAT_GREETING, CHAT_SUGGESTIONS } from "@/features/chatbot/chatSelectors";
import { useChatStore } from "@/features/chatbot/chatStore";
import { useLiveChat } from "@/features/chatbot/hooks/useLiveChat";
import { queueText } from "@/features/chatbot/liveChat/liveChatSelectors";
import { CHATBOT_FALLBACK_REPLY } from "@/features/chatbot/repositories/chatbotRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeUser } from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { ok, usarClientePorPrueba } from "../utils/integracion";
import { SocketFalso } from "../utils/servidorChatFalso";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("socket.io-client", () => ({ io: jest.fn() }));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

const push = jest.fn();
const back = jest.fn();

beforeEach(async () => {
  jest.clearAllMocks();
  // UUID de la sesión del chatbot: determinista y reiniciado en cada prueba.
  let uuids = 0;
  (Crypto.randomUUID as jest.Mock).mockImplementation(() => `uuid-sesion-${++uuids}`);
  (useRouter as jest.Mock).mockReturnValue({ push, back });
  await useAuthStore.getState().logout();
  useChatStore.getState().reset();
});

afterEach(() => {
  jest.useRealTimers();
});

// ───────────────────────────── 1. Asistente virtual (HTTP) ─────────────────────────────

type PeticionChat = { cuerpo: any; autorizacion?: unknown };

const asistente = {
  peticiones: [] as PeticionChat[],
  /** Mientras no sea null, el servidor falla con ese estado. */
  fallo: null as { status: number; message: string } | null,
  vacia: false,
  escalar: false,
  /** Si se define, la respuesta espera a esta promesa. */
  compuerta: null as Promise<void> | null,
};

function prepararAsistente() {
  asistente.peticiones = [];
  asistente.fallo = null;
  asistente.vacia = false;
  asistente.escalar = false;
  asistente.compuerta = null;
  adapter.mockReset();
  adapter.mockImplementation(async (config) => {
    if (config.method === "post" && config.url === "/chatbot/message") {
      const cuerpo = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      asistente.peticiones.push({ cuerpo, autorizacion: config.headers?.Authorization });
      if (asistente.compuerta) await asistente.compuerta;
      if (asistente.fallo) throw makeApiError({ status: asistente.fallo.status, message: asistente.fallo.message });
      if (asistente.vacia) return ok(config, { data: { message: "   ", escalate: false } });
      return ok(config, { data: { message: `Respuesta a: ${cuerpo.mensaje}`, escalate: asistente.escalar } });
    }
    throw makeApiError({ status: 404, message: "Ruta no encontrada" });
  });
}

const burbujas = () => screen.getAllByLabelText(/^(Tú|Asistente): /).map((e) => e.props.accessibilityLabel as string);

async function escribirYEnviar(texto: string) {
  await fireEvent.changeText(screen.getByLabelText("Mensaje"), texto);
  await fireEvent.press(screen.getByLabelText("Enviar mensaje"));
}

describe("integración chatbot: asistente virtual (HTTP)", () => {
  beforeEach(prepararAsistente);

  it("muestra el saludo y las sugerencias; al tocar una se envía y llega la respuesta del bot", async () => {
    await render(<ChatbotScreen />, { wrapper });

    expect(screen.getByLabelText(`Asistente: ${CHAT_GREETING}`)).toBeTruthy();
    for (const q of CHAT_SUGGESTIONS) expect(screen.getByLabelText(q)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(CHAT_SUGGESTIONS[1]));

    expect(await screen.findByLabelText(`Asistente: Respuesta a: ${CHAT_SUGGESTIONS[1]}`)).toBeTruthy();
    expect(screen.getByLabelText(`Tú: ${CHAT_SUGGESTIONS[1]}`)).toBeTruthy();
    expect(asistente.peticiones).toHaveLength(1);
    expect(asistente.peticiones[0].cuerpo).toEqual({ sessionId: "uuid-sesion-1", mensaje: CHAT_SUGGESTIONS[1] });
    // Con una conversación empezada ya no se ofrecen las sugerencias.
    expect(screen.queryByLabelText(CHAT_SUGGESTIONS[0])).toBeNull();
  });

  it("el historial se conserva en orden y todos los mensajes usan la misma sesión del chat", async () => {
    await render(<ChatbotScreen />, { wrapper });

    await escribirYEnviar("hola");
    await screen.findByLabelText("Asistente: Respuesta a: hola");
    await escribirYEnviar("¿tienen laptops?");
    await screen.findByLabelText("Asistente: Respuesta a: ¿tienen laptops?");

    expect(burbujas()).toEqual([
      `Asistente: ${CHAT_GREETING}`,
      "Tú: hola",
      "Asistente: Respuesta a: hola",
      "Tú: ¿tienen laptops?",
      "Asistente: Respuesta a: ¿tienen laptops?",
    ]);
    expect(asistente.peticiones.map((p) => p.cuerpo.sessionId)).toEqual(["uuid-sesion-1", "uuid-sesion-1"]);
  });

  it("el historial sigue ahí al volver a abrir el chat durante la sesión, y se borra al cerrarla", async () => {
    const primera = await render(<ChatbotScreen />, { wrapper });
    await escribirYEnviar("hola");
    await screen.findByLabelText("Asistente: Respuesta a: hola");
    await primera.unmount();

    await render(<ChatbotScreen />, { wrapper });
    expect(burbujas()).toContain("Tú: hola");
    expect(burbujas()).toContain("Asistente: Respuesta a: hola");

    await act(async () => {
      useChatStore.getState().reset();
    });
    expect(burbujas()).toEqual([`Asistente: ${CHAT_GREETING}`]);
  });

  it("con sesión manda el nombre de la persona y la credencial; sin sesión no manda nombre", async () => {
    await act(async () => {
      await useAuthStore.getState().setSession(makeUser({ nombre: "Ana" }), "jwt-A");
    });
    const conSesion = await render(<ChatbotScreen />, { wrapper });
    await escribirYEnviar("hola");
    await screen.findByLabelText("Asistente: Respuesta a: hola");

    expect(asistente.peticiones[0].cuerpo).toEqual({ sessionId: "uuid-sesion-1", mensaje: "hola", nombreUsuario: "Ana" });
    expect(asistente.peticiones[0].autorizacion).toBe("Bearer jwt-A");
    await conSesion.unmount();

    await act(async () => {
      await useAuthStore.getState().logout();
    });
    useChatStore.getState().reset();
    await render(<ChatbotScreen />, { wrapper });
    await escribirYEnviar("buenas");
    await screen.findByLabelText("Asistente: Respuesta a: buenas");

    expect(asistente.peticiones[1].cuerpo).not.toHaveProperty("nombreUsuario");
    expect(asistente.peticiones[1].autorizacion).toBeUndefined();
  });

  it("si el servidor falla, el mensaje queda marcado con el error y 'Reintentar envío' lo manda sin duplicarlo", async () => {
    asistente.fallo = { status: 500, message: "El asistente no está disponible." };
    await render(<ChatbotScreen />, { wrapper });

    await escribirYEnviar("hola");

    expect(await screen.findByText("El asistente no está disponible.")).toBeTruthy();
    expect(screen.getByLabelText("Reintentar envío")).toBeTruthy();

    asistente.fallo = null;
    await fireEvent.press(screen.getByLabelText("Reintentar envío"));

    expect(await screen.findByLabelText("Asistente: Respuesta a: hola")).toBeTruthy();
    expect(screen.queryByText("El asistente no está disponible.")).toBeNull();
    expect(screen.queryByLabelText("Reintentar envío")).toBeNull();
    expect(burbujas().filter((b) => b === "Tú: hola")).toHaveLength(1);
    expect(asistente.peticiones).toHaveLength(2);
  });

  it("una respuesta vacía del servidor se sustituye por el texto de respaldo", async () => {
    asistente.vacia = true;
    await render(<ChatbotScreen />, { wrapper });

    await escribirYEnviar("hola");

    expect(await screen.findByLabelText(`Asistente: ${CHATBOT_FALLBACK_REPLY}`)).toBeTruthy();
  });

  it("si el cliente pide hablar con una persona, el bot lo detecta y se ofrece el chat en vivo", async () => {
    asistente.escalar = true;
    await render(<ChatbotScreen />, { wrapper });

    await escribirYEnviar("quiero hablar con un asesor");

    expect(await screen.findByText("Te conectamos con un asesor")).toBeTruthy();
    const botones = screen.getAllByLabelText("Hablar con una persona");
    expect(botones).toHaveLength(2); // la barra superior (siempre) y el aviso del bot
    await fireEvent.press(botones[1]);
    expect(push).toHaveBeenCalledWith("/live-chat");
  });

  it("siempre hay una salida a una persona en la barra superior", async () => {
    await render(<ChatbotScreen />, { wrapper });

    await fireEvent.press(screen.getByLabelText("Hablar con una persona"));

    expect(push).toHaveBeenCalledWith("/live-chat");
  });

  it("un mensaje vacío no se envía", async () => {
    await render(<ChatbotScreen />, { wrapper });

    await escribirYEnviar("   ");

    expect(asistente.peticiones).toHaveLength(0);
    expect(burbujas()).toEqual([`Asistente: ${CHAT_GREETING}`]);
  });

  it("mientras llega la respuesta no se puede mandar otro mensaje (una sola petición en curso)", async () => {
    let soltar: () => void = () => undefined;
    asistente.compuerta = new Promise<void>((resolve) => (soltar = resolve));
    await render(<ChatbotScreen />, { wrapper });

    await escribirYEnviar("primero");
    expect(await screen.findByText("Escribiendo…")).toBeTruthy();
    await escribirYEnviar("segundo");

    expect(asistente.peticiones).toHaveLength(1);
    await act(async () => {
      soltar();
    });
    expect(await screen.findByLabelText("Asistente: Respuesta a: primero")).toBeTruthy();
    expect(screen.queryByText("Escribiendo…")).toBeNull();
  });
});

// ───────────────────────────── 2. Chat en vivo (Socket.io) ─────────────────────────────

let sockets: SocketFalso[] = [];
const socket = () => sockets[sockets.length - 1];

beforeEach(() => {
  sockets = [];
  (io as jest.Mock).mockImplementation((url: string, opciones: Record<string, unknown>) => {
    const s = new SocketFalso();
    s.url = url;
    s.opciones = opciones;
    sockets.push(s);
    return s;
  });
});

const iniciarSesion = (token = "jwt-A") =>
  act(async () => {
    await useAuthStore.getState().setSession(makeUser({ id_usuario: 1 }), token);
  });

/** Pantalla con sesión: conecta sola; devuelve el socket ya conectado y con el servidor mandando `chat:init`. */
async function abrirChatEnVivo(alRecibir?: SocketFalso["alRecibir"]) {
  await iniciarSesion();
  await render(<LiveChatScreen />);
  const s = socket();
  s.alRecibir = alRecibir;
  await s.envia("connect");
  return s;
}

/** Deja la conversación activa con un asesor ("Ana"). */
async function conversacionActiva(conversationId = 55) {
  const s = await abrirChatEnVivo();
  await s.envia("chat:queued", { conversationId, position: 2 });
  await s.envia("chat:started", { agentName: "Ana", conversationId });
  return s;
}

const mensajeDelAsesor = (content: string) => ({ content, senderType: "agent", createdAt: "2026-10-25T18:00:00.000Z" });

describe("integración chatbot: chat en vivo (Socket.io simulado)", () => {
  it("con sesión conecta solo al namespace /contact por websocket, con el token, y pide iniciar el chat", async () => {
    await iniciarSesion("jwt-A");
    await render(<LiveChatScreen />);

    expect(screen.getByText("Conectando con un asesor…")).toBeTruthy();
    expect(io).toHaveBeenCalledTimes(1);
    expect(socket().url).toMatch(/\/contact$/);
    expect(socket().opciones).toMatchObject({ transports: ["websocket"], auth: { token: "jwt-A" } });

    await socket().envia("connect");

    expect(socket().emitidosDe("chat:init")).toEqual([{}]);
  });

  it("fila → asesor → mensajes: el historial muestra lo que escribe el cliente y lo que responde el asesor", async () => {
    const s = await abrirChatEnVivo();

    await s.envia("chat:queued", { conversationId: 55, position: 2 });
    expect(screen.getByText("Estamos buscando un asesor")).toBeTruthy();
    expect(screen.getByText(queueText(2))).toBeTruthy();

    await s.envia("chat:position", { position: 1 });
    expect(screen.getByText(queueText(1))).toBeTruthy();

    await s.envia("chat:started", { agentName: "Ana", conversationId: 55 });
    expect(screen.getByText("Asesor: Ana")).toBeTruthy();
    expect(screen.getByText("Ana se unió a la conversación.")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "Hola, busco una laptop");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));
    expect(s.emitidosDe("chat:message")).toEqual([{ content: "Hola, busco una laptop" }]);
    expect(screen.getByLabelText("Tú: Hola, busco una laptop")).toBeTruthy();

    await s.envia("chat:message", mensajeDelAsesor("¡Hola! Claro, ¿qué presupuesto tienes?"));
    expect(screen.getByLabelText("Asesor: ¡Hola! Claro, ¿qué presupuesto tienes?")).toBeTruthy();
  });

  it("muestra 'El asesor está escribiendo…' y lo apaga solo si no llegan más avisos", async () => {
    jest.useFakeTimers();
    const s = await conversacionActiva();

    await s.envia("chat:typing");
    expect(screen.getByText("El asesor está escribiendo…")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByText("El asesor está escribiendo…")).toBeNull();
  });

  it("el aviso de inactividad se contesta con 'Sigo aquí', que avisa al servidor", async () => {
    const s = await conversacionActiva();

    await s.envia("chat:warning", { reason: "inactivity", secondsLeft: 60 });
    expect(screen.getByText("¿Sigues ahí? La conversación se cerrará en 60 segundos por inactividad.")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Sigo aquí"));

    expect(s.emitidosDe("chat:ping")).toHaveLength(1);
    expect(screen.queryByText(/¿Sigues ahí\?/)).toBeNull();
  });

  it("si se pierde la conexión avisa, y al reconectar reanuda la misma conversación con su historial", async () => {
    const s = await conversacionActiva(55);
    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "hola");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));
    // El servidor, al recibir un chat:init con la conversación existente, la reanuda.
    s.alRecibir = (evento, datos, sk) => {
      if (evento === "chat:init" && datos?.existingConversationId === 55) {
        void sk.envia("chat:resumed", {
          conversationId: 55,
          messages: [
            { id_mensaje: 1, tipo_remitente: "client", contenido: "hola", created_at: "2026-10-25T18:00:00.000Z" },
            { id_mensaje: 2, tipo_remitente: "agent", contenido: "¡Hola! ¿En qué te ayudo?", created_at: "2026-10-25T18:00:05.000Z" },
          ],
        });
      }
    };

    await s.envia("disconnect", "transport close");
    expect(screen.getByText("Conexión perdida. Reconectando…")).toBeTruthy();

    await s.envia("connect");

    await waitFor(() => expect(screen.getByLabelText("Asesor: ¡Hola! ¿En qué te ayudo?")).toBeTruthy());
    expect(s.emitidosDe("chat:init")).toEqual([{}, { existingConversationId: 55 }]);
    expect(screen.getByLabelText("Tú: hola")).toBeTruthy();
  });

  it("si la reconexión se agota muestra el error con 'Reintentar', que abre una conexión nueva", async () => {
    const s = await abrirChatEnVivo();
    await s.envia("chat:queued", { conversationId: 55, position: 1 });

    await s.gestorEmite("reconnect_failed");

    expect(screen.getByText("No pudimos conectar el chat")).toBeTruthy();
    expect(screen.getByText("No se pudo conectar con el chat. Revisa tu internet e intenta de nuevo.")).toBeTruthy();
    expect(s.desconectado).toBe(true);

    await fireEvent.press(screen.getByLabelText("Reintentar"));

    expect(io).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Conectando con un asesor…")).toBeTruthy();
    expect(sockets[1]).not.toBe(sockets[0]);
  });

  it("un error del servidor al conectar muestra su mensaje y permite reintentar o ver el contacto", async () => {
    const s = await abrirChatEnVivo();

    await s.envia("chat:error", { message: "Demasiadas solicitudes. Intenta más tarde." });

    expect(screen.getByText("No pudimos conectar el chat")).toBeTruthy();
    expect(screen.getByText("Demasiadas solicitudes. Intenta más tarde.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Ver contacto"));
    expect(push).toHaveBeenCalledWith("/contact");
  });

  it("fuera de horario muestra el horario de atención, cierra el socket y ofrece el contacto", async () => {
    const s = await abrirChatEnVivo();

    await s.envia("chat:unavailable", {
      reason: "closed",
      hours: {
        lunes: { inicio: "09:00", fin: "18:00", activo: true },
        domingo: { inicio: "", fin: "", activo: false },
      },
    });

    expect(screen.getByText("Fuera de horario")).toBeTruthy();
    expect(screen.getByText("Lunes")).toBeTruthy();
    expect(screen.getByText("09:00 – 18:00")).toBeTruthy();
    expect(screen.getByText("Domingo")).toBeTruthy();
    expect(screen.getByText("Cerrado")).toBeTruthy();
    expect(s.desconectado).toBe(true);

    await fireEvent.press(screen.getByLabelText("Ver contacto"));
    expect(push).toHaveBeenCalledWith("/contact");
  });

  it("sin asesores disponibles lo explica", async () => {
    const s = await abrirChatEnVivo();

    await s.envia("chat:unavailable", { reason: "no_agent", hours: null });

    expect(screen.getByText("No hay asesores disponibles")).toBeTruthy();
    expect(s.desconectado).toBe(true);
  });

  it("cuando el asesor cierra la conversación, la pantalla lo dice y 'Nueva conversación' conecta de nuevo", async () => {
    const s = await conversacionActiva();

    await s.envia("chat:closed", { reason: "agent" });

    expect(screen.getByText("Conversación terminada")).toBeTruthy();
    expect(screen.getByText("El asesor cerró la conversación.")).toBeTruthy();
    expect(s.desconectado).toBe(true);

    await fireEvent.press(screen.getByLabelText("Nueva conversación"));

    expect(io).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Conectando con un asesor…")).toBeTruthy();
  });

  it("'Terminar chat' avisa al servidor, desconecta y vuelve atrás", async () => {
    const s = await conversacionActiva();

    await fireEvent.press(screen.getByLabelText("Terminar chat"));

    expect(s.emitidosDe("chat:leave")).toHaveLength(1);
    expect(s.desconectado).toBe(true);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("'Salir de la fila' avisa al servidor y vuelve atrás", async () => {
    const s = await abrirChatEnVivo();
    await s.envia("chat:queued", { conversationId: 55, position: 3 });

    await fireEvent.press(screen.getByLabelText("Salir de la fila"));

    expect(s.emitidosDe("chat:leave")).toHaveLength(1);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("salir de la pantalla con la conversación activa la termina (deja de escuchar al servidor)", async () => {
    await iniciarSesion();
    const pantalla = await render(<LiveChatScreen />);
    const s = socket();
    await s.envia("connect");
    await s.envia("chat:queued", { conversationId: 55, position: 1 });
    await s.envia("chat:started", { agentName: "Ana", conversationId: 55 });

    await pantalla.unmount();

    expect(s.emitidosDe("chat:leave")).toHaveLength(1);
    expect(s.desconectado).toBe(true);
  });

  it("tras terminar el chat, un mensaje tardío del servidor no entra al historial", async () => {
    await iniciarSesion();
    const { result } = await renderHook(() => useLiveChat());
    await act(async () => {
      result.current.start();
    });
    const s = socket();
    await s.envia("connect");
    await s.envia("chat:queued", { conversationId: 55, position: 1 });
    await s.envia("chat:started", { agentName: "Ana", conversationId: 55 });
    expect(result.current.state.status).toBe("active");

    await act(async () => {
      result.current.leave();
    });
    await s.envia("chat:message", mensajeDelAsesor("mensaje tardío"));

    expect(result.current.state.messages).toEqual([]);
    expect(result.current.state.status).toBe("idle");
  });

  it("sin cuenta pide nombre y correo, valida y conecta sin token con los datos de invitado", async () => {
    await render(<LiveChatScreen />);

    expect(screen.getByText("Chatea con un asesor")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Iniciar chat"));
    expect(io).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Nombre"), "Luis");
    await fireEvent.changeText(screen.getByLabelText("Correo electrónico"), "luis@example.com");
    await fireEvent.press(screen.getByLabelText("Iniciar chat"));

    expect(io).toHaveBeenCalledTimes(1);
    expect(socket().opciones).toMatchObject({ transports: ["websocket"], auth: {} });
    await socket().envia("connect");
    expect(socket().emitidosDe("chat:init")).toEqual([{ guestName: "Luis", guestEmail: "luis@example.com" }]);
  });
});
