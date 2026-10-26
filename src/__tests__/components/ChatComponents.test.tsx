import { fireEvent, render, screen } from "@testing-library/react-native";

import ChatBubble from "@/features/chatbot/components/ChatBubble";
import ChatComposer from "@/features/chatbot/components/ChatComposer";
import type { ChatMessage } from "@/features/chatbot/types";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "1",
  role: "user",
  content: "hola",
  ...over,
});

describe("ChatBubble", () => {
  it("muestra el mensaje del usuario con su etiqueta", async () => {
    await render(<ChatBubble message={msg()} onRetry={jest.fn()} />);

    expect(screen.getByText("hola")).toBeTruthy();
    expect(screen.getByLabelText("Tú: hola")).toBeTruthy();
  });

  it("en la respuesta del asistente quita los asteriscos y deja las negritas", async () => {
    await render(
      <ChatBubble message={msg({ role: "assistant", content: "**Lunes:** 09:00\n- Martes" })} onRetry={jest.fn()} />,
    );

    expect(screen.getByLabelText("Asistente: Lunes: 09:00\n• Martes")).toBeTruthy();
    expect(screen.getByText("Lunes:")).toBeTruthy();
  });

  it("un mensaje del usuario no interpreta el markdown", async () => {
    await render(<ChatBubble message={msg({ content: "**hola**" })} onRetry={jest.fn()} />);

    expect(screen.getByText("**hola**")).toBeTruthy();
  });

  it("sin fallo no ofrece reintentar", async () => {
    await render(<ChatBubble message={msg()} onRetry={jest.fn()} />);

    expect(screen.queryByLabelText("Reintentar envío")).toBeNull();
  });

  it("sin onRetry no ofrece reintentar aunque haya fallado", async () => {
    await render(<ChatBubble message={msg({ failed: true })} />);

    expect(screen.queryByLabelText("Reintentar envío")).toBeNull();
  });

  it("si el envío falló, tocar el aviso reintenta", async () => {
    const onRetry = jest.fn();
    await render(<ChatBubble message={msg({ failed: true })} onRetry={onRetry} />);

    await fireEvent.press(screen.getByLabelText("Reintentar envío"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("ChatComposer", () => {
  it("sin texto no deja enviar", async () => {
    const onSend = jest.fn();
    await render(<ChatComposer onSend={onSend} sending={false} />);

    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("envía el texto y vacía la caja cuando salió", async () => {
    const onSend = jest.fn().mockReturnValue(null);
    await render(<ChatComposer onSend={onSend} sending={false} />);
    const input = screen.getByLabelText("Mensaje");

    await fireEvent.changeText(input, "¿Qué laptops tienen?");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));

    expect(onSend).toHaveBeenCalledWith("¿Qué laptops tienen?");
    expect(screen.getByLabelText("Mensaje").props.value).toBe("");
  });

  it("si no se pudo enviar conserva el texto y muestra el motivo", async () => {
    const onSend = jest.fn().mockReturnValue("Espera la respuesta anterior.");
    await render(<ChatComposer onSend={onSend} sending={false} />);

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "hola");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));

    expect(screen.getByLabelText("Mensaje").props.value).toBe("hola");
    expect(screen.getByText("Espera la respuesta anterior.")).toBeTruthy();
  });

  it("mientras espera una respuesta no deja enviar", async () => {
    const onSend = jest.fn();
    await render(<ChatComposer onSend={onSend} sending />);

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "hola");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("muestra el contador al acercarse al límite de 500", async () => {
    await render(<ChatComposer onSend={jest.fn()} sending={false} />);

    expect(screen.queryByText(/\/500$/)).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "a".repeat(450));

    expect(screen.getByText("450/500")).toBeTruthy();
  });

  it("con otro largo máximo el contador usa ese límite (chat en vivo: 1000)", async () => {
    await render(<ChatComposer onSend={jest.fn()} sending={false} maxLength={1000} />);

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "a".repeat(799));
    expect(screen.queryByText(/\/1000$/)).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "a".repeat(800));
    expect(screen.getByText("800/1000")).toBeTruthy();
  });

  it("acepta un texto de ayuda distinto", async () => {
    await render(<ChatComposer onSend={jest.fn()} sending={false} placeholder="Escribe a tu asesor…" />);

    expect(screen.getByPlaceholderText("Escribe a tu asesor…")).toBeTruthy();
  });

  it("avisa en cada cambio del texto para poder notificar que se está escribiendo", async () => {
    const onTyping = jest.fn();
    await render(<ChatComposer onSend={jest.fn()} sending={false} onTyping={onTyping} />);

    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "h");
    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "ho");

    expect(onTyping).toHaveBeenCalledTimes(2);
  });
});

describe("ChatBubble: mensajes de personas", () => {
  it("con plain no interpreta el markdown", async () => {
    await render(
      <ChatBubble message={msg({ role: "assistant", content: "**Lunes:** 9" })} onRetry={jest.fn()} plain />,
    );

    expect(screen.getByText("**Lunes:** 9")).toBeTruthy();
  });

  it("label cambia quién habla para lectores de pantalla", async () => {
    await render(<ChatBubble message={msg({ role: "assistant", content: "hola" })} onRetry={jest.fn()} label="Asesor" />);

    expect(screen.getByLabelText("Asesor: hola")).toBeTruthy();
  });
});
