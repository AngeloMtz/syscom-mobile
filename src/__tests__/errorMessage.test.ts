import { apiErrorMessage } from "@/shared/api/errorMessage";

describe("apiErrorMessage", () => {
  it("usa el message del backend", () => {
    expect(apiErrorMessage({ response: { data: { message: "Credenciales inválidas" } } })).toBe(
      "Credenciales inválidas",
    );
  });
  it("usa el primer error de validación (string u objeto)", () => {
    expect(apiErrorMessage({ response: { data: { errors: ["Campo X"] } } })).toBe("Campo X");
    expect(apiErrorMessage({ response: { data: { errors: [{ message: "Campo Y" }] } } })).toBe(
      "Campo Y",
    );
  });
  it("traduce el 429 (rate limit)", () => {
    expect(apiErrorMessage({ response: { status: 429, data: {} } })).toMatch(/Demasiados intentos/);
  });
  it("traduce el error de red", () => {
    expect(apiErrorMessage({ message: "Network Error" })).toMatch(/Sin conexión/);
  });
  it("devuelve el fallback si no reconoce el error", () => {
    expect(apiErrorMessage(undefined)).toBe("Ocurrió un error. Intenta de nuevo.");
    expect(apiErrorMessage({}, "Otro")).toBe("Otro");
  });
});
