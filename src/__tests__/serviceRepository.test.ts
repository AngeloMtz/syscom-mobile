import { SERVICES_PAGE_SIZE, serviceRepository } from "@/features/services/repositories/serviceRepository";
import type { ServiceDetail, ServiceListItem } from "@/features/services/types";

import { makeApiError } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

const svc = (over: Partial<ServiceListItem> = {}): ServiceListItem => ({
  id: 1,
  nombre: "Instalación de cámaras",
  duracion_estimada: "2 horas",
  imagen_principal: "https://example.com/s1.jpg",
  ...over,
});
const pagination = { page: 1, limit: SERVICES_PAGE_SIZE, total: 2, pages: 1 };

beforeEach(() => {
  adapter.mockReset();
});

describe("serviceRepository.getPage", () => {
  it("sin búsqueda: GET /catalog/services con page y limit", async () => {
    const servicios = [svc({ id: 1 }), svc({ id: 2 })];
    responde({ data: servicios, pagination });

    const resultado = await serviceRepository.getPage({}, 1);

    const { metodo, ruta, params } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/services" });
    expect(params).toEqual({ page: 1, limit: SERVICES_PAGE_SIZE });
    expect(resultado).toEqual({ data: servicios, pagination });
  });

  it("con búsqueda: GET /catalog/services/search con q, page y limit", async () => {
    responde({ data: [], pagination });

    await serviceRepository.getPage({ search: "camara" }, 2);

    const { ruta, params } = ultimaPeticion();
    expect(ruta).toBe("/catalog/services/search");
    expect(params).toEqual({ q: "camara", page: 2, limit: SERVICES_PAGE_SIZE });
  });

  it("respeta el limit indicado", async () => {
    responde({ data: [], pagination });

    await serviceRepository.getPage({ limit: 5 }, 1);

    expect(ultimaPeticion().params).toMatchObject({ limit: 5 });
  });

  it("devuelve lista vacía y paginación en cero si la respuesta viene incompleta", async () => {
    responde({});

    const resultado = await serviceRepository.getPage({}, 1);

    expect(resultado).toEqual({
      data: [],
      pagination: { page: 1, limit: SERVICES_PAGE_SIZE, total: 0, pages: 0 },
    });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(serviceRepository.getPage({}, 1)).rejects.toBe(error);
  });
});

describe("serviceRepository.getById", () => {
  it("GET /catalog/services/:id y devuelve el detalle", async () => {
    const detalle: ServiceDetail = { ...svc({ id: 7 }), que_incluye: [], proceso: [], videos: [] };
    responde({ data: detalle });

    const resultado = await serviceRepository.getById(7);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/catalog/services/7" });
    expect(resultado).toEqual(detalle);
  });

  it("devuelve null si la API responde 404", async () => {
    adapter.mockRejectedValueOnce(makeApiError({ status: 404, error: "Servicio no encontrado" }));

    await expect(serviceRepository.getById(999)).resolves.toBeNull();
  });

  it("rechaza con el error 500 de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error al obtener servicio" });
    adapter.mockRejectedValueOnce(error);

    await expect(serviceRepository.getById(1)).rejects.toBe(error);
  });
});
