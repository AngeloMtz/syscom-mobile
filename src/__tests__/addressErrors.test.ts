import { addressErrorMessage, mapServerFieldErrors } from "@/features/addresses/addressErrors";

import { makeApiError, makeNetworkError } from "./fixtures";

const GENERICO = "No pudimos completar la operación. Intenta de nuevo más tarde.";

describe("mapServerFieldErrors", () => {
  it("asigna cada error del 400 a su campo", () => {
    const error = makeApiError({
      status: 400,
      message: "La calle debe tener al menos 5 caracteres",
      errors: [
        { field: "calle", message: "La calle debe tener al menos 5 caracteres" },
        { field: "codigo_postal", message: "El código postal debe tener exactamente 5 dígitos" },
      ],
    });
    expect(mapServerFieldErrors(error)).toEqual({
      fields: {
        calle: "La calle debe tener al menos 5 caracteres",
        codigo_postal: "El código postal debe tener exactamente 5 dígitos",
      },
      general: undefined,
    });
  });

  it("ignora campos que no son del formulario", () => {
    const error = makeApiError({
      status: 400,
      message: "x",
      errors: [{ field: "id_usuario", message: "no aplica" }, { field: "ciudad", message: "La ciudad es corta" }],
    });
    expect(mapServerFieldErrors(error).fields).toEqual({ ciudad: "La ciudad es corta" });
  });

  it("si el 400 no trae errores por campo deja el mensaje como general", () => {
    const error = makeApiError({
      status: 400,
      message: "Se detectaron caracteres no permitidos en la solicitud.",
    });
    expect(mapServerFieldErrors(error)).toEqual({
      fields: {},
      general: "Se detectaron caracteres no permitidos en la solicitud.",
    });
  });

  it("con 404 el mensaje es general", () => {
    const error = makeApiError({ status: 404, message: "Dirección no encontrada" });
    expect(mapServerFieldErrors(error)).toEqual({ fields: {}, general: "Dirección no encontrada" });
  });

  it("un 5xx no muestra el texto del servidor", () => {
    const error = makeApiError({ status: 500, message: "Invalid `prisma.direcciones_envio.create()` invocation" });
    expect(mapServerFieldErrors(error)).toEqual({ fields: {}, general: GENERICO });
  });

  it("un error de red o desconocido da el mensaje general correspondiente", () => {
    expect(mapServerFieldErrors(makeNetworkError()).general).toMatch(/Sin conexión/);
    expect(mapServerFieldErrors(undefined).general).toBe(GENERICO);
  });
});

describe("addressErrorMessage", () => {
  it("usa el mensaje del backend en errores 4xx", () => {
    expect(addressErrorMessage(makeApiError({ status: 404, message: "Dirección no encontrada" }))).toBe(
      "Dirección no encontrada",
    );
  });
  it("oculta el texto del servidor en 5xx", () => {
    expect(addressErrorMessage(makeApiError({ status: 500, message: "prisma: connection refused" }))).toBe(
      GENERICO,
    );
    expect(addressErrorMessage(makeApiError({ status: 503, message: "Error de conexión." }))).toBe(GENERICO);
  });
  it("traduce el error de red", () => {
    expect(addressErrorMessage(makeNetworkError())).toMatch(/Sin conexión/);
  });
  it("usa el mensaje genérico si no hay nada que mostrar", () => {
    expect(addressErrorMessage(undefined)).toBe(GENERICO);
    expect(addressErrorMessage(makeApiError({ status: 400 }))).toBe(GENERICO);
  });
  it("acepta un mensaje de respaldo propio", () => {
    expect(addressErrorMessage(undefined, "No se pudo guardar la dirección.")).toBe(
      "No se pudo guardar la dirección.",
    );
  });
});
