import { renderHook, waitFor } from "@testing-library/react-native";

import { useInstitutionalContent, useSliders } from "@/features/institutional/hooks/useInstitutional";
import { institutionalRepository } from "@/features/institutional/repositories/institutionalRepository";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/institutional/repositories/institutionalRepository", () => ({
  institutionalRepository: { getSliders: jest.fn(), getContent: jest.fn() },
}));

const repo = institutionalRepository as jest.Mocked<typeof institutionalRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useSliders", () => {
  it("pide los banners y los expone", async () => {
    const sliders = [{ id: 1, imagen_url: "/b1.png" }];
    repo.getSliders.mockResolvedValueOnce(sliders);
    const { result } = await renderHook(() => useSliders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getSliders).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(sliders);
  });

  it("ante un error expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getSliders.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useSliders(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useInstitutionalContent", () => {
  it("pide el contenido institucional y lo expone", async () => {
    const contenido = { telefono: "+52 771 000 0000", correo: "contacto@syscom.com", direccion: null };
    repo.getContent.mockResolvedValueOnce(contenido);
    const { result } = await renderHook(() => useInstitutionalContent(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getContent).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(contenido);
  });

  it("ante un error expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getContent.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useInstitutionalContent(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
