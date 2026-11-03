import {
  LIMITE_COMPONENTES_MS,
  LIMITE_INTEGRACION_MS,
  tiempoLimiteDe,
} from "./utils/tiempoLimite";

describe("tiempoLimiteDe", () => {
  it("da más tiempo a las pruebas de integración", () => {
    expect(tiempoLimiteDe("C:\\repo\\src\\__tests__\\integration\\resenas.test.tsx")).toBe(
      LIMITE_INTEGRACION_MS,
    );
    expect(tiempoLimiteDe("/repo/src/__tests__/integration/resenas.test.tsx")).toBe(
      LIMITE_INTEGRACION_MS,
    );
  });

  it("da tiempo intermedio a las pruebas de componentes", () => {
    expect(tiempoLimiteDe("/repo/src/__tests__/components/OrderComponents.test.tsx")).toBe(
      LIMITE_COMPONENTES_MS,
    );
  });

  it("deja el límite por defecto de Jest en el resto de las pruebas", () => {
    expect(tiempoLimiteDe("/repo/src/__tests__/useCart.test.tsx")).toBeUndefined();
    expect(tiempoLimiteDe("/repo/src/__tests__/utils/integracion.tsx")).toBeUndefined();
    expect(tiempoLimiteDe("")).toBeUndefined();
  });

  it("los límites suben el de Jest (5 s) y el de integración supera al de componentes", () => {
    expect(LIMITE_COMPONENTES_MS).toBeGreaterThan(5000);
    expect(LIMITE_INTEGRACION_MS).toBeGreaterThan(LIMITE_COMPONENTES_MS);
  });
});
