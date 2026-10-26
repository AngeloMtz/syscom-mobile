import * as Crypto from "expo-crypto";

import { useChatStore } from "@/features/chatbot/chatStore";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));

const randomUUID = Crypto.randomUUID as jest.Mock;

beforeEach(() => {
  randomUUID.mockReset();
  useChatStore.getState().reset();
});

describe("useChatStore", () => {
  it("ensureSession crea un UUID la primera vez y reutiliza el mismo después", () => {
    randomUUID.mockReturnValue("uuid-1");

    expect(useChatStore.getState().ensureSession()).toBe("uuid-1");
    expect(useChatStore.getState().ensureSession()).toBe("uuid-1");
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("addMessage agrega mensajes en orden, con rol, contenido e id distintos", () => {
    const { addMessage } = useChatStore.getState();

    const uno = addMessage("user", "hola");
    const dos = addMessage("assistant", "¿en qué te ayudo?");

    expect(uno.id).not.toBe(dos.id);
    expect(useChatStore.getState().messages).toEqual([
      { id: uno.id, role: "user", content: "hola" },
      { id: dos.id, role: "assistant", content: "¿en qué te ayudo?" },
    ]);
  });

  it("setFailed marca y desmarca solo el mensaje indicado", () => {
    const { addMessage, setFailed } = useChatStore.getState();
    const uno = addMessage("user", "uno");
    const dos = addMessage("user", "dos");

    setFailed(dos.id, true);
    expect(useChatStore.getState().messages.map((m) => !!m.failed)).toEqual([false, true]);

    setFailed(dos.id, false);
    expect(useChatStore.getState().messages.map((m) => !!m.failed)).toEqual([false, false]);
    expect(useChatStore.getState().messages[0].id).toBe(uno.id);
  });

  it("setEscalated cambia el estado de escalamiento", () => {
    useChatStore.getState().setEscalated(true);
    expect(useChatStore.getState().escalated).toBe(true);
  });

  it("reset borra la conversación y la próxima sesión usa un UUID nuevo", () => {
    randomUUID.mockReturnValueOnce("uuid-1").mockReturnValueOnce("uuid-2");
    const { ensureSession, addMessage, setEscalated, reset } = useChatStore.getState();
    ensureSession();
    addMessage("user", "hola");
    setEscalated(true);

    reset();

    expect(useChatStore.getState()).toMatchObject({ sessionId: null, messages: [], escalated: false });
    expect(useChatStore.getState().ensureSession()).toBe("uuid-2");
  });
});
