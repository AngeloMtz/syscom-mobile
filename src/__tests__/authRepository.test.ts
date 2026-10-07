import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { authErrorMessage, authRepository } from "@/features/auth/repositories/authRepository";
import api from "@/shared/api/client";

import { makeApiError, makeLoginPayload, makeRegisterPayload, makeUser } from "./fixtures";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

/** Adapter falso: ninguna petición sale a la red. */
const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>();

/** El backend responde { success, message, data }: aquí se arma esa envoltura. */
function responde(data?: unknown) {
  adapter.mockImplementationOnce(
    async (config) =>
      ({
        data: { success: true, data },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }) as AxiosResponse,
  );
}

/** Última petición recibida por el adapter, con el cuerpo ya convertido a objeto. */
function ultimaPeticion() {
  const config = adapter.mock.calls[adapter.mock.calls.length - 1][0] as InternalAxiosRequestConfig;
  const cuerpo = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  return { metodo: config.method, ruta: config.url, cuerpo };
}

beforeAll(() => {
  api.defaults.adapter = adapter;
});

beforeEach(() => {
  adapter.mockReset();
});

describe("authRepository.login", () => {
  it("envía POST /auth/login y devuelve user y token", async () => {
    const user = makeUser();
    const payload = makeLoginPayload();
    responde({ user, token: "jwt-1" });

    const resultado = await authRepository.login(payload);

    expect(ultimaPeticion()).toEqual({ metodo: "post", ruta: "/auth/login", cuerpo: payload });
    expect(resultado).toEqual({ requires2FA: false, user, token: "jwt-1" });
  });

  it("devuelve requires2FA y el correo del backend cuando la cuenta usa 2FA", async () => {
    responde({ requires2FA: true, correo: "backend@example.com" });

    const resultado = await authRepository.login(makeLoginPayload());

    expect(resultado).toEqual({ requires2FA: true, correo: "backend@example.com" });
  });

  it("usa el correo del payload si el backend no lo devuelve en el 2FA", async () => {
    responde({ requires2FA: true });

    const resultado = await authRepository.login(makeLoginPayload({ correo: "yo@example.com" }));

    expect(resultado).toEqual({ requires2FA: true, correo: "yo@example.com" });
  });

  it("rechaza con el error de la API cuando las credenciales son inválidas", async () => {
    const error = makeApiError({ status: 401, message: "Credenciales inválidas" });
    adapter.mockRejectedValueOnce(error);

    await expect(authRepository.login(makeLoginPayload())).rejects.toBe(error);
    expect(authErrorMessage(error)).toBe("Credenciales inválidas");
  });
});

describe("authRepository.confirm2FA", () => {
  it("envía POST /auth/verify-2fa-login y devuelve user y token", async () => {
    const user = makeUser();
    responde({ user, token: "jwt-2fa" });

    const resultado = await authRepository.confirm2FA("ana@example.com", "123456");

    expect(ultimaPeticion()).toEqual({
      metodo: "post",
      ruta: "/auth/verify-2fa-login",
      cuerpo: { correo: "ana@example.com", code: "123456" },
    });
    expect(resultado).toEqual({ user, token: "jwt-2fa" });
  });
});

describe("authRepository.register", () => {
  it("envía POST /auth/register con el payload y no devuelve valor", async () => {
    const payload = makeRegisterPayload();
    responde();

    const resultado = await authRepository.register(payload);

    expect(ultimaPeticion()).toEqual({ metodo: "post", ruta: "/auth/register", cuerpo: payload });
    expect(resultado).toBeUndefined();
  });

  it("rechaza con el error de la API cuando el correo ya existe", async () => {
    const error = makeApiError({ status: 409, message: "El correo ya está registrado" });
    adapter.mockRejectedValueOnce(error);

    await expect(authRepository.register(makeRegisterPayload())).rejects.toBe(error);
    expect(authErrorMessage(error)).toBe("El correo ya está registrado");
  });

  it("rechaza con el error de validación de la API", async () => {
    const error = makeApiError({ status: 400, errors: ["La contraseña es muy corta"] });
    adapter.mockRejectedValueOnce(error);

    await expect(authRepository.register(makeRegisterPayload())).rejects.toBe(error);
    expect(authErrorMessage(error)).toBe("La contraseña es muy corta");
  });
});

