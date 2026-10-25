import {
  clampRating,
  distributionRows,
  formatAverage,
  hasMoreReviews,
  ratingLabel,
  reviewAuthor,
  reviewDateLabel,
  reviewerName,
  reviewsCountLabel,
  starIcons,
} from "@/features/reviews/reviewSelectors";

import { makeReview } from "./fixtures/review";

describe("reviewAuthor", () => {
  it("lee el autor de `usuarios` (forma real del backend)", () => {
    const r = makeReview({ usuarios: { nombre: "Ana", apellido_paterno: "Lopez", foto_perfil: null } });
    expect(reviewAuthor(r)).toEqual({ nombre: "Ana", apellido_paterno: "Lopez", foto_perfil: null });
  });

  it("usa `usuario` (singular) como respaldo cuando no hay `usuarios`", () => {
    const r = makeReview({
      usuarios: undefined,
      usuario: { nombre: "Luis", apellido_paterno: "Hdz", foto_perfil: null },
    });
    expect(reviewAuthor(r)?.nombre).toBe("Luis");
  });

  it("prefiere `usuarios` si vienen las dos claves", () => {
    const r = makeReview({
      usuarios: { nombre: "Ana", apellido_paterno: "A", foto_perfil: null },
      usuario: { nombre: "Luis", apellido_paterno: "B", foto_perfil: null },
    });
    expect(reviewAuthor(r)?.nombre).toBe("Ana");
  });

  it("devuelve null con las dos claves nulas o ausentes", () => {
    expect(reviewAuthor(makeReview({ usuarios: null, usuario: null }))).toBeNull();
    expect(reviewAuthor(makeReview({ usuarios: undefined }))).toBeNull();
  });
});

describe("reviewerName", () => {
  it("muestra el nombre y la inicial del apellido paterno", () => {
    expect(reviewerName(makeReview())).toBe("Angel M.");
  });

  it("pone la inicial en mayúscula y recorta espacios", () => {
    const r = makeReview({ usuarios: { nombre: "  ana ", apellido_paterno: " lópez", foto_perfil: null } });
    expect(reviewerName(r)).toBe("ana L.");
  });

  it("sin apellido muestra solo el nombre", () => {
    const r = makeReview({ usuarios: { nombre: "Ana", apellido_paterno: "", foto_perfil: null } });
    expect(reviewerName(r)).toBe("Ana");
  });

  it("sin autor (usuarios nulo) usa un nombre genérico", () => {
    expect(reviewerName(makeReview({ usuarios: null }))).toBe("Cliente de SYSCOM");
  });

  it("con nombre vacío o no textual usa el nombre genérico", () => {
    const r = makeReview({ usuarios: { nombre: "   ", apellido_paterno: "M", foto_perfil: null } });
    expect(reviewerName(r)).toBe("Cliente de SYSCOM");
    const raro = makeReview({ usuarios: { nombre: 5 as unknown as string, apellido_paterno: "M", foto_perfil: null } });
    expect(reviewerName(raro)).toBe("Cliente de SYSCOM");
  });
});

describe("reviewDateLabel", () => {
  it("formatea la fecha en hora de México", () => {
    expect(reviewDateLabel("2026-06-29T18:27:30.440Z")).toBe("29 jun 2026");
  });

  it("created_at nulo, vacío o inválido devuelve null (no se muestra fecha)", () => {
    expect(reviewDateLabel(null)).toBeNull();
    expect(reviewDateLabel(undefined)).toBeNull();
    expect(reviewDateLabel("")).toBeNull();
    expect(reviewDateLabel("no-es-fecha")).toBeNull();
  });
});

