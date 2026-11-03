import { Platform } from "react-native";

import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

import { configureAndroidChannel, ensurePushPermission, getExpoPushToken } from "@/features/notifications/pushNotifications";

// El factory crea sus propios jest.fn() (sin depender de variables externas):
// los import de arriba siempre se ejecutan antes que cualquier const normal del
// archivo, así que una variable "mockX" declarada aquí abajo no existiría todavía
// cuando pushNotifications.ts llama a Notifications.setNotificationHandler al
// cargarse. Las referencias tipadas se leen después, del propio módulo importado.
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test-project-id" } } },
}));

const mockSetNotificationChannelAsync = Notifications.setNotificationChannelAsync as jest.Mock;
const mockGetPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissionsAsync = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetExpoPushTokenAsync = Notifications.getExpoPushTokenAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("configureAndroidChannel", () => {
  it("en Android crea el canal 'default'", async () => {
    Platform.OS = "android";

    await configureAndroidChannel();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({ name: "General" }),
    );
  });

  it("en iOS no hace nada (los canales son de Android)", async () => {
    Platform.OS = "ios";

    await configureAndroidChannel();

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("ensurePushPermission", () => {
  it("si ya está concedido, no vuelve a pedirlo", async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ granted: true, canAskAgain: true, status: "granted" });

    await expect(ensurePushPermission()).resolves.toBe(true);
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("si nunca se preguntó, lo pide y respeta la respuesta del usuario", async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: true, status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ granted: true, canAskAgain: true, status: "granted" });

    await expect(ensurePushPermission()).resolves.toBe(true);
    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("si el usuario ya lo había rechazado antes, no insiste", async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: false, status: "denied" });

    await expect(ensurePushPermission()).resolves.toBe(false);
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("si lo pide y el usuario lo rechaza, devuelve false", async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: true, status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: false, status: "denied" });

    await expect(ensurePushPermission()).resolves.toBe(false);
  });
});

describe("getExpoPushToken", () => {
  it("pide el token con el projectId de app.json y devuelve el string", async () => {
    mockGetExpoPushTokenAsync.mockResolvedValueOnce({ type: "expo", data: "ExponentPushToken[abc123]" });

    await expect(getExpoPushToken()).resolves.toBe("ExponentPushToken[abc123]");
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "test-project-id" });
  });

  it("si la petición falla (sin conexión, emulador sin Play Services), devuelve null sin lanzar", async () => {
    mockGetExpoPushTokenAsync.mockRejectedValueOnce(new Error("Network error"));

    await expect(getExpoPushToken()).resolves.toBeNull();
  });

  it("sin projectId configurado en app.json, devuelve null sin llamar a Expo", async () => {
    const original = (Constants as { expoConfig?: typeof Constants.expoConfig }).expoConfig;
    (Constants as { expoConfig?: unknown }).expoConfig = { extra: {} };

    try {
      await expect(getExpoPushToken()).resolves.toBeNull();
      expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    } finally {
      (Constants as { expoConfig?: unknown }).expoConfig = original;
    }
  });
});

describe("sin el módulo nativo de expo-notifications (p. ej. Expo Go sin ExpoTopicSubscriptionModule)", () => {
  function cargarSinModulo() {
    jest.resetModules();
    jest.doMock("expo-notifications", () => {
      throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@/features/notifications/pushNotifications") as typeof import("@/features/notifications/pushNotifications");
  }

  it("cargar el archivo no lanza y el push queda como no disponible", async () => {
    Platform.OS = "android";
    const push = cargarSinModulo();

    await expect(push.configureAndroidChannel()).resolves.toBeUndefined();
    await expect(push.ensurePushPermission()).resolves.toBe(false);
    await expect(push.getExpoPushToken()).resolves.toBeNull();
  });
});