describe("authRepository.verifyRegistration", () => {
  it("envía POST /auth/verify-registration y devuelve user y token del auto-login", async () => {
    const user = makeUser();
    responde({ user, token: "jwt-registro" });

    const resultado = await authRepository.verifyRegistration("ana@example.com", "654321");

    expect(ultimaPeticion()).toEqual({
      metodo: "post",
      ruta: "/auth/verify-registration",
      cuerpo: { correo: "ana@example.com", code: "654321" },
    });
    expect(resultado).toEqual({ user, token: "jwt-registro" });
  });
});

describe("authRepository.resendCode", () => {
  it("envía POST /auth/resend-code con el correo y el tipo de código", async () => {
    responde();

    const resultado = await authRepository.resendCode("ana@example.com", "registration");

    expect(ultimaPeticion()).toEqual({
      metodo: "post",
      ruta: "/auth/resend-code",
      cuerpo: { correo: "ana@example.com", type: "registration" },
    });
    expect(resultado).toBeUndefined();
  });
});

describe("authRepository.forgotPassword", () => {
  it("pide el código por defecto", async () => {
    responde();

    const resultado = await authRepository.forgotPassword("ana@example.com");

    expect(ultimaPeticion()).toEqual({
      metodo: "post",
      ruta: "/auth/forgot-password",
      cuerpo: { correo: "ana@example.com", method: "code" },
    });
    expect(resultado).toBeUndefined();
  });

  it("envía el método link cuando se pide", async () => {
    responde();

    await authRepository.forgotPassword("ana@example.com", "link");

    expect(ultimaPeticion().cuerpo).toEqual({ correo: "ana@example.com", method: "link" });
  });
});

describe("authRepository.verifyRecovery", () => {
  it("envía POST /auth/verify-recovery con correo y código", async () => {
    responde();

    const resultado = await authRepository.verifyRecovery("ana@example.com", "111222");

    expect(ultimaPeticion()).toEqual({
      metodo: "post",
      ruta: "/auth/verify-recovery",
      cuerpo: { correo: "ana@example.com", code: "111222" },
    });
    expect(resultado).toBeUndefined();
  });
});

describe("authRepository.resetPassword", () => {
  it("envía POST /auth/reset-password con los datos recibidos", async () => {
    const params = {
      correo: "ana@example.com",
      code: "111222",
      newPassword: "Nueva1234!",
      confirmPassword: "Nueva1234!",
    };
    responde();

    const resultado = await authRepository.resetPassword(params);

    expect(ultimaPeticion()).toEqual({
      metodo: "post",
      ruta: "/auth/reset-password",
      cuerpo: params,
    });
    expect(resultado).toBeUndefined();
  });
});

describe("authRepository.logout", () => {
  it("envía POST /auth/logout sin cuerpo", async () => {
    responde();

    const resultado = await authRepository.logout();

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/auth/logout" });
    expect(cuerpo).toBeUndefined();
    expect(resultado).toBeUndefined();
  });
});

describe("authRepository.getMe", () => {
  it("envía GET /auth/me y devuelve el usuario de la sesión", async () => {
    const user = makeUser();
    responde({ user });

    const resultado = await authRepository.getMe();

    expect(ultimaPeticion()).toEqual({ metodo: "get", ruta: "/auth/me", cuerpo: undefined });
    expect(resultado).toEqual(user);
  });
});

describe("authErrorMessage", () => {
  it("reexporta la traducción de errores de la API", () => {
    expect(authErrorMessage(makeApiError({ message: "Algo falló" }))).toBe("Algo falló");
  });
});
