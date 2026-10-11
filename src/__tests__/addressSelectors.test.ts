import {
  addressToInput,
  canProceedToPayment,
  formatAddressFull,
  formatAddressLine,
  removeAddress,
  resolveSelectedAddress,
  sortByRecent,
} from "@/features/addresses/addressSelectors";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";

import { makeAddress, makeCartItemFor, makeCartResult } from "./fixtures";

describe("formatAddressLine / formatAddressFull", () => {
  it("la línea corta es calle y colonia", () => {
    expect(formatAddressLine(makeAddress())).toBe("Av. Juárez 123, Centro");
  });
  it("la completa agrega ciudad, estado y código postal", () => {
    expect(formatAddressFull(makeAddress())).toBe("Av. Juárez 123, Centro, Huejutla, Hidalgo, C.P. 43000");
  });
});

describe("sortByRecent", () => {
  it("ordena de la más reciente a la más antigua", () => {
    const lista = [
      makeAddress({ id_direccion: 1, created_at: "2026-01-01T00:00:00.000Z" }),
      makeAddress({ id_direccion: 2, created_at: "2026-03-01T00:00:00.000Z" }),
      makeAddress({ id_direccion: 3, created_at: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(sortByRecent(lista).map((a) => a.id_direccion)).toEqual([2, 3, 1]);
  });
  it("con la misma fecha va primero la de id mayor", () => {
    const lista = [
      makeAddress({ id_direccion: 1, created_at: "2026-01-01T00:00:00.000Z" }),
      makeAddress({ id_direccion: 9, created_at: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(sortByRecent(lista).map((a) => a.id_direccion)).toEqual([9, 1]);
  });
  it("una fecha inválida no rompe el orden: se ordena por id", () => {
    const lista = [
      makeAddress({ id_direccion: 1, created_at: "no-es-fecha" }),
      makeAddress({ id_direccion: 5, created_at: "no-es-fecha" }),
    ];
    expect(sortByRecent(lista).map((a) => a.id_direccion)).toEqual([5, 1]);
  });
  it("no modifica la lista recibida", () => {
    const lista = [
      makeAddress({ id_direccion: 1, created_at: "2026-01-01T00:00:00.000Z" }),
      makeAddress({ id_direccion: 2, created_at: "2026-02-01T00:00:00.000Z" }),
    ];
    sortByRecent(lista);
    expect(lista.map((a) => a.id_direccion)).toEqual([1, 2]);
  });
});

describe("resolveSelectedAddress", () => {
  const lista = [
    makeAddress({ id_direccion: 1, created_at: "2026-01-01T00:00:00.000Z" }),
    makeAddress({ id_direccion: 2, created_at: "2026-02-01T00:00:00.000Z" }),
  ];

  it("devuelve la elegida si sigue en la lista", () => {
    expect(resolveSelectedAddress(lista, 1)?.id_direccion).toBe(1);
  });
  it("sin elección usa la más reciente", () => {
    expect(resolveSelectedAddress(lista, null)?.id_direccion).toBe(2);
  });
  it("si la elegida ya no está (eliminada o de otra cuenta) usa la más reciente", () => {
    expect(resolveSelectedAddress(lista, 99)?.id_direccion).toBe(2);
  });
  it("sin direcciones devuelve null", () => {
    expect(resolveSelectedAddress([], 1)).toBeNull();
    expect(resolveSelectedAddress(undefined, null)).toBeNull();
  });
});

describe("removeAddress", () => {
  it("quita la dirección por id sin modificar la lista", () => {
    const lista = [makeAddress({ id_direccion: 1 }), makeAddress({ id_direccion: 2 })];
    expect(removeAddress(lista, 1).map((a) => a.id_direccion)).toEqual([2]);
    expect(lista).toHaveLength(2);
  });
  it("si no está deja la lista igual y tolera undefined", () => {
    expect(removeAddress([makeAddress({ id_direccion: 1 })], 9)).toHaveLength(1);
    expect(removeAddress(undefined, 1)).toEqual([]);
  });
});

describe("addressToInput", () => {
  it("convierte referencias null en texto vacío", () => {
    expect(addressToInput(makeAddress({ referencias: null }))).toEqual({
      calle: "Av. Juárez 123",
      colonia: "Centro",
      ciudad: "Huejutla",
      estado: "Hidalgo",
      codigo_postal: "43000",
      referencias: "",
    });
  });
  it("conserva las referencias", () => {
    expect(addressToInput(makeAddress({ referencias: "Junto al parque" })).referencias).toBe("Junto al parque");
  });
});

describe("canProceedToPayment", () => {
  const carritoListo = () => makeCartResult({ items: [makeCartItemFor(1), makeCartItemFor(2)] });

  it("permite avanzar con carrito disponible y una dirección", () => {
    expect(canProceedToPayment(carritoListo(), makeAddress())).toBe(true);
  });
  it("no permite avanzar sin dirección", () => {
    expect(canProceedToPayment(carritoListo(), null)).toBe(false);
  });
  it("no permite avanzar con el carrito vacío", () => {
    expect(canProceedToPayment(makeCartResult({ items: [], total: 0, totalPrice: "0.00" }), makeAddress())).toBe(
      false,
    );
  });
  it("no permite avanzar con una línea agotada", () => {
    const items = [makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 0 }] } })];
    expect(canProceedToPayment(makeCartResult({ items }), makeAddress())).toBe(false);
  });
  it("sin carrito cargado no permite avanzar", () => {
    expect(canProceedToPayment(undefined, makeAddress())).toBe(false);
  });
});

describe("useCheckoutStore", () => {
  beforeEach(() => {
    useCheckoutStore.setState({ selectedAddressId: null });
  });

  it("empieza sin dirección elegida", () => {
    expect(useCheckoutStore.getState().selectedAddressId).toBeNull();
  });
  it("guarda y limpia la dirección elegida", () => {
    useCheckoutStore.getState().selectAddress(7);
    expect(useCheckoutStore.getState().selectedAddressId).toBe(7);
    useCheckoutStore.getState().selectAddress(null);
    expect(useCheckoutStore.getState().selectedAddressId).toBeNull();
  });
});
