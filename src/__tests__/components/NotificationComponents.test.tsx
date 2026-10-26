import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import NotificationCard from "@/features/notifications/components/NotificationCard";
import PreferencesCard from "@/features/notifications/components/PreferencesCard";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/useNotificationPreferences";

import { makeApiError, makeNotification } from "../fixtures";

// Los íconos se simulan como texto con el nombre del ícono para poder comprobar cuál se dibuja.
jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("@/features/notifications/hooks/useNotificationPreferences", () => ({
  useNotificationPreferences: jest.fn(),
  useUpdateNotificationPreferences: jest.fn(),
}));

const usePrefs = useNotificationPreferences as jest.Mock;
const useGuardar = useUpdateNotificationPreferences as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

type Nodo = { type?: string; props?: Record<string, unknown>; children?: unknown[] | null };

/** Recorre el árbol renderizado y devuelve los nodos que cumplen el predicado. */
function buscar(nodo: unknown, cumple: (n: Nodo) => boolean, acumulado: Nodo[] = []): Nodo[] {
  if (nodo === null || typeof nodo !== "object") return acumulado;
  if (Array.isArray(nodo)) {
    nodo.forEach((n) => buscar(n, cumple, acumulado));
    return acumulado;
  }
  const n = nodo as Nodo;
  if (cumple(n)) acumulado.push(n);
  (n.children ?? []).forEach((h) => buscar(h, cumple, acumulado));
  return acumulado;
}

const estiloDe = (n: Nodo) => StyleSheet.flatten(n.props?.style as never) ?? {};

/** El punto de "sin leer" es un círculo de 10 x 10. */
const puntosSinLeer = () =>
  buscar(screen.toJSON(), (n) => {
    const e = estiloDe(n) as { width?: number; height?: number; borderRadius?: number };
    return e.width === 10 && e.height === 10 && e.borderRadius === 5;
  });

const AHORA = Date.parse("2026-10-20T12:05:00.000Z");

