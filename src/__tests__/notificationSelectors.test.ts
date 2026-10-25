import {
  countUnread,
  findNotificationById,
  flattenNotifications,
  getNextNotificationsPage,
  getNotificationTypeInfo,
  markAsReadInPages,
  timeAgo,
} from "@/features/notifications/notificationSelectors";

import { makeNotification, makeNotificationsPage } from "./fixtures";

const n = (id: number, leida = false) => makeNotification({ id_notificacion: id, leida });
const pagina = (page: number, ids: number[], totalPages = 2) =>
  makeNotificationsPage({ page, totalPages, data: ids.map((id) => n(id)) });

describe("flattenNotifications", () => {
  it("une las páginas en orden", () => {
    expect(flattenNotifications([pagina(1, [3, 2]), pagina(2, [1])]).map((x) => x.id_notificacion)).toEqual([3, 2, 1]);
  });

  it("si una notificación viene en dos páginas, conserva la primera aparición", () => {
    expect(flattenNotifications([pagina(1, [3, 2]), pagina(2, [2, 1])]).map((x) => x.id_notificacion)).toEqual([3, 2, 1]);
  });

  it("sin páginas devuelve lista vacía", () => {
    expect(flattenNotifications([])).toEqual([]);
  });
});

describe("getNextNotificationsPage", () => {
  it("devuelve la página siguiente mientras haya más", () => {
    expect(getNextNotificationsPage(pagina(1, [1], 3))).toBe(2);
  });

  it("devuelve undefined en la última página", () => {
    expect(getNextNotificationsPage(pagina(3, [1], 3))).toBeUndefined();
  });
});

describe("markAsReadInPages", () => {
  it("marca solo la notificación indicada", () => {
    const resultado = markAsReadInPages([pagina(1, [3, 2]), pagina(2, [1])], 2);
    expect(resultado.flatMap((p) => p.data).map((x) => [x.id_notificacion, x.leida])).toEqual([
      [3, false],
      [2, true],
      [1, false],
    ]);
  });

  it("sin id marca todas", () => {
    const resultado = markAsReadInPages([pagina(1, [3, 2]), pagina(2, [1])]);
    expect(resultado.flatMap((p) => p.data).every((x) => x.leida)).toBe(true);
  });

  it("no modifica las páginas recibidas", () => {
    const original = [pagina(1, [1])];
    markAsReadInPages(original, 1);
    expect(original[0].data[0].leida).toBe(false);
  });
});

describe("countUnread", () => {
  it("cuenta solo las no leídas", () => {
    expect(countUnread([n(1, true), n(2), n(3)])).toBe(2);
  });

  it("sin notificaciones es 0", () => {
    expect(countUnread([])).toBe(0);
  });
});

describe("findNotificationById", () => {
  it("devuelve la notificación con ese id", () => {
    const lista = [n(3), n(2), n(1)];
    expect(findNotificationById(lista, 2)?.id_notificacion).toBe(2);
  });

  it("si no existe devuelve undefined", () => {
    expect(findNotificationById([n(1)], 99)).toBeUndefined();
  });
});

describe("getNotificationTypeInfo", () => {
  it.each([
    ["pedido", "Pedido", "cube-outline"],
    ["campana", "Promoción", "megaphone-outline"],
    ["stock", "Stock", "alert-circle-outline"],
  ])("%s → %s", (tipo, label, icon) => {
    expect(getNotificationTypeInfo(tipo)).toEqual({ label, icon });
  });

  it("un tipo desconocido se trata como aviso general", () => {
    expect(getNotificationTypeInfo("otro")).toEqual({ label: "Aviso", icon: "notifications-outline" });
  });
});

describe("timeAgo", () => {
  const ahora = new Date("2026-10-20T12:00:00.000Z").getTime();
  const hace = (ms: number) => new Date(ahora - ms).toISOString();
  const MIN = 60 * 1000;
  const HORA = 60 * MIN;
  const DIA = 24 * HORA;

  it("menos de un minuto es 'ahora'", () => {
    expect(timeAgo(hace(30 * 1000), ahora)).toBe("ahora");
  });

  it("minutos", () => {
    expect(timeAgo(hace(5 * MIN), ahora)).toBe("hace 5 min");
  });

  it("horas", () => {
    expect(timeAgo(hace(3 * HORA), ahora)).toBe("hace 3 h");
  });

  it("un día es 'ayer'", () => {
    expect(timeAgo(hace(DIA), ahora)).toBe("ayer");
  });

  it("varios días", () => {
    expect(timeAgo(hace(4 * DIA), ahora)).toBe("hace 4 días");
  });

  it("una fecha inválida o futura se muestra como 'ahora'", () => {
    expect(timeAgo("no es fecha", ahora)).toBe("ahora");
    expect(timeAgo(new Date(ahora + HORA).toISOString(), ahora)).toBe("ahora");
  });
});
