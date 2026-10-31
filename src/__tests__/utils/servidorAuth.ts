import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

import type { CodeType, User } from "@/features/auth/types";
import type { Profile } from "@/features/profile/types";

import { makeApiError, makeProfile, makeUser } from "../fixtures";

/**
 * Servidor falso CON ESTADO de la sesión (cuentas, códigos de verificación, tokens y perfil)
 * para las pruebas de integración. Es un manejador para `enrutadorServidores`: solo reemplaza
 * al adapter de Axios, así que las peticiones pasan por el cliente real y su interceptor Bearer.
 *
 * Las formas de las respuestas salen de `authRepository` y `profileRepository` (qué campos lee la
 * app) y del controlador del backend (login 200 con `data.user` y `data.token`; con 2FA,
 * `data.requires2FA` y `data.correo`; registro 201 sin sesión; verificación 200 con sesión).
 * Los TEXTOS de los mensajes de error son de prueba: no se copiaron del backend y no se
 * contrastaron con respuestas reales.
 *
 * Reglas que reproduce: la cuenta nace inactiva y el código del correo la activa; cada código
 * solo sirve una vez y uno nuevo anula el anterior; /auth/me y /profile exigen un Bearer que el
 * propio servidor emitió. Los "correos" se leen con `ultimoCodigo`. Nada sale a la red.
 */

export interface CuentaFalsa {
  user: User;
  perfil: Profile;
  password: string;
  dosFactores: boolean;
  activa: boolean;
}

export interface Fallo {
  status: number;
  /** Sin mensaje, el error llega como en un rate limit (429) que no trae cuerpo con texto. */
  message?: string;
  errors?: { field: string; message: string }[];
}

// La respuesta viaja serializada, como por HTTP: la app nunca comparte objetos con el servidor
// (si no, un cambio en el servidor falso se vería en el store aunque la app no lo guardara).
const ok = (config: InternalAxiosRequestConfig, cuerpo: Record<string, unknown>, status = 200): AxiosResponse =>
  ({
    data: JSON.parse(JSON.stringify({ success: true, ...cuerpo })),
    status,
    statusText: "OK",
    headers: {},
    config,
  }) as AxiosResponse;

const parsear = (config: InternalAxiosRequestConfig) =>
  typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? {});

