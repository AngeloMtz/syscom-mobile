// Explicación previa al permiso de notificaciones: qué dice y qué responde cada botón.
import { Alert } from "react-native";

import { explicarPermisoNotificaciones, PERMISO_NOTIFICACIONES } from "@/features/notifications/permissionPrompt";

type Boton = { text: string; onPress?: () => void };
type Opciones = { cancelable?: boolean; onDismiss?: () => void };

let alerta: jest.SpyInstance;

beforeEach(() => {
  alerta = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  alerta.mockRestore();
});

const mostrar = () => {
  const respuesta = explicarPermisoNotificaciones();
  const [titulo, mensaje, botones, opciones] = alerta.mock.calls[0] as [string, string, Boton[], Opciones];
  return { respuesta, titulo, mensaje, botones, opciones };
};

describe("explicarPermisoNotificaciones", () => {
  it("explica para qué son las notificaciones y dónde desactivarlas", () => {
    const { titulo, mensaje } = mostrar();

    expect(titulo).toBe(PERMISO_NOTIFICACIONES.titulo);
    expect(mensaje).toMatch(/estado de tus pedidos/);
    expect(mensaje).toMatch(/promociones/);
    expect(mensaje).toMatch(/Mi cuenta > Notificaciones/);
  });

  it("ofrece «Ahora no» y «Permitir», en ese orden", () => {
    const { botones } = mostrar();

    expect(botones.map((b) => b.text)).toEqual(["Ahora no", "Permitir"]);
  });

  it("«Permitir» resuelve true", async () => {
    const { respuesta, botones } = mostrar();

    botones[1].onPress?.();

    await expect(respuesta).resolves.toBe(true);
  });

  it("«Ahora no» resuelve false", async () => {
    const { respuesta, botones } = mostrar();

    botones[0].onPress?.();

    await expect(respuesta).resolves.toBe(false);
  });

  it("cerrarlo sin elegir (botón atrás de Android) cuenta como «Ahora no»", async () => {
    const { respuesta, opciones } = mostrar();

    expect(opciones.cancelable).toBe(true);
    opciones.onDismiss?.();

    await expect(respuesta).resolves.toBe(false);
  });
});
