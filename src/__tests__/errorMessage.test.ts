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
});
