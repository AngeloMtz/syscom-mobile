import { getReturnUrl, getUrlScheme } from "@/features/payments/paymentConfig";

jest.mock("expo-linking", () => ({
  createURL: (path: string) =>
    path === "" ? "exp://192.168.1.5:8081/--/" : `exp://192.168.1.5:8081/--/${path}`,
}));

describe("paymentConfig", () => {
  it("la URL de retorno usa Linking.createURL (en Expo Go es exp://, no el esquema de la app)", () => {
    expect(getReturnUrl()).toBe("exp://192.168.1.5:8081/--/stripe-redirect");
  });

  it("el esquema es la parte antes de ://", () => {
    expect(getUrlScheme()).toBe("exp");
  });
});