describe("clampRating y ratingLabel", () => {
  it.each([
    [4, 4],
    [4.5, 4.5],
    [0, 0],
    [7, 5],
    [-2, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])("clampRating(%s) = %s", (entrada, esperado) => {
    expect(clampRating(entrada)).toBe(esperado);
  });

  it("clampRating de un valor no numérico es 0", () => {
    expect(clampRating("5" as unknown as number)).toBe(0);
    expect(clampRating(undefined as unknown as number)).toBe(0);
  });

  it("ratingLabel dice 'N de 5 estrellas' y usa singular con 1", () => {
    expect(ratingLabel(4)).toBe("4 de 5 estrellas");
    expect(ratingLabel(4.5)).toBe("4.5 de 5 estrellas");
    expect(ratingLabel(1)).toBe("1 de 5 estrellas");
    expect(ratingLabel(9)).toBe("5 de 5 estrellas");
  });
});

describe("starIcons", () => {
  it("siempre devuelve 5 íconos", () => {
    for (const v of [0, 1, 2.5, 5, Number.NaN, 99]) expect(starIcons(v)).toHaveLength(5);
  });

  it("5 enteras y 0 vacías", () => {
    expect(starIcons(5)).toEqual(["star", "star", "star", "star", "star"]);
    expect(starIcons(0)).toEqual(Array(5).fill("star-outline"));
  });

  it("redondea al medio punto más cercano", () => {
    expect(starIcons(4.5)).toEqual(["star", "star", "star", "star", "star-half"]);
    expect(starIcons(4.3)).toEqual(["star", "star", "star", "star", "star-half"]);
    expect(starIcons(4.2)).toEqual(["star", "star", "star", "star", "star-outline"]);
    expect(starIcons(4.8)).toEqual(["star", "star", "star", "star", "star"]);
  });

  it("valores fuera de rango o inválidos se acotan", () => {
    expect(starIcons(99)).toEqual(starIcons(5));
    expect(starIcons(-3)).toEqual(starIcons(0));
    expect(starIcons(Number.NaN)).toEqual(starIcons(0));
  });
});

describe("formatAverage", () => {
  it("un decimal", () => {
    expect(formatAverage(4.5)).toBe("4.5");
    expect(formatAverage(5)).toBe("5.0");
    expect(formatAverage(3.14159)).toBe("3.1");
  });

  it("valores inválidos o fuera de rango se acotan", () => {
    expect(formatAverage(Number.NaN)).toBe("0.0");
    expect(formatAverage(9)).toBe("5.0");
    expect(formatAverage(-1)).toBe("0.0");
  });
});

describe("distributionRows", () => {
  it("devuelve de 5 a 1 estrellas con su conteo y porcentaje", () => {
    const filas = distributionRows({ "1": 0, "2": 0, "3": 1, "4": 1, "5": 2 }, 4);
    expect(filas.map((f) => f.stars)).toEqual([5, 4, 3, 2, 1]);
    expect(filas.map((f) => f.count)).toEqual([2, 1, 1, 0, 0]);
    expect(filas.map((f) => f.percent)).toEqual([50, 25, 25, 0, 0]);
  });

  it("con total 0 todos los porcentajes son 0 (sin dividir entre cero)", () => {
    const filas = distributionRows({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }, 0);
    expect(filas.every((f) => f.percent === 0 && f.count === 0)).toBe(true);
  });

  it("claves faltantes cuentan como 0", () => {
    const filas = distributionRows({ "5": 3 }, 3);
    expect(filas.find((f) => f.stars === 5)).toMatchObject({ count: 3, percent: 100 });
    expect(filas.find((f) => f.stars === 1)).toMatchObject({ count: 0, percent: 0 });
  });

  it("conteos negativos o inválidos se tratan como 0 y el porcentaje nunca pasa de 100", () => {
    const filas = distributionRows({ "1": -4, "2": Number.NaN, "5": 10 } as never, 2);
    expect(filas.find((f) => f.stars === 1)?.count).toBe(0);
    expect(filas.find((f) => f.stars === 2)?.count).toBe(0);
    expect(filas.find((f) => f.stars === 5)?.percent).toBe(100);
  });

  it("sin distribución (nulo) devuelve 5 filas en cero", () => {
    const filas = distributionRows(null as never, 0);
    expect(filas).toHaveLength(5);
    expect(filas.every((f) => f.count === 0)).toBe(true);
  });
});

describe("reviewsCountLabel y hasMoreReviews", () => {
  it("singular, plural y vacío", () => {
    expect(reviewsCountLabel(0)).toBe("Sin reseñas");
    expect(reviewsCountLabel(1)).toBe("1 reseña");
    expect(reviewsCountLabel(12)).toBe("12 reseñas");
    expect(reviewsCountLabel(Number.NaN)).toBe("Sin reseñas");
    expect(reviewsCountLabel(-3)).toBe("Sin reseñas");
  });

  it("hay más mientras lo cargado sea menor que el total", () => {
    expect(hasMoreReviews(5, 12)).toBe(true);
    expect(hasMoreReviews(12, 12)).toBe(false);
    expect(hasMoreReviews(0, 0)).toBe(false);
    expect(hasMoreReviews(3, 0)).toBe(false);
  });
});
