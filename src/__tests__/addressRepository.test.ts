import { addressRepository } from "@/features/addresses/repositories/addressRepository";

import { makeAddress, makeApiError } from "./fixtures";
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

const payload = {
  calle: "Av. Juárez 123",
  colonia: "Centro",
  ciudad: "Huejutla",
  estado: "Hidalgo",
  codigo_postal: "43000",
};

describe("addressRepository.getAll", () => {
  it("envía GET /profile/addresses y devuelve la lista", async () => {
    const data = [makeAddress({ id_direccion: 1 }), makeAddress({ id_direccion: 2 })];
    responde({ data });

    const resultado = await addressRepository.getAll();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/profile/addresses" });
    expect(resultado).toEqual(data);
  });

  it("devuelve lista vacía si la respuesta viene incompleta", async () => {
    responde({});

    expect(await addressRepository.getAll()).toEqual([]);
  });

  it("descarta elementos sin id de dirección", async () => {
    responde({ data: [makeAddress({ id_direccion: 3 }), { calle: "sin id" }, null] });

    const resultado = await addressRepository.getAll();

    expect(resultado.map((a) => a.id_direccion)).toEqual([3]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 401, message: "No autenticado" });
    adapter.mockRejectedValueOnce(error);

    await expect(addressRepository.getAll()).rejects.toBe(error);
  });
});

describe("addressRepository.create", () => {
  it("envía POST /profile/addresses con el cuerpo y devuelve la dirección creada", async () => {
    // El backend responde la fila completa de Prisma (con id_usuario y activa).
    responde({
      data: { ...makeAddress({ id_direccion: 9 }), id_usuario: 4, activa: true },
    });

    const creada = await addressRepository.create({ ...payload, referencias: "Junto al parque" });

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/profile/addresses" });
    expect(cuerpo).toEqual({ ...payload, referencias: "Junto al parque" });
    expect(creada).toEqual(makeAddress({ id_direccion: 9 }));
    expect(creada).not.toHaveProperty("id_usuario");
  });

  it("no envía referencias cuando no hay", async () => {
    responde({ data: makeAddress({ id_direccion: 9 }) });

    await addressRepository.create(payload);

    expect(ultimaPeticion().cuerpo).toEqual(payload);
  });

  it("deja referencias en null si el servidor no las devuelve", async () => {
    responde({ data: { ...makeAddress({ id_direccion: 9 }), referencias: undefined } });

    expect((await addressRepository.create(payload)).referencias).toBeNull();
  });

  it("completa con texto vacío los campos que el servidor no devuelva", async () => {
    responde({ data: { id_direccion: 9 } });

    expect(await addressRepository.create(payload)).toEqual({
      id_direccion: 9,
      calle: "",
      colonia: "",
      ciudad: "",
      estado: "",
      codigo_postal: "",
      referencias: null,
      created_at: "",
    });
  });

  it("rechaza si la respuesta no trae la dirección", async () => {
    responde({});

    await expect(addressRepository.create(payload)).rejects.toThrow();
  });

  it("rechaza con el 400 de validación para que el formulario lo muestre", async () => {
    const error = makeApiError({
      status: 400,
      message: "La calle debe tener al menos 5 caracteres",
      errors: [{ field: "calle", message: "La calle debe tener al menos 5 caracteres" }],
    });
    adapter.mockRejectedValueOnce(error);

    await expect(addressRepository.create(payload)).rejects.toBe(error);
  });
});

describe("addressRepository.update", () => {
  it("envía PUT /profile/addresses/:id y devuelve la dirección actualizada", async () => {
    responde({ data: makeAddress({ id_direccion: 5, calle: "Nueva calle 45" }) });

    const actualizada = await addressRepository.update(5, { ...payload, calle: "Nueva calle 45", referencias: "" });

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "put", ruta: "/profile/addresses/5" });
    expect(cuerpo).toEqual({ ...payload, calle: "Nueva calle 45", referencias: "" });
    expect(actualizada.calle).toBe("Nueva calle 45");
  });

  it("rechaza con el 404 si la dirección no existe", async () => {
    const error = makeApiError({ status: 404, message: "Dirección no encontrada" });
    adapter.mockRejectedValueOnce(error);

    await expect(addressRepository.update(5, payload)).rejects.toBe(error);
  });
});

describe("addressRepository.remove", () => {
  it("envía DELETE /profile/addresses/:id", async () => {
    responde({ message: "Dirección eliminada correctamente" });

    await addressRepository.remove(5);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "delete", ruta: "/profile/addresses/5" });
  });

  it("trata el 404 (ya no estaba) como éxito", async () => {
    adapter.mockRejectedValueOnce(makeApiError({ status: 404, message: "Dirección no encontrada" }));

    await expect(addressRepository.remove(5)).resolves.toBeUndefined();
  });

  it("rechaza con un error de servidor", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    adapter.mockRejectedValueOnce(error);

    await expect(addressRepository.remove(5)).rejects.toBe(error);
  });
});
