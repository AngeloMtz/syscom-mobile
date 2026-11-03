import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRouter } from "expo-router";

import ProfileTab from "@/app/profile/index";
import { useProfile } from "@/features/profile/hooks/useProfile";

jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
// La sesión no es lo que se prueba aquí: RequireAuth deja pasar a los hijos.
jest.mock("@/features/auth/components/RequireAuth", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/features/auth/hooks/useLogout", () => ({ useLogout: () => jest.fn() }));
jest.mock("@/features/profile/hooks/useProfile", () => ({ useProfile: jest.fn() }));

const push = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push });
  (useProfile as jest.Mock).mockReturnValue({
    data: { nombre: "Ana" },
    isPending: false,
    isError: false,
  });
});

describe("Mi cuenta", () => {
  it.each([
    "Cambiar contraseña",
    "Autenticación 2FA",
    "Métodos de pago",
    "Facturación",
    "Aportaciones",
    "Ayuda",
  ])("no muestra la opción sin desarrollar «%s»", async (etiqueta) => {
    await render(<ProfileTab />);

    expect(screen.queryByText(etiqueta)).toBeNull();
  });

  it("no muestra ninguna opción marcada como «Próximamente»", async () => {
    await render(<ProfileTab />);

    expect(screen.queryByText("Próximamente")).toBeNull();
  });

  it.each([
    ["Datos personales", "/profile/personal-data"],
    ["Mis direcciones", "/addresses"],
    ["Mis pedidos", "/orders"],
    ["Favoritos", "/favorites"],
    ["Mis reseñas", "/reviews"],
    ["Información", "/informacion"],
    ["Notificaciones", "/notifications"],
  ])("conserva «%s» y navega a %s", async (etiqueta, ruta) => {
    await render(<ProfileTab />);

    await fireEvent.press(screen.getByText(etiqueta));

    expect(push).toHaveBeenCalledWith(ruta);
  });

  it("conserva los tres títulos de sección y el cierre de sesión", async () => {
    await render(<ProfileTab />);

    expect(screen.getByText("MI CUENTA")).toBeTruthy();
    expect(screen.getByText("COMPRAS")).toBeTruthy();
    expect(screen.getByText("MÁS")).toBeTruthy();
    expect(screen.getByLabelText("Cerrar sesión")).toBeTruthy();
  });
});
