import {
  DOUBLE_TAP_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
  clampScale,
  clampTranslation,
  nextScaleFromPinch,
  stepZoom,
  toggleZoomScale,
  touchDistance,
} from "@/features/services/gallery";

describe("clampScale", () => {
  it("deja pasar un zoom dentro del rango", () => {
    expect(clampScale(2)).toBe(2);
  });

  it("no baja de MIN_ZOOM ni sube de MAX_ZOOM", () => {
    expect(clampScale(0.2)).toBe(MIN_ZOOM);
    expect(clampScale(99)).toBe(MAX_ZOOM);
  });
});

describe("touchDistance", () => {
  it("calcula la distancia entre dos dedos", () => {
    expect(touchDistance({ pageX: 0, pageY: 0 }, { pageX: 3, pageY: 4 })).toBe(5);
  });

  it("es cero si los dedos están en el mismo punto", () => {
    expect(touchDistance({ pageX: 10, pageY: 10 }, { pageX: 10, pageY: 10 })).toBe(0);
  });
});

describe("nextScaleFromPinch", () => {
  it("abrir los dedos acerca (el zoom crece en proporción)", () => {
    expect(nextScaleFromPinch(1, 100, 200)).toBe(2);
  });

  it("cerrar los dedos aleja, sin bajar del mínimo", () => {
    expect(nextScaleFromPinch(2, 200, 100)).toBe(1);
    expect(nextScaleFromPinch(1, 200, 50)).toBe(MIN_ZOOM);
  });

  it("parte del zoom con el que empezó el gesto", () => {
    expect(nextScaleFromPinch(2, 100, 150)).toBe(3);
  });

  it("no pasa de MAX_ZOOM", () => {
    expect(nextScaleFromPinch(3, 100, 900)).toBe(MAX_ZOOM);
  });

  it("sin distancia inicial no cambia el zoom", () => {
    expect(nextScaleFromPinch(2, 0, 150)).toBe(2);
  });
});

describe("clampTranslation", () => {
  it("con zoom 1 no hay desplazamiento", () => {
    expect(clampTranslation(50, 1, 400)).toBe(0);
    expect(clampTranslation(-50, 1, 400)).toBe(0);
  });

  it("con zoom 2 permite hasta la mitad de lo que sobresale", () => {
    // (2 - 1) * 400 / 2 = 200
    expect(clampTranslation(120, 2, 400)).toBe(120);
    expect(clampTranslation(999, 2, 400)).toBe(200);
    expect(clampTranslation(-999, 2, 400)).toBe(-200);
  });
});

describe("toggleZoomScale", () => {
  it("sin zoom salta al zoom de doble toque", () => {
    expect(toggleZoomScale(MIN_ZOOM)).toBe(DOUBLE_TAP_ZOOM);
  });

  it("ya ampliada vuelve a MIN_ZOOM", () => {
    expect(toggleZoomScale(2)).toBe(MIN_ZOOM);
  });
});

describe("stepZoom", () => {
  it("+ suma un paso y − lo resta", () => {
    expect(stepZoom(1, 1)).toBe(1 + ZOOM_STEP);
    expect(stepZoom(2, -1)).toBe(2 - ZOOM_STEP);
  });

  it("respeta los límites", () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });
});
