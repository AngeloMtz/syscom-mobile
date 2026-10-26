import { fireEvent, render, screen } from "@testing-library/react-native";

import LiveGuestForm from "@/features/chatbot/components/LiveGuestForm";
import LiveMessageBubble from "@/features/chatbot/components/LiveMessageBubble";
import type { LiveMessage } from "@/features/chatbot/liveChat/types";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const T = "2026-10-26T12:00:00.000Z";
const msg = (over: Partial<LiveMessage> = {}): LiveMessage => ({
  id: "1",
  from: "client",
  content: "hola",
  createdAt: T,
  ...over,
});

describe("LiveMessageBubble", () => {
  it("el mensaje del cliente es una burbuja 'Tú'", async () => {
    await render(<LiveMessageBubble message={msg()} />);

    expect(screen.getByLabelText("Tú: hola")).toBeTruthy();
  });

  it("el mensaje del asesor es una burbuja 'Asesor' y su texto va tal cual, sin markdown", async () => {
    await render(<LiveMessageBubble message={msg({ from: "agent", content: "Hola **Luis**" })} />);

    expect(screen.getByLabelText("Asesor: Hola **Luis**")).toBeTruthy();
  });

  it("el mensaje del sistema es un aviso, no una burbuja", async () => {
    await render(<LiveMessageBubble message={msg({ from: "system", content: "Ana se unió a la conversación." })} />);

    expect(screen.getByText("Ana se unió a la conversación.")).toBeTruthy();
    expect(screen.queryByLabelText(/^(Tú|Asesor):/)).toBeNull();
  });
});

describe("LiveGuestForm", () => {
  it("con los campos vacíos muestra los errores y no continúa", async () => {
    const onSubmit = jest.fn();
    await render(<LiveGuestForm onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByLabelText("Iniciar chat"));

    expect(screen.getByText("Escribe tu nombre.")).toBeTruthy();
    expect(screen.getByText("Escribe tu correo.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("con un correo inválido solo marca el correo", async () => {
    const onSubmit = jest.fn();
    await render(<LiveGuestForm onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText("Nombre"), "Luis");
    await fireEvent.changeText(screen.getByLabelText("Correo electrónico"), "luis@");
    await fireEvent.press(screen.getByLabelText("Iniciar chat"));

    expect(screen.getByText("Correo inválido.")).toBeTruthy();
    expect(screen.queryByText("Escribe tu nombre.")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("con datos válidos los entrega recortados y quita los errores", async () => {
    const onSubmit = jest.fn();
    await render(<LiveGuestForm onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByLabelText("Iniciar chat"));

    await fireEvent.changeText(screen.getByLabelText("Nombre"), "  Luis  ");
    await fireEvent.changeText(screen.getByLabelText("Correo electrónico"), " luis@correo.com ");
    await fireEvent.press(screen.getByLabelText("Iniciar chat"));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Luis", email: "luis@correo.com" });
    expect(screen.queryByText("Escribe tu nombre.")).toBeNull();
  });
});
