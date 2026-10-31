import { apiErrorMessage } from "@/shared/api/errorMessage";
import { makeApiError, makeNetworkError } from "./fixtures";

describe("apiErrorMessage", () => {
  it("usa el message del backend", () => {
    expect(apiErrorMessage(makeApiError({ message: "Credenciales inválidas" }))).toBe(
      "Credenciales inválidas",
    );
  });
  it("usa el primer error de validación (string u objeto)", () => {
    expect(apiErrorMessage(makeApiError({ errors: ["Campo X"] }))).toBe("Campo X");
    expect(apiErrorMessage(makeApiError({ errors: [{ message: "Campo Y" }] }))).toBe(
      "Campo Y",
    );
  });
  it("usa el campo error cuando es texto y no hay message (catálogo)", () => {
    expect(apiErrorMessage(makeApiError({ status: 404, error: "Producto no encontrado" }))).toBe(
      "Producto no encontrado",
    );
  });
  it("prefiere message sobre error si vienen los dos", () => {
    expect(apiErrorMessage(makeApiError({ message: "Del message", error: "Del error" }))).toBe(
      "Del message",
    );
  });
  it("ignora error si no es texto", () => {
    expect(apiErrorMessage(makeApiError({ error: { code: 1 } }))).toBe(
      "Ocurrió un error. Intenta de nuevo.",
    );
    expect(apiErrorMessage(makeApiError({ error: 500 }), "Otro")).toBe("Otro");
  });
  it("devuelve el fallback si no vienen message ni error", () => {
    expect(apiErrorMessage(makeApiError({ status: 500 }), "Otro")).toBe("Otro");
  });
  it("traduce el 429 (rate limit)", () => {
    expect(apiErrorMessage(makeApiError({ status: 429 }))).toMatch(/Demasiados intentos/);
  });
  it("traduce el error de red", () => {
    expect(apiErrorMessage(makeNetworkError())).toMatch(/Sin conexión/);
  });
  it("devuelve el fallback si no reconoce el error", () => {
    expect(apiErrorMessage(undefined)).toBe("Ocurrió un error. Intenta de nuevo.");
    expect(apiErrorMessage({}, "Otro")).toBe("Otro");
  });

  describe("tiempo de espera agotado", () => {
    const MENSAJE = "El servidor tardó demasiado en responder. Intenta de nuevo.";

    it("explica el timeout de Axios («timeout of 15000ms exceeded»)", () => {
      expect(apiErrorMessage({ code: "ECONNABORTED", message: "timeout of 15000ms exceeded" })).toBe(MENSAJE);
    });
    it("lo reconoce por el texto aunque no venga el código", () => {
      expect(apiErrorMessage({ message: "timeout of 15000ms exceeded" }, "Verifica tus datos")).toBe(MENSAJE);
    });
    it("lo reconoce por el código aunque el texto cambie", () => {
      expect(apiErrorMessage({ code: "ECONNABORTED", message: "otro texto" })).toBe(MENSAJE);
    });
    it("no cambia los demás mensajes: sin red, con respuesta del backend y fallback", () => {
      expect(apiErrorMessage(makeNetworkError())).toBe(
        "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.",
      );
      expect(apiErrorMessage(makeApiError({ status: 500, message: "Error del servidor" }))).toBe("Error del servidor");
      expect(apiErrorMessage({ message: "algo raro" }, "Mi fallback")).toBe("Mi fallback");
    });
  });
});
