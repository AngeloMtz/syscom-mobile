import {
  COMMENT_MAX,
  COMMENT_MIN,
  TITLE_MAX,
  buildReviewInput,
  validateReview,
} from "@/features/reviews/reviewValidation";

const valid = { calificacion: 4, titulo: "Buen producto", comentario: "Llegó rápido y funciona bien." };

describe("validateReview: calificación", () => {
  it.each([1, 2, 3, 4, 5])("%s es válida", (n) => {
    expect(validateReview({ ...valid, calificacion: n })).toEqual({});
  });

  it.each([
    ["0", 0],
    ["6", 6],
    ["-1", -1],
    ["decimal (2.5)", 2.5],
    ["NaN", Number.NaN],
    ["infinito", Number.POSITIVE_INFINITY],
    ["texto", "4" as unknown as number],
    ["indefinida", undefined as unknown as number],
  ])("%s es inválida", (_nombre, valor) => {
    expect(validateReview({ ...valid, calificacion: valor }).calificacion).toBe(
      "Selecciona una calificación de 1 a 5 estrellas",
    );
  });
});

describe("validateReview: comentario (se recorta antes de medir)", () => {
  it("vacío o solo espacios pide al menos 10 caracteres", () => {
    const msg = `El comentario debe tener al menos ${COMMENT_MIN} caracteres`;
    expect(validateReview({ ...valid, comentario: "" }).comentario).toBe(msg);
    expect(validateReview({ ...valid, comentario: "     " }).comentario).toBe(msg);
  });

  it("9 caracteres es inválido y 10 es válido", () => {
    expect(validateReview({ ...valid, comentario: "123456789" }).comentario).toBeDefined();
    expect(validateReview({ ...valid, comentario: "1234567890" }).comentario).toBeUndefined();
  });

  it("los espacios de los extremos no cuentan: 9 caracteres con espacios sigue siendo inválido", () => {
    expect(validateReview({ ...valid, comentario: "   123456789   " }).comentario).toBeDefined();
    expect(validateReview({ ...valid, comentario: "  1234567890  " }).comentario).toBeUndefined();
  });

  it("1000 caracteres es válido y 1001 es inválido", () => {
    expect(validateReview({ ...valid, comentario: "a".repeat(COMMENT_MAX) }).comentario).toBeUndefined();
    expect(validateReview({ ...valid, comentario: "a".repeat(COMMENT_MAX + 1) }).comentario).toBe(
      `El comentario no puede exceder ${COMMENT_MAX} caracteres`,
    );
  });

  it("1000 caracteres rodeados de espacios es válido (se miden ya recortados)", () => {
    expect(validateReview({ ...valid, comentario: ` ${"a".repeat(COMMENT_MAX)} ` }).comentario).toBeUndefined();
  });
});

describe("validateReview: título (opcional)", () => {
  it("vacío o solo espacios es válido", () => {
    expect(validateReview({ ...valid, titulo: "" })).toEqual({});
    expect(validateReview({ ...valid, titulo: "    " })).toEqual({});
  });

  it("150 caracteres es válido y 151 es inválido", () => {
    expect(validateReview({ ...valid, titulo: "t".repeat(TITLE_MAX) }).titulo).toBeUndefined();
    expect(validateReview({ ...valid, titulo: "t".repeat(TITLE_MAX + 1) }).titulo).toBe(
      `El título no puede exceder ${TITLE_MAX} caracteres`,
    );
  });

  it("150 caracteres con espacios alrededor es válido", () => {
    expect(validateReview({ ...valid, titulo: ` ${"t".repeat(TITLE_MAX)} ` }).titulo).toBeUndefined();
  });
});

describe("validateReview: combinaciones", () => {
  it("datos válidos devuelven un objeto vacío", () => {
    expect(validateReview(valid)).toEqual({});
  });

  it("acumula los errores de todos los campos", () => {
    const errores = validateReview({ calificacion: 0, titulo: "t".repeat(151), comentario: "corto" });
    expect(Object.keys(errores).sort()).toEqual(["calificacion", "comentario", "titulo"]);
  });

  it("los límites son los que valida el backend", () => {
    expect([COMMENT_MIN, COMMENT_MAX, TITLE_MAX]).toEqual([10, 1000, 150]);
  });
});

describe("buildReviewInput", () => {
  it("arma la entrada con los ids, recortando título y comentario", () => {
    expect(
      buildReviewInput({ calificacion: 5, titulo: "  Excelente ", comentario: "  Muy buena compra, la recomiendo.  " }, 7, 12),
    ).toEqual({
      idProducto: 7,
      idPedido: 12,
      calificacion: 5,
      titulo: "Excelente",
      comentario: "Muy buena compra, la recomiendo.",
    });
  });

  it("sin título (vacío o solo espacios) no incluye la clave", () => {
    const sinTitulo = buildReviewInput({ calificacion: 3, titulo: "   ", comentario: "Cumple con lo esperado." }, 7, 12);
    expect("titulo" in sinTitulo).toBe(false);
  });
});