export function crearServidorAuth() {
  const cuentas = new Map<string, CuentaFalsa>();
  const codigos = new Map<string, string>();
  const tokens = new Map<string, string>();
  const llamadas: string[] = [];
  const fallos = new Map<string, Fallo[]>();
  let siguienteUsuario = 1;
  let siguienteCodigo = 1;
  let siguienteToken = 1;

  const claveCodigo = (correo: string, tipo: CodeType) => `${correo}|${tipo}`;

  const emitirCodigo = (correo: string, tipo: CodeType) => {
    const codigo = String(100000 + siguienteCodigo++);
    codigos.set(claveCodigo(correo, tipo), codigo);
    return codigo;
  };

  /** Comprueba el código y lo consume: solo sirve una vez. */
  const usarCodigo = (correo: string, tipo: CodeType, codigo: string, consumir = true) => {
    const vigente = codigos.get(claveCodigo(correo, tipo));
    if (!vigente || vigente !== codigo) {
      throw makeApiError({ status: 400, message: "El código no es válido o ya expiró." });
    }
    if (consumir) codigos.delete(claveCodigo(correo, tipo));
  };

  const emitirToken = (correo: string) => {
    const token = `jwt-${siguienteToken++}`;
    tokens.set(token, correo);
    return token;
  };

  const cuentaDelToken = (config: InternalAxiosRequestConfig): CuentaFalsa => {
    const cabecera = String(config.headers?.Authorization ?? "");
    const correo = tokens.get(cabecera.replace(/^Bearer /, ""));
    const cuenta = correo ? cuentas.get(correo) : undefined;
    if (!cuenta) throw makeApiError({ status: 401, message: "Token inválido o expirado." });
    return cuenta;
  };

  const cuentaPorCorreo = (correo: string): CuentaFalsa => {
    const cuenta = cuentas.get(correo);
    if (!cuenta) throw makeApiError({ status: 404, message: "No existe una cuenta con ese correo." });
    return cuenta;
  };

  function manejar(config: InternalAxiosRequestConfig): AxiosResponse | undefined {
    const metodo = (config.method ?? "get").toLowerCase();
    const ruta = config.url ?? "";
    if (!ruta.startsWith("/auth/") && ruta !== "/profile") return undefined;

    const clave = `${metodo.toUpperCase()} ${ruta}`;
    llamadas.push(clave);
    const cuerpo = parsear(config);

    const forzados = fallos.get(clave);
    if (forzados && forzados.length > 0) {
      const f = forzados.shift() as Fallo;
      throw makeApiError({ status: f.status, message: f.message, errors: f.errors });
    }

    if (clave === "POST /auth/register") {
      if (cuentas.has(cuerpo.correo)) {
        throw makeApiError({ status: 400, message: "Ese correo ya está registrado." });
      }
      const id = siguienteUsuario++;
      const base = {
        id_usuario: id,
        nombre: cuerpo.nombre,
        apellido_paterno: cuerpo.apellido_paterno,
        apellido_materno: cuerpo.apellido_materno,
        correo: cuerpo.correo,
        telefono: cuerpo.telefono,
      };
      cuentas.set(cuerpo.correo, {
        user: makeUser(base),
        perfil: makeProfile({ ...base, email_verified: false }),
        password: cuerpo.password,
        dosFactores: false,
        activa: false,
      });
      emitirCodigo(cuerpo.correo, "registration");
      return ok(config, { message: "Registro exitoso. Revisa tu correo para verificar la cuenta." }, 201);
    }

    if (clave === "POST /auth/verify-registration") {
      const cuenta = cuentaPorCorreo(cuerpo.correo);
      usarCodigo(cuerpo.correo, "registration", cuerpo.code);
      cuenta.activa = true;
      cuenta.perfil.email_verified = true;
      return ok(config, {
        message: "Cuenta verificada exitosamente",
        data: { user: cuenta.user, token: emitirToken(cuerpo.correo) },
      });
    }

    if (clave === "POST /auth/resend-code") {
      cuentaPorCorreo(cuerpo.correo);
      emitirCodigo(cuerpo.correo, cuerpo.type);
      return ok(config, { message: "Te enviamos un código nuevo." });
    }

    if (clave === "POST /auth/login") {
      const cuenta = cuentas.get(cuerpo.correo);
      if (!cuenta || cuenta.password !== cuerpo.password) {
        throw makeApiError({ status: 401, message: "Correo o contraseña incorrectos." });
      }
      if (!cuenta.activa) {
        throw makeApiError({ status: 403, message: "Verifica tu correo antes de iniciar sesión." });
      }
      if (cuenta.dosFactores) {
        emitirCodigo(cuerpo.correo, "2fa_login");
        return ok(config, {
          message: "Te enviamos un código de verificación.",
          data: { requires2FA: true, correo: cuerpo.correo },
        });
      }
      return ok(config, { message: "Login exitoso", data: { user: cuenta.user, token: emitirToken(cuerpo.correo) } });
    }

    if (clave === "POST /auth/verify-2fa-login") {
      const cuenta = cuentaPorCorreo(cuerpo.correo);
      usarCodigo(cuerpo.correo, "2fa_login", cuerpo.code);
      return ok(config, { message: "Login exitoso", data: { user: cuenta.user, token: emitirToken(cuerpo.correo) } });
    }

    if (clave === "POST /auth/forgot-password") {
      // Como cualquier recuperación bien hecha, no revela si el correo existe.
      if (cuentas.has(cuerpo.correo)) emitirCodigo(cuerpo.correo, "password_reset");
      return ok(config, { message: "Si el correo existe, te enviamos un código." });
    }

    if (clave === "POST /auth/verify-recovery") {
      usarCodigo(cuerpo.correo, "password_reset", cuerpo.code, false);
      return ok(config, { message: "Código verificado." });
    }

    if (clave === "POST /auth/reset-password") {
      const cuenta = cuentaPorCorreo(cuerpo.correo);
      if (cuerpo.newPassword !== cuerpo.confirmPassword) {
        throw makeApiError({ status: 400, message: "Las contraseñas no coinciden." });
      }
      usarCodigo(cuerpo.correo, "password_reset", cuerpo.code);
      cuenta.password = cuerpo.newPassword;
      return ok(config, { message: "Contraseña actualizada correctamente." });
    }

    if (clave === "POST /auth/logout") {
      return ok(config, { message: "Sesión cerrada correctamente" });
    }

    if (clave === "GET /auth/me") {
      return ok(config, { message: "Usuario obtenido correctamente", data: { user: cuentaDelToken(config).user } });
    }

    if (clave === "GET /profile") {
      return ok(config, { data: cuentaDelToken(config).perfil });
    }

    if (clave === "PUT /profile") {
      const cuenta = cuentaDelToken(config);
      for (const campo of ["nombre", "apellido_paterno", "apellido_materno", "telefono"] as const) {
        cuenta.perfil[campo] = cuerpo[campo];
        cuenta.user[campo] = cuerpo[campo];
      }
      return ok(config, { message: "Perfil actualizado correctamente", data: cuenta.perfil });
    }

    return undefined;
  }

  return {
    manejar,
    cuentas,
    llamadas,
    /** Cuántas veces se llamó a una ruta, por ejemplo "POST /auth/login". */
    veces: (clave: string) => llamadas.filter((l) => l === clave).length,
    /** Crea una cuenta ya activa (por defecto sin 2FA). */
    agregarCuenta: (correo: string, password: string, opciones: { dosFactores?: boolean; nombre?: string } = {}) => {
      const id = siguienteUsuario++;
      const base = { id_usuario: id, correo, nombre: opciones.nombre ?? "Ana" };
      const cuenta: CuentaFalsa = {
        user: makeUser(base),
        perfil: makeProfile({ ...base, two_factor_enabled: opciones.dosFactores ?? false }),
        password,
        dosFactores: opciones.dosFactores ?? false,
        activa: true,
      };
      cuentas.set(correo, cuenta);
      return cuenta;
    },
    /** El "correo" más reciente con el código de ese tipo; falla si no se envió ninguno. */
    ultimoCodigo: (correo: string, tipo: CodeType): string => {
      const codigo = codigos.get(claveCodigo(correo, tipo));
      if (!codigo) throw new Error(`No hay un código ${tipo} vigente para ${correo}`);
      return codigo;
    },
    /** El token que el servidor emitió más recientemente a ese correo (undefined si no emitió ninguno). */
    tokenDe: (correo: string) => [...tokens.entries()].filter(([, c]) => c === correo).map(([t]) => t).pop(),
    /** Emite un token válido para esa cuenta sin pasar por el login (una sesión de una apertura anterior). */
    emitirToken: (correo: string) => emitirToken(correo),
    /** La próxima petición a esa ruta (por ejemplo "PUT /profile") falla con ese error, una vez. */
    fallarProxima: (clave: string, fallo: Fallo) => {
      fallos.set(clave, [...(fallos.get(clave) ?? []), fallo]);
    },
    /** La cuenta dueña del Bearer de la petición, o undefined si no trae un token vigente (no lanza). */
    cuentaDe: (config: InternalAxiosRequestConfig): CuentaFalsa | undefined => {
      const correo = tokens.get(String(config.headers?.Authorization ?? "").replace(/^Bearer /, ""));
      return correo ? cuentas.get(correo) : undefined;
    },
    /** Invalida un token: la sesión que lo use recibe 401. */
    revocarToken: (token: string) => tokens.delete(token),
  };
}

export type ServidorAuth = ReturnType<typeof crearServidorAuth>;
