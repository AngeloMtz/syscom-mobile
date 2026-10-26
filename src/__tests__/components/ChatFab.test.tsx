import { fireEvent, render, screen } from "@testing-library/react-native";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatFab from "@/features/chatbot/components/ChatFab";
import { spacing } from "@/shared/theme/useColors";

// Los íconos se simulan como texto con el nombre del ícono.
jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("expo-router", () => ({ usePathname: jest.fn(), useRouter: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: jest.fn() }));

const pathname = usePathname as jest.Mock;
const router = useRouter as jest.Mock;
const insets = useSafeAreaInsets as jest.Mock;

const push = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  router.mockReturnValue({ push });
  insets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
});

describe("ChatFab", () => {
  it.each(["/", "/catalog", "/services", "/more", "/favorites"])("se muestra en %s", async (ruta) => {
    pathname.mockReturnValue(ruta);
    await render(<ChatFab />);

    expect(screen.getByLabelText("Abrir asistente virtual")).toBeTruthy();
    expect(screen.getByText("chatbubble-ellipses")).toBeTruthy();
  });

  it("se oculta en el carrito para no tapar el pago", async () => {
    pathname.mockReturnValue("/cart");
    await render(<ChatFab />);

    expect(screen.queryByLabelText("Abrir asistente virtual")).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("al tocarlo abre el asistente", async () => {
    pathname.mockReturnValue("/");
    await render(<ChatFab />);

    await fireEvent.press(screen.getByLabelText("Abrir asistente virtual"));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/chatbot");
  });

  it("queda sobre la barra de pestañas: su altura (49) más el área segura inferior y el margen", async () => {
    pathname.mockReturnValue("/");
    insets.mockReturnValue({ top: 0, bottom: 20, left: 0, right: 0 });
    await render(<ChatFab />);

    const estilo = StyleSheet.flatten(screen.getByLabelText("Abrir asistente virtual").props.style);
    expect(estilo.bottom).toBe(49 + 20 + spacing.lg);
  });

  it("sin área segura inferior solo suma la barra y el margen", async () => {
    pathname.mockReturnValue("/");
    await render(<ChatFab />);

    const estilo = StyleSheet.flatten(screen.getByLabelText("Abrir asistente virtual").props.style);
    expect(estilo.bottom).toBe(49 + spacing.lg);
  });

  it("reacciona al cambio de pantalla: aparece al salir del carrito", async () => {
    pathname.mockReturnValue("/cart");
    const { rerender } = await render(<ChatFab />);
    expect(screen.queryByLabelText("Abrir asistente virtual")).toBeNull();

    pathname.mockReturnValue("/catalog");
    await rerender(<ChatFab />);

    expect(screen.getByLabelText("Abrir asistente virtual")).toBeTruthy();
  });
});
