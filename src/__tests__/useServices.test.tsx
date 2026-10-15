import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useInfiniteServices } from "@/features/services/hooks/useServices";
import { serviceRepository } from "@/features/services/repositories/serviceRepository";
import type { PaginatedServices, ServiceListItem } from "@/features/services/types";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/services/repositories/serviceRepository", () => ({
  serviceRepository: { getPage: jest.fn() },
}));

const repo = serviceRepository as jest.Mocked<typeof serviceRepository>;
const { wrapper } = usarQueryWrapper();
const filtros = { search: "camara" };

const svc = (id: number): ServiceListItem => ({ id, nombre: `Servicio ${id}` });
const pagina1 = (): PaginatedServices => ({
  data: [svc(1), svc(2)],
  pagination: { page: 1, limit: 2, total: 3, pages: 2 },
});
const pagina2 = (): PaginatedServices => ({
  data: [svc(3)],
  pagination: { page: 2, limit: 2, total: 3, pages: 2 },
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useInfiniteServices", () => {
  it("primera página: pide la página 1 y expone servicios y total", async () => {
    repo.getPage.mockResolvedValueOnce(pagina1());
    const { result } = await renderHook(() => ({ ...useInfiniteServices(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPage).toHaveBeenCalledWith(filtros, 1);
    expect(result.current.data?.data.map((s) => s.id)).toEqual([1, 2]);
    expect(result.current.data?.total).toBe(3);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("siguiente página: pide la página 2 y la agrega a la lista", async () => {
    repo.getPage.mockResolvedValueOnce(pagina1()).mockResolvedValueOnce(pagina2());
    const { result } = await renderHook(() => ({ ...useInfiniteServices(filtros) }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(repo.getPage).toHaveBeenLastCalledWith(filtros, 2);
    expect(result.current.data?.data.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("sin resultados devuelve lista vacía y total 0", async () => {
    repo.getPage.mockResolvedValueOnce({ data: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } });
    const { result } = await renderHook(() => ({ ...useInfiniteServices(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ data: [], total: 0 });
  });

  it("ante un error de la API expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPage.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useInfiniteServices(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
