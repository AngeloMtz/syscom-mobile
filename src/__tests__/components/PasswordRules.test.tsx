// PasswordRules: solo se simula @expo/vector-icons para poder distinguir en pantalla la regla cumplida
// (checkmark-circle) de la pendiente (ellipse-outline). Las reglas son las reales de validation.ts.
import { render, screen } from "@testing-library/react-native";

import PasswordRules from "@/features/auth/components/PasswordRules";
import { PASSWORD_RULES } from "@/features/auth/validation";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

const cumplidas = () => screen.queryAllByText("checkmark-circle").length;
const pendientes = () => screen.queryAllByText("ellipse-outline").length;

describe("PasswordRules", () => {
  it("lista las cinco reglas y marca solo las que cumple la contraseña", async () => {
    await render(<PasswordRules password="abc" />);

    PASSWORD_RULES.forEach((r) => expect(screen.getByText(r.label)).toBeTruthy());
    // "abc" solo cumple la minúscula.
    expect(cumplidas()).toBe(1);
    expect(pendientes()).toBe(4);
    expect(screen.getByText("Muy débil")).toBeTruthy();
  });

  it("con las cinco reglas cumplidas marca todas y el nivel es Muy fuerte", async () => {
    await render(<PasswordRules password="Abcdef1!" />);

    expect(cumplidas()).toBe(5);
    expect(pendientes()).toBe(0);
    expect(screen.getByText("Muy fuerte")).toBeTruthy();
  });

  it.each([
    ["abcdefgh", "Débil", 2],
    ["Abcdefgh", "Regular", 3],
    ["Abcdefg1", "Fuerte", 4],
  ])("la contraseña %s tiene nivel %s (%i reglas)", async (password, nivel, reglas) => {
    await render(<PasswordRules password={password} />);

    expect(screen.getByText(nivel)).toBeTruthy();
    expect(cumplidas()).toBe(reglas);
  });

  it("sin contraseña no pinta nada", async () => {
    await render(<PasswordRules password="" />);

    expect(screen.toJSON()).toBeNull();
  });

  it("una contraseña que no cumple ninguna regla (solo un espacio) queda en Muy débil con todo pendiente", async () => {
    await render(<PasswordRules password=" " />);

    expect(cumplidas()).toBe(0);
    expect(pendientes()).toBe(5);
    expect(screen.getByText("Muy débil")).toBeTruthy();
  });

  it("solo cuenta como símbolo uno de @$!%*?&#/: el punto no cumple la regla", async () => {
    await render(<PasswordRules password="." />);
    expect(cumplidas()).toBe(0);

    await screen.rerender(<PasswordRules password="/" />);
    expect(cumplidas()).toBe(1);
  });

  it("se actualiza en vivo al cambiar la contraseña", async () => {
    await render(<PasswordRules password="a" />);
    expect(screen.getByText("Muy débil")).toBeTruthy();

    await screen.rerender(<PasswordRules password="Abcdef1!" />);
    expect(screen.getByText("Muy fuerte")).toBeTruthy();
    expect(screen.queryByText("Muy débil")).toBeNull();
  });
});
