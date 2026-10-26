import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  useFaqs,
  useInstitutionalContent,
  useNewsletter,
  usePolicies,
  useSliders,
} from "@/features/institutional/hooks/useInstitutional";
import { institutionalRepository } from "@/features/institutional/repositories/institutionalRepository";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/institutional/repositories/institutionalRepository", () => ({
  institutionalRepository: {
    getSliders: jest.fn(),
    getContent: jest.fn(),
    getFaqs: jest.fn(),
    getPolicies: jest.fn(),
    subscribeNewsletter: jest.fn(),
  },
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

describe("useFaqs", () => {
  it("pide las preguntas frecuentes y las expone", async () => {
    const faqs = [{ id_faq: 1, pregunta: "¿Envían?", respuesta: "Sí" }];
    repo.getFaqs.mockResolvedValueOnce(faqs);
    const { result } = await renderHook(() => useFaqs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getFaqs).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(faqs);
  });

  it("ante un error expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getFaqs.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useFaqs(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("usePolicies", () => {
  it("pide las políticas y las expone", async () => {
    const policies = [{ tipo: "politicas_privacidad", titulo: "Privacidad", contenido: "<p>x</p>" }];
    repo.getPolicies.mockResolvedValueOnce(policies);
    const { result } = await renderHook(() => usePolicies(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPolicies).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(policies);
  });

  it("ante un error expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPolicies.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => usePolicies(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useNewsletter", () => {
  it("suscribe: llama al repository con nombre y correo", async () => {
    repo.subscribeNewsletter.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useNewsletter(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ nombre: "Ana", correo: "ana@ejemplo.com" });
    });

    expect(repo.subscribeNewsletter).toHaveBeenCalledWith("Ana", "ana@ejemplo.com");
    expect(result.current.isSuccess).toBe(true);
  });

  it("ante un error de la API expone el error", async () => {
    const error = makeApiError({ status: 400, message: "Correo inválido" });
    repo.subscribeNewsletter.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useNewsletter(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ nombre: "Ana", correo: "x" }).catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});
