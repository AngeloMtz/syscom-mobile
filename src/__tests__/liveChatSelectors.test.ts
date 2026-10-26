import {
  closedCopy,
  formatBusinessHours,
  getSocketUrl,
  queueText,
  toLiveSender,
  unavailableCopy,
  warningText,
} from "@/features/chatbot/liveChat/liveChatSelectors";

describe("getSocketUrl", () => {
  it.each([
    ["https://api.railway.app/api", "https://api.railway.app/contact"],
    ["https://api.railway.app/api/", "https://api.railway.app/contact"],
    ["http://localhost:4000/api", "http://localhost:4000/contact"],
    ["https://api.railway.app", "https://api.railway.app/contact"],
  ])("%s → %s", (api, esperado) => {
    expect(getSocketUrl(api)).toBe(esperado);
  });
});

describe("toLiveSender", () => {
  it("respeta cliente y asesor; todo lo demás es del sistema", () => {
    expect(toLiveSender("client")).toBe("client");
    expect(toLiveSender("agent")).toBe("agent");
    expect(toLiveSender("system")).toBe("system");
    expect(toLiveSender("otro")).toBe("system");
  });
});

describe("formatBusinessHours", () => {
  it("sin horario no hay filas", () => {
    expect(formatBusinessHours(null)).toEqual([]);
  });

  it("ordena de lunes a domingo, marca los días cerrados y omite los que no tienen dato", () => {
    const filas = formatBusinessHours({
      domingo: { inicio: "09:00", fin: "22:00", activo: true },
      miercoles: { inicio: "09:00", fin: "18:00", activo: false },
      lunes: { inicio: "09:00", fin: "19:00", activo: true },
    });

    expect(filas).toEqual([
      { day: "Lunes", range: "09:00 – 19:00" },
      { day: "Miércoles", range: "Cerrado" },
      { day: "Domingo", range: "09:00 – 22:00" },
    ]);
  });
});

describe("textos", () => {
  it.each([
    ["closed", "Fuera de horario"],
    ["no_agent", "No hay asesores disponibles"],
    ["blocked", "No se pudo iniciar el chat"],
  ] as const)("unavailableCopy(%s) tiene título y explicación", (motivo, titulo) => {
    const copy = unavailableCopy(motivo);
    expect(copy.title).toBe(titulo);
    expect(copy.body.length).toBeGreaterThan(0);
  });

  it.each([
    ["agent", "El asesor cerró la conversación."],
    ["client", "Cerraste la conversación."],
    ["timeout", "La conversación se cerró por inactividad."],
    [null, "La conversación terminó."],
  ] as const)("closedCopy(%s)", (motivo, texto) => {
    expect(closedCopy(motivo)).toBe(texto);
  });

  it("queueText muestra el lugar o que espera", () => {
    expect(queueText(3)).toBe("Eres el número 3 en la fila.");
    expect(queueText(null)).toBe("Esperando a un asesor…");
  });
});

describe("warningText", () => {
  it("inactividad: cuenta los segundos que faltan (60 si no vienen)", () => {
    expect(warningText({ reason: "inactivity", secondsLeft: 45 })).toBe(
      "¿Sigues ahí? La conversación se cerrará en 45 segundos por inactividad.",
    );
    expect(warningText({ reason: "inactivity" })).toContain("60 segundos");
  });

  it("asesor desconectado: usa el mensaje del servidor o uno por defecto", () => {
    expect(warningText({ reason: "agent_disconnected", message: "El agente se ha reconectado." })).toBe(
      "El agente se ha reconectado.",
    );
    expect(warningText({ reason: "agent_disconnected" })).toBe("El asesor se desconectó. Te estamos reasignando…");
  });

  it("otro aviso: su mensaje o uno genérico", () => {
    expect(warningText({ message: "Algo pasó" })).toBe("Algo pasó");
    expect(warningText({})).toBe("Aviso del servidor.");
  });
});
