import { renderHook, waitFor } from "@testing-library/react-native";

import { useServicesPreview } from "@/features/services/hooks/useServicesPreview";
import { serviceRepository } from "@/features/services/repositories/serviceRepository";
import type { ServiceListItem } from "@/features/services/types";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/services/repositories/serviceRepository", () => ({
  serviceRepository: { getPage: jest.fn() },
}));

const repo = serviceRepository as jest.Mocked<typeof serviceRepository>;
const { wrapper } = usarQueryWrapper();

const svc = (id: number): ServiceListItem => ({ id, nombre: `Servicio ${id}` });

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useServicesPreview", () => {
  it("pide la primera página con el límite y recorta al número pedido", async () => {
    const ocho = Array.from({ length: 8 }, (_, i) => svc(i + 1));
    repo.getPage.mockResolvedValueOnce({ data: ocho, pagination: { page: 1, limit: 6, total: 8, pages: 2 } });
    const { result } = await renderHook(() => useServicesPreview(6), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPage).toHaveBeenCalledWith({ limit: 6 }, 1);
    expect(result.current.data).toHaveLength(6);
    expect(result.current.data?.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPage.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useServicesPreview(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
