import { renderHook, waitFor } from "@testing-library/react-native";

import { useService } from "@/features/services/hooks/useService";
import { serviceRepository } from "@/features/services/repositories/serviceRepository";
import type { ServiceDetail } from "@/features/services/types";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/services/repositories/serviceRepository", () => ({
  serviceRepository: { getById: jest.fn() },
}));

const repo = serviceRepository as jest.Mocked<typeof serviceRepository>;
const { wrapper } = usarQueryWrapper();

const detalle = (id: number): ServiceDetail => ({ id, nombre: `Servicio ${id}` });

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useService", () => {
  it("pide el detalle por id y lo expone", async () => {
    repo.getById.mockResolvedValueOnce(detalle(7));
    const { result } = await renderHook(() => ({ ...useService("7") }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getById).toHaveBeenCalledWith(7);
    expect(result.current.data).toEqual(detalle(7));
    expect(result.current.notFound).toBe(false);
  });

  it("con id inválido no consulta y marca notFound", async () => {
    const { result } = await renderHook(() => ({ ...useService("abc") }), { wrapper });

    expect(repo.getById).not.toHaveBeenCalled();
    expect(result.current.notFound).toBe(true);
  });

  it("un 404 (data null) se expone como notFound", async () => {
    repo.getById.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => ({ ...useService("999") }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.notFound).toBe(true);
  });

  it("ante un error de la API expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getById.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useService("1") }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
