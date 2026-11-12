// Ofuscación del build Release: R8 activado y la regla de ProGuard que necesita Stripe.
// Si alguien quita alguna de las dos de app.config.js, esta prueba falla.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appConfig = require("../../app.config.js");

type Plugin = string | [string, Record<string, any>];

const opcionesAndroid = () => {
  const plugin = (appConfig.expo.plugins as Plugin[]).find(
    (p): p is [string, Record<string, any>] => Array.isArray(p) && p[0] === "expo-build-properties",
  );
  return plugin?.[1].android;
};

describe("ofuscación con R8 (expo-build-properties)", () => {
  it("activa R8 en el build Release (minifyEnabled true en build.gradle)", () => {
    expect(opcionesAndroid()?.enableMinifyInReleaseBuilds).toBe(true);
  });

  it("conserva la regla de ProGuard de Stripe que evita que R8 falle (#154)", () => {
    expect(opcionesAndroid()?.extraProguardRules).toContain("-dontwarn com.stripe.android.pushProvisioning.**");
  });
});
