import { selectRootProductCategories } from "@/features/catalog/selectors";
import { makeCategory } from "./fixtures";

const cat = makeCategory;

describe("selectRootProductCategories", () => {
  it("conserva solo las categorías raíz de productos", () => {
    const todas = [
      cat({ id: 1, nombre: "Computadoras" }),
      cat({ id: 11, nombre: "Laptops", es_padre: false, id_padre: 1 }),
      cat({ id: 24, nombre: "Reparación", tipo: "servicio" }),
    ];
    expect(selectRootProductCategories(todas).map((c) => c.id)).toEqual([1]);
  });

  it("acepta raíz marcada solo por id_padre nulo", () => {
    const sinFlag = cat({ id: 5, es_padre: false, id_padre: null });
    expect(selectRootProductCategories([sinFlag])).toHaveLength(1);
  });

  it("devuelve lista vacía si no hay categorías", () => {
    expect(selectRootProductCategories([])).toEqual([]);
  });
});
