import {
  CHATBOT_FALLBACK_REPLY,
  CHATBOT_TIMEOUT_MS,
  chatbotRepository,
} from "@/features/chatbot/repositories/chatbotRepository";

import { makeApiError } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

const SESION = "9b2c1f4e-3a5d-4c7b-8e1f-0a1b2c3d4e5f";

beforeEach(() => {
  adapter.mockReset();
});

describe("chatbotRepository.sendMessage", () => {
  it("envía POST /chatbot/message con sessionId y mensaje, y devuelve la respuesta", async () => {
    responde({ data: { message: "Tenemos laptops desde $8,000.", escalate: false } });

    const resultado = await chatbotRepository.sendMessage(SESION, "¿Qué laptops tienen?");

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/chatbot/message" });
    expect(cuerpo).toEqual({ sessionId: SESION, mensaje: "¿Qué laptops tienen?" });
    expect(resultado).toEqual({ message: "Tenemos laptops desde $8,000.", escalate: false });
  });

  it("manda nombreUsuario solo si hay uno", async () => {
    responde({ data: { message: "Hola Luis", escalate: false } });

    await chatbotRepository.sendMessage(SESION, "hola", "Luis");

    expect(ultimaPeticion().cuerpo).toEqual({ sessionId: SESION, mensaje: "hola", nombreUsuario: "Luis" });
  });

  it("da más tiempo que el timeout general porque el bot consulta la base antes de responder", async () => {
    responde({ data: { message: "ok", escalate: false } });

    await chatbotRepository.sendMessage(SESION, "hola");

    const config = adapter.mock.calls[adapter.mock.calls.length - 1][0];
    expect(config.timeout).toBe(CHATBOT_TIMEOUT_MS);
    expect(CHATBOT_TIMEOUT_MS).toBeGreaterThan(15000);
  });

  it("detecta cuando el cliente pide hablar con una persona", async () => {
    responde({ data: { message: "Entendido, te conectaré con uno de nuestros asesores.", escalate: true } });

    const resultado = await chatbotRepository.sendMessage(SESION, "quiero hablar con alguien");

    expect(resultado.escalate).toBe(true);
  });

  it("si la respuesta viene vacía o incompleta usa un mensaje por defecto", async () => {
    responde({ data: { message: "   " } });
    expect(await chatbotRepository.sendMessage(SESION, "hola")).toEqual({
      message: CHATBOT_FALLBACK_REPLY,
      escalate: false,
    });

    responde({});
    expect(await chatbotRepository.sendMessage(SESION, "hola")).toEqual({
      message: CHATBOT_FALLBACK_REPLY,
      escalate: false,
    });
  });

  it("rechaza con el error de la API (por ejemplo, el límite de peticiones)", async () => {
    const error = makeApiError({ status: 429, message: "Demasiadas solicitudes." });
    adapter.mockRejectedValueOnce(error);

    await expect(chatbotRepository.sendMessage(SESION, "hola")).rejects.toBe(error);
  });
});
