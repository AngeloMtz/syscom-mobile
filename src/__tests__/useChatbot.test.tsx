import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Crypto from "expo-crypto";

import { useChatStore } from "@/features/chatbot/chatStore";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";
import { chatbotRepository } from "@/features/chatbot/repositories/chatbotRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeUser } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("@/features/chatbot/repositories/chatbotRepository", () => ({
  chatbotRepository: { sendMessage: jest.fn() },
}));

const repo = chatbotRepository as jest.Mocked<typeof chatbotRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  (Crypto.randomUUID as jest.Mock).mockReturnValue("uuid-test");
  useChatStore.getState().reset();
  useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false });
});

const enviar = async (result: { current: ReturnType<typeof useChatbot> }, texto: string) => {
  let motivo: string | null = null;
  await act(async () => {
    motivo = result.current.send(texto);
  });
  return motivo;
};

describe("useChatbot.send", () => {
  it("muestra el mensaje del usuario, pide la respuesta y la agrega al historial", async () => {
    repo.sendMessage.mockResolvedValueOnce({ message: "Claro, ¿qué buscas?", escalate: false });
    const { result } = await renderHook(() => useChatbot(), { wrapper });

    const motivo = await enviar(result, "  hola  ");

    expect(motivo).toBeNull();
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "hola"],
      ["assistant", "Claro, ¿qué buscas?"],
    ]);
    expect(repo.sendMessage).toHaveBeenCalledWith("uuid-test", "hola", undefined);
    expect(result.current.isSending).toBe(false);
    expect(result.current.escalated).toBe(false);
  });

  it("manda el nombre del usuario si hay sesión", async () => {
    repo.sendMessage.mockResolvedValueOnce({ message: "Hola Luis", escalate: false });
    useAuthStore.setState({ user: makeUser({ nombre: "Luis" }), isAuthenticated: true });
    const { result } = await renderHook(() => useChatbot(), { wrapper });

    await enviar(result, "hola");

    await waitFor(() => expect(repo.sendMessage).toHaveBeenCalledWith("uuid-test", "hola", "Luis"));
  });

  it("un mensaje vacío no se envía y devuelve el motivo", async () => {
    const { result } = await renderHook(() => useChatbot(), { wrapper });

    const motivo = await enviar(result, "   ");

    expect(motivo).toBe("Escribe un mensaje.");
    expect(repo.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it("mientras espera la respuesta no deja enviar otro mensaje", async () => {
    repo.sendMessage.mockReturnValueOnce(new Promise(() => {}));
    const { result } = await renderHook(() => useChatbot(), { wrapper });
    await enviar(result, "primero");
    await waitFor(() => expect(result.current.isSending).toBe(true));

    const motivo = await enviar(result, "segundo");

    expect(motivo).toBe("Espera la respuesta anterior.");
    expect(repo.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("si el cliente pide hablar con una persona, queda marcado como escalado", async () => {
    repo.sendMessage.mockResolvedValueOnce({ message: "Te conectaré con un asesor.", escalate: true });
    const { result } = await renderHook(() => useChatbot(), { wrapper });

    await enviar(result, "quiero hablar con alguien");

    await waitFor(() => expect(result.current.escalated).toBe(true));
  });
});

describe("useChatbot.retry", () => {
  it("si falla el envío marca el mensaje y expone el error del servidor", async () => {
    repo.sendMessage.mockRejectedValueOnce(makeApiError({ status: 429, message: "Demasiadas solicitudes." }));
    const { result } = await renderHook(() => useChatbot(), { wrapper });

    await enviar(result, "hola");

    await waitFor(() => expect(result.current.error).toBe("Demasiadas solicitudes."));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].failed).toBe(true);
  });

  it("reintenta el mensaje fallido sin duplicarlo y agrega la respuesta", async () => {
    repo.sendMessage
      .mockRejectedValueOnce(makeApiError({ status: 500, message: "Error del servidor" }))
      .mockResolvedValueOnce({ message: "Ahora sí", escalate: false });
    const { result } = await renderHook(() => useChatbot(), { wrapper });
    await enviar(result, "hola");
    await waitFor(() => expect(result.current.messages[0].failed).toBe(true));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages.map((m) => [m.role, m.content, !!m.failed])).toEqual([
      ["user", "hola", false],
      ["assistant", "Ahora sí", false],
    ]);
    expect(repo.sendMessage).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it("sin mensajes fallidos no hace nada", async () => {
    const { result } = await renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      result.current.retry();
    });

    expect(repo.sendMessage).not.toHaveBeenCalled();
  });

  it("mientras hay un envío en curso no reintenta", async () => {
    repo.sendMessage.mockReturnValueOnce(new Promise(() => {}));
    const { result } = await renderHook(() => useChatbot(), { wrapper });
    await enviar(result, "hola");
    await waitFor(() => expect(result.current.isSending).toBe(true));
    await act(async () => {
      useChatStore.getState().setFailed(result.current.messages[0].id, true);
    });

    await act(async () => {
      result.current.retry();
    });

    expect(repo.sendMessage).toHaveBeenCalledTimes(1);
  });
});
