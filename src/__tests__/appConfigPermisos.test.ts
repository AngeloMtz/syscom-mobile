// Permisos de Android: los que la app no usa quedan bloqueados en app.config.js
// y los que sí necesita no se bloquean por error.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appConfig = require("../../app.config.js");

const bloqueados: string[] = appConfig.expo.android.blockedPermissions ?? [];

describe("permisos de Android", () => {
  it.each([
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.SYSTEM_ALERT_WINDOW",
  ])("bloquea %s, que la app no usa", (permiso) => {
    expect(bloqueados).toContain(permiso);
  });

  it.each(["android.permission.INTERNET", "android.permission.POST_NOTIFICATIONS"])(
    "no bloquea %s, que la app sí necesita",
    (permiso) => {
      expect(bloqueados).not.toContain(permiso);
    },
  );
});
