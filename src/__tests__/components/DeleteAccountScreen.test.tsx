import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";

import DeleteAccountScreen from "@/app/profile/delete-account";
import { profileRepository } from "@/features/profile/repositories/profileRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError } from "../fixtures";
import { reiniciarSesion } from "../utils/authHooksSetup";
import { usarQueryWrapper } from "../utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-test") }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({ Redirect: () => null, useRouter: jest.fn() }));
jest.mock("@/features/notifications/pushRegistration", () => ({ unregisterDevicePush: jest.fn() }));
jest.mock("@/features/profile/repositories/profileRepository", () => ({
  profileRepository: { deleteAccount: jest.fn() },
}));

const repo = profileRepository as jest.Mocked<typeof profileRepository>;
const { wrapper } = usarQueryWrapper();

type BotonAlerta = { text: string; onPress?: () => unknown };

let alerta: jest.SpyInstance;

const abrir = async () => {
  await render(<DeleteAccountScreen />, { wrapper });
};
const escribir = async (valor: string) => {
  await fireEvent.changeText(screen.getByPlaceholderText("Tu contraseña"), valor);
};
const tocarEliminar = () => fireEvent.press(screen.getByLabelText("Eliminar mi cuenta"));
const botonesConfirmacion = () => alerta.mock.calls[0][2] as BotonAlerta[];
const confirmar = async () => {
  await act(async () => {
    await botonesConfirmacion().find((b) => b.text === "Eliminar")?.onPress?.();
  });
};

beforeEach(async () => {
  // Solo este mock: resetearlos todos rompe los de React Native que usa KeyboardAvoidingView.
  repo.deleteAccount.mockReset();
  await reiniciarSesion();
  useAuthStore.setState({ isAuthenticated: true });
  alerta = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  alerta.mockRestore();
});

describe("Eliminar cuenta", () => {
  it("explica las consecuencias antes de pedir nada", async () => {
    await abrir();

    expect(screen.getByText("Esta acción no se puede deshacer")).toBeTruthy();
    expect(screen.getByText(/Tus pedidos terminados y sus pagos se conservan/)).toBeTruthy();
    expect(screen.getByText(/pedidos o servicios en curso/)).toBeTruthy();
  });

  it("el aviso dice que también se conservan los pagos, sin datos personales", async () => {
    await abrir();

    expect(screen.getByText(/pedidos terminados y sus pagos se conservan.*obligación legal.*sin tu nombre/)).toBeTruthy();
  });

  it("el enlace «Política de privacidad» abre la URL correcta", async () => {
    const abrirUrl = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await abrir();

    await fireEvent.press(screen.getByLabelText("Política de privacidad"));

    expect(abrirUrl).toHaveBeenCalledWith("https://syscom-frontend.vercel.app/policies");
    abrirUrl.mockRestore();
  });

  it("un 409 muestra siempre el mensaje de pedidos en curso, aunque el backend diga otra cosa", async () => {
    repo.deleteAccount.mockRejectedValueOnce(makeApiError({ status: 409, message: "Conflicto" }));
    await abrir();
    await escribir("Secreta1!");
    await tocarEliminar();

    await confirmar();

    expect(
      screen.getByText("Tienes pedidos o servicios en curso. Podrás eliminar tu cuenta cuando terminen."),
    ).toBeTruthy();
    expect(screen.queryByText("Conflicto")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("sin contraseña avisa y no pide confirmación ni llama al servidor", async () => {
    await abrir();

    await tocarEliminar();

    expect(screen.getByText("Escribe tu contraseña")).toBeTruthy();
    expect(alerta).not.toHaveBeenCalled();
    expect(repo.deleteAccount).not.toHaveBeenCalled();
  });

  it("con contraseña pide confirmación y todavía no llama al servidor", async () => {
    await abrir();
    await escribir("Secreta1!");

    await tocarEliminar();

    expect(alerta).toHaveBeenCalledTimes(1);
    expect(alerta.mock.calls[0][0]).toBe("¿Eliminar tu cuenta?");
    expect(botonesConfirmacion().map((b) => b.text)).toEqual(["Cancelar", "Eliminar"]);
    expect(repo.deleteAccount).not.toHaveBeenCalled();
  });

  it("cancelar no envía nada ni cierra la sesión", async () => {
    await abrir();
    await escribir("Secreta1!");
    await tocarEliminar();

    await act(async () => {
      botonesConfirmacion().find((b) => b.text === "Cancelar")?.onPress?.();
    });

    expect(repo.deleteAccount).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("al confirmar elimina con esa contraseña, cierra la sesión y lo avisa", async () => {
    repo.deleteAccount.mockResolvedValueOnce(undefined);
    await abrir();
    await escribir("Secreta1!");
    await tocarEliminar();

    await confirmar();

    expect(repo.deleteAccount).toHaveBeenCalledWith("Secreta1!");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(alerta).toHaveBeenLastCalledWith("Cuenta eliminada", "Tu cuenta se eliminó correctamente.");
  });

  it.each([
    [400, "La contraseña es incorrecta"],
    [409, "Tienes pedidos o servicios en curso. Podrás eliminar tu cuenta cuando terminen."],
    [429, "Demasiados intentos. Espera unos minutos antes de volver a intentarlo."],
  ])("con un rechazo %i muestra el mensaje y la sesión sigue abierta", async (status, message) => {
    repo.deleteAccount.mockRejectedValueOnce(makeApiError({ status, message }));
    await abrir();
    await escribir("mala");
    await tocarEliminar();

    await confirmar();

    expect(screen.getByText(message)).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(alerta).toHaveBeenCalledTimes(1);
  });

  it("al corregir la contraseña desaparece el error anterior", async () => {
    repo.deleteAccount.mockRejectedValueOnce(makeApiError({ status: 400, message: "La contraseña es incorrecta" }));
    await abrir();
    await escribir("mala");
    await tocarEliminar();
    await confirmar();

    await escribir("otra");

    expect(screen.queryByText("La contraseña es incorrecta")).toBeNull();
  });

  it("sin sesión no muestra el formulario", async () => {
    useAuthStore.setState({ isAuthenticated: false });

    await abrir();

    expect(screen.queryByLabelText("Eliminar mi cuenta")).toBeNull();
  });
});