describe("NotificationCard", () => {
  it("muestra el tipo, el título, el mensaje y hace cuánto llegó", async () => {
    await render(<NotificationCard notification={makeNotification()} now={AHORA} onPress={jest.fn()} />);

    expect(screen.getByText("PEDIDO")).toBeTruthy();
    expect(screen.getByText("Tu pedido está en camino")).toBeTruthy();
    expect(screen.getByText("El pedido #10 salió a reparto.")).toBeTruthy();
    expect(screen.getByText("hace 5 min")).toBeTruthy();
  });

  it.each([
    ["pedido", "PEDIDO", "cube-outline"],
    ["campana", "PROMOCIÓN", "megaphone-outline"],
    ["stock", "STOCK", "alert-circle-outline"],
    ["algo-nuevo", "AVISO", "notifications-outline"],
  ])("el tipo %s se muestra como %s con el ícono %s", async (tipo, etiqueta, icono) => {
    await render(<NotificationCard notification={makeNotification({ tipo })} now={AHORA} onPress={jest.fn()} />);

    expect(screen.getByText(etiqueta)).toBeTruthy();
    expect(screen.getByText(icono)).toBeTruthy();
  });

  it("una notificación sin leer lo anuncia, muestra el punto y no se confunde con una leída", async () => {
    await render(
      <NotificationCard notification={makeNotification({ leida: false })} now={AHORA} onPress={jest.fn()} />,
    );

    expect(
      screen.getByLabelText("Sin leer. Pedido. Tu pedido está en camino. El pedido #10 salió a reparto."),
    ).toBeTruthy();
    expect(puntosSinLeer()).toHaveLength(1);
  });

  it("una notificación leída no dice 'Sin leer' ni muestra el punto", async () => {
    await render(<NotificationCard notification={makeNotification({ leida: true })} now={AHORA} onPress={jest.fn()} />);

    expect(screen.getByLabelText("Pedido. Tu pedido está en camino. El pedido #10 salió a reparto.")).toBeTruthy();
    expect(puntosSinLeer()).toHaveLength(0);
  });

  it("al tocarla avisa con la notificación completa", async () => {
    const onPress = jest.fn();
    const notificacion = makeNotification({ id_notificacion: 42 });
    await render(<NotificationCard notification={notificacion} now={AHORA} onPress={onPress} />);

    await fireEvent.press(screen.getByRole("button"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(notificacion);
  });

  it("una fecha inválida se muestra como 'ahora' sin romper", async () => {
    await render(
      <NotificationCard notification={makeNotification({ created_at: "no-es-fecha" })} now={AHORA} onPress={jest.fn()} />,
    );

    expect(screen.getByText("ahora")).toBeTruthy();
  });

  it("un tiempo transcurrido de más de un día se muestra en días o 'ayer'", async () => {
    await render(
      <NotificationCard
        notification={makeNotification({ created_at: "2026-10-19T12:00:00.000Z" })}
        now={AHORA}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText("ayer")).toBeTruthy();

    await render(
      <NotificationCard
        notification={makeNotification({ created_at: "2026-10-15T12:00:00.000Z" })}
        now={AHORA}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText("hace 5 días")).toBeTruthy();
  });
});

describe("PreferencesCard", () => {
  const prefs = (over: Record<string, unknown> = {}) => ({
    data: { push: true, email: true },
    isPending: false,
    isError: false,
    ...over,
  });
  const guardar = (over: Record<string, unknown> = {}) => ({
    mutate: jest.fn(),
    isError: false,
    error: null,
    ...over,
  });

  it("muestra el título y los dos interruptores con los valores del servidor", async () => {
    usePrefs.mockReturnValue(prefs({ data: { push: false, email: true } }));
    useGuardar.mockReturnValue(guardar());
    await render(<PreferencesCard />);

    expect(screen.getByText("¿Cómo quieres recibir avisos?")).toBeTruthy();
    expect(screen.getByLabelText("Notificaciones push").props.value).toBe(false);
    expect(screen.getByLabelText("Correo electrónico").props.value).toBe(true);
  });

  it("mientras carga, los interruptores quedan deshabilitados con el valor por defecto (activados)", async () => {
    usePrefs.mockReturnValue(prefs({ data: undefined, isPending: true }));
    useGuardar.mockReturnValue(guardar());
    await render(<PreferencesCard />);

    expect(screen.getByLabelText("Notificaciones push").props.disabled).toBe(true);
    expect(screen.getByLabelText("Correo electrónico").props.disabled).toBe(true);
    expect(screen.getByLabelText("Notificaciones push").props.value).toBe(true);
  });

  it("al cambiar push guarda las dos preferencias con ese cambio", async () => {
    const mutate = jest.fn();
    usePrefs.mockReturnValue(prefs({ data: { push: true, email: false } }));
    useGuardar.mockReturnValue(guardar({ mutate }));
    await render(<PreferencesCard />);

    await fireEvent(screen.getByLabelText("Notificaciones push"), "valueChange", false);

    expect(mutate).toHaveBeenCalledWith({ push: false, email: false });
  });

  it("al cambiar correo guarda las dos preferencias con ese cambio", async () => {
    const mutate = jest.fn();
    usePrefs.mockReturnValue(prefs({ data: { push: true, email: false } }));
    useGuardar.mockReturnValue(guardar({ mutate }));
    await render(<PreferencesCard />);

    await fireEvent(screen.getByLabelText("Correo electrónico"), "valueChange", true);

    expect(mutate).toHaveBeenCalledWith({ push: true, email: true });
  });

  it("sin preferencias cargadas avisa del error y no guarda nada aunque se toque un interruptor", async () => {
    const mutate = jest.fn();
    usePrefs.mockReturnValue(prefs({ data: undefined, isError: true }));
    useGuardar.mockReturnValue(guardar({ mutate }));
    await render(<PreferencesCard />);

    expect(screen.getByText("No pudimos cargar tus preferencias.")).toBeTruthy();
    expect(screen.getByLabelText("Notificaciones push").props.disabled).toBe(true);
    await fireEvent(screen.getByLabelText("Notificaciones push"), "valueChange", false);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("si el servidor rechaza el cambio muestra su mensaje", async () => {
    usePrefs.mockReturnValue(prefs());
    useGuardar.mockReturnValue(
      guardar({ isError: true, error: makeApiError({ status: 500, message: "Error al guardar." }) }),
    );
    await render(<PreferencesCard />);

    expect(screen.getByText("Error al guardar.")).toBeTruthy();
  });

  it("si el error no trae mensaje usa el texto por defecto", async () => {
    usePrefs.mockReturnValue(prefs());
    useGuardar.mockReturnValue(guardar({ isError: true, error: {} }));
    await render(<PreferencesCard />);

    expect(screen.getByText("No se pudo guardar el cambio.")).toBeTruthy();
  });

  it("con las preferencias cargadas y sin errores no muestra avisos", async () => {
    usePrefs.mockReturnValue(prefs());
    useGuardar.mockReturnValue(guardar());
    await render(<PreferencesCard />);

    expect(screen.queryByText("No pudimos cargar tus preferencias.")).toBeNull();
    expect(screen.queryByText("No se pudo guardar el cambio.")).toBeNull();
  });
});
