import { act, fireEvent, render, screen } from "@testing-library/react-native";

import RegisterScreen from "@/app/(auth)/register";
import { authRepository } from "@/features/auth/repositories/authRepository";

import { reiniciarSesion } from "../utils/authHooksSetup";
import { usarQueryWrapper } from "../utils/queryWrapper";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-test") }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));
jest.mock("@/features/auth/repositories/authRepository", () => ({
  authRepository: { register: jest.fn() },
}));

const repo = authRepository as jest.Mocked<typeof authRepository>;
const { wrapper } = usarQueryWrapper();

const abrir = async () => {
  await render(<RegisterScreen />, { wrapper });
};
const llenarFormulario = async () => {
  await escribir("Juan", "Juan");
  await escribir("García", "García");
  await escribir("López", "López");
  await escribir("tu@email.com", "juan@correo.com");
  await escribir("7711234567", "7711234567");
  await escribir("Crea una contraseña", "Secreta1!");
  await escribir("Repite la contraseña", "Secreta1!");
};
// «Crear cuenta» aparece como título y como botón: el botón es el último.
const tocarCrearCuenta = () => fireEvent.press(screen.getAllByText("Crear cuenta").at(-1)!);
const escribir = (placeholder: string, valor: string) =>
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), valor);

beforeEach(async () => {
  mockPush.mockReset();
  mockReplace.mockReset();
  repo.register.mockReset();
  await reiniciarSesion();
});

describe("Registro: aceptación de términos y política", () => {
  it("el texto de aceptación completo se conserva", async () => {
    await abrir();

    expect(
      screen.getByText(/Acepto los Términos y Condiciones de uso del servicio y la Política de privacidad/),
    ).toBeTruthy();
  });

  it("«Términos y Condiciones» es un enlace que abre /policies con su sección", async () => {
    await abrir();

    const enlace = screen.getByRole("link", { name: "Términos y Condiciones" });
    await fireEvent.press(enlace);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/policies", params: { seccion: "terminos_condiciones" } });
  });

  it("«Política de privacidad» es un enlace que abre /policies con su sección", async () => {
    await abrir();

    await fireEvent.press(screen.getByRole("link", { name: "Política de privacidad" }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/policies", params: { seccion: "politicas_privacidad" } });
  });

  it("tocar un enlace no marca la casilla de aceptación", async () => {
    await abrir();
    await llenarFormulario();

    await fireEvent.press(screen.getByRole("link", { name: "Términos y Condiciones" }));
    await tocarCrearCuenta();

    expect(repo.register).not.toHaveBeenCalled();
  });

  it("el registro sigue funcionando igual: acepta, envía y va a verificar el código", async () => {
    repo.register.mockResolvedValueOnce(undefined);
    await abrir();
    await llenarFormulario();
    await fireEvent.press(screen.getByText(/Acepto los/));

    await act(async () => {
      await tocarCrearCuenta();
    });

    expect(repo.register).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(auth)/verify-code",
      params: { correo: "juan@correo.com", tipo: "registro" },
    });
  });
});
