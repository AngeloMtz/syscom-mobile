import { fireEvent, render, screen } from "@testing-library/react-native";

import PoliciesScreen from "@/app/policies";

let mockParams: { seccion?: string } = {};

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({ useLocalSearchParams: () => mockParams }));
jest.mock("@/shared/ui/HtmlContent", () => {
  const { Text } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ html }: { html: string }) => <Text>{html}</Text> };
});
jest.mock("@/features/institutional/hooks/useInstitutional", () => ({
  usePolicies: () => ({
    data: [
      { tipo: "politicas_privacidad", titulo: "Política de privacidad", contenido: "TEXTO-PRIVACIDAD" },
      { tipo: "terminos_condiciones", titulo: "Términos y condiciones", contenido: "TEXTO-TERMINOS" },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

const abrir = async (params: { seccion?: string } = {}) => {
  mockParams = params;
  await render(<PoliciesScreen />);
};

describe("Pantalla de políticas", () => {
  it("sin parámetro abre la primera sección, como siempre", async () => {
    await abrir();

    expect(screen.getByText("TEXTO-PRIVACIDAD")).toBeTruthy();
    expect(screen.queryByText("TEXTO-TERMINOS")).toBeNull();
  });

  it("con seccion=terminos_condiciones expande los términos", async () => {
    await abrir({ seccion: "terminos_condiciones" });

    expect(screen.getByText("TEXTO-TERMINOS")).toBeTruthy();
    expect(screen.queryByText("TEXTO-PRIVACIDAD")).toBeNull();
  });

  it("con seccion=politicas_privacidad expande la privacidad", async () => {
    await abrir({ seccion: "politicas_privacidad" });

    expect(screen.getByText("TEXTO-PRIVACIDAD")).toBeTruthy();
    expect(screen.queryByText("TEXTO-TERMINOS")).toBeNull();
  });

  it("un valor desconocido se comporta como sin parámetro", async () => {
    await abrir({ seccion: "otra-cosa" });

    expect(screen.getByText("TEXTO-PRIVACIDAD")).toBeTruthy();
    expect(screen.queryByText("TEXTO-TERMINOS")).toBeNull();
  });

  it("el usuario puede cambiar de sección después de entrar con parámetro", async () => {
    await abrir({ seccion: "terminos_condiciones" });

    await fireEvent.press(screen.getByText("Política de privacidad"));

    expect(screen.getByText("TEXTO-PRIVACIDAD")).toBeTruthy();
    expect(screen.queryByText("TEXTO-TERMINOS")).toBeNull();
  });

  it("tocar la sección abierta la contrae", async () => {
    await abrir();

    await fireEvent.press(screen.getByText("Política de privacidad"));

    expect(screen.queryByText("TEXTO-PRIVACIDAD")).toBeNull();
  });
});
