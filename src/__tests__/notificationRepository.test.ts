import {
  NOTIFICATIONS_PAGE_SIZE,
  notificationRepository,
} from "@/features/notifications/repositories/notificationRepository";

import { makeApiError, makeNotification } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

beforeEach(() => {
  adapter.mockReset();
});

describe("notificationRepository.getPage", () => {
  it("envía GET /notifications con page y limit y devuelve la página", async () => {
    const data = [makeNotification({ id_notificacion: 2 }), makeNotification({ id_notificacion: 1 })];
    responde({ data, total: 5, page: 2, limit: 2, totalPages: 3 });

    const resultado = await notificationRepository.getPage(2, 2);

    const { metodo, ruta, params } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/notifications" });
    expect(params).toEqual({ page: 2, limit: 2 });
    expect(resultado).toEqual({ data, total: 5, page: 2, limit: 2, totalPages: 3 });
  });

  it("pide la página 1 de 20 en 20 (cada tanda es una petición nueva al backend)", async () => {
    responde({ data: [], total: 0, page: 1, limit: NOTIFICATIONS_PAGE_SIZE, totalPages: 0 });

    await notificationRepository.getPage();

    expect(NOTIFICATIONS_PAGE_SIZE).toBe(20);
    expect(ultimaPeticion().params).toEqual({ page: 1, limit: 20 });
  });

  it("descarta entradas sin id numérico", async () => {
    responde({ data: [makeNotification({ id_notificacion: 7 }), { titulo: "sin id" }, null], total: 3, page: 1, limit: 20, totalPages: 1 });

    const resultado = await notificationRepository.getPage();

    expect(resultado.data.map((n) => n.id_notificacion)).toEqual([7]);
  });

  it("si la respuesta viene incompleta devuelve lista vacía y totales en cero", async () => {
    responde({});

    const resultado = await notificationRepository.getPage(3);

    expect(resultado).toEqual({ data: [], total: 0, page: 3, limit: NOTIFICATIONS_PAGE_SIZE, totalPages: 0 });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 401, message: "Token inválido" });
    adapter.mockRejectedValueOnce(error);

    await expect(notificationRepository.getPage()).rejects.toBe(error);
  });
});

describe("notificationRepository.markRead y markAllRead", () => {
  it("markRead envía PUT /notifications/:id/read", async () => {
    responde({});

    await notificationRepository.markRead(12);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "put", ruta: "/notifications/12/read" });
  });

  it("markAllRead envía PUT /notifications/read-all", async () => {
    responde({});

    await notificationRepository.markAllRead();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "put", ruta: "/notifications/read-all" });
  });

  it("markRead rechaza con el error de la API (404: no es suya)", async () => {
    const error = makeApiError({ status: 404, message: "Notificación no encontrada." });
    adapter.mockRejectedValueOnce(error);

    await expect(notificationRepository.markRead(99)).rejects.toBe(error);
  });
});

describe("notificationRepository.getPreferences", () => {
  it("envía GET /notifications/preferences y devuelve email y push", async () => {
    responde({ data: { email: false, push: true } });

    const resultado = await notificationRepository.getPreferences();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/notifications/preferences" });
    expect(resultado).toEqual({ email: false, push: true });
  });

  it("si no viene nada, ambos canales quedan activos (valor por defecto del backend)", async () => {
    responde({});

    await expect(notificationRepository.getPreferences()).resolves.toEqual({ email: true, push: true });
  });
});

describe("notificationRepository.updatePreferences", () => {
  it("envía PUT /notifications/preferences con email y push juntos", async () => {
    responde({});

    await notificationRepository.updatePreferences({ email: true, push: false });

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "put", ruta: "/notifications/preferences" });
    expect(cuerpo).toEqual({ email: true, push: false });
  });

  it("rechaza con el error de validación de la API", async () => {
    const error = makeApiError({ status: 400, message: "Datos inválidos" });
    adapter.mockRejectedValueOnce(error);

    await expect(notificationRepository.updatePreferences({ email: true, push: true })).rejects.toBe(error);
  });
});

describe("notificationRepository.registerPushToken", () => {
  it("envía POST /notifications/push/expo/register con el token", async () => {
    responde({});

    await notificationRepository.registerPushToken("ExponentPushToken[abc123]");

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/notifications/push/expo/register" });
    expect(cuerpo).toEqual({ token: "ExponentPushToken[abc123]" });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 400, message: "Token de Expo inválido." });
    adapter.mockRejectedValueOnce(error);

    await expect(notificationRepository.registerPushToken("malo")).rejects.toBe(error);
  });
});

describe("notificationRepository.unregisterPushToken", () => {
  it("envía DELETE /notifications/push/expo/unregister con el token en el cuerpo", async () => {
    responde({});

    await notificationRepository.unregisterPushToken("ExponentPushToken[abc123]");

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "delete", ruta: "/notifications/push/expo/unregister" });
    expect(cuerpo).toEqual({ token: "ExponentPushToken[abc123]" });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(notificationRepository.unregisterPushToken("x")).rejects.toBe(error);
  });
});
