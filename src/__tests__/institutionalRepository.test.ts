import { institutionalRepository } from "@/features/institutional/repositories/institutionalRepository";

import { makeApiError } from "./fixtures";
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

describe("institutionalRepository.getSliders", () => {
  it("envía GET /institutional/sliders y devuelve los banners", async () => {
    const sliders = [{ id: 1, imagen_url: "/banner1.png" }, { id: 2, imagen_url: "/banner2.png" }];
    responde({ data: sliders });

    const resultado = await institutionalRepository.getSliders();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/institutional/sliders" });
    expect(resultado).toEqual(sliders);
  });

  it("devuelve lista vacía si la respuesta no trae un arreglo", async () => {
    responde({ data: null });

    await expect(institutionalRepository.getSliders()).resolves.toEqual([]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(institutionalRepository.getSliders()).rejects.toBe(error);
  });
});

describe("institutionalRepository.getContent", () => {
  it("envía GET /institutional y devuelve el contenido", async () => {
    const contenido = { telefono: "+52 771 000 0000", correo: "contacto@syscom.com", direccion: "Calle 1" };
    responde({ data: contenido });

    const resultado = await institutionalRepository.getContent();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/institutional" });
    expect(resultado).toEqual(contenido);
  });

  it("devuelve null si la respuesta viene vacía", async () => {
    adapter.mockImplementationOnce(async (config) => ({
      data: null,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    await expect(institutionalRepository.getContent()).resolves.toBeNull();
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    adapter.mockRejectedValueOnce(error);

    await expect(institutionalRepository.getContent()).rejects.toBe(error);
  });
});

describe("institutionalRepository.getFaqs", () => {
  it("envía GET /institutional/faqs y devuelve las preguntas", async () => {
    const faqs = [{ id_faq: 1, pregunta: "¿Envían?", respuesta: "Sí" }];
    responde({ data: faqs });

    const resultado = await institutionalRepository.getFaqs();

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/institutional/faqs" });
    expect(resultado).toEqual(faqs);
  });

  it("devuelve lista vacía si la respuesta no trae un arreglo", async () => {
    responde({ data: null });

    await expect(institutionalRepository.getFaqs()).resolves.toEqual([]);
  });
});

describe("institutionalRepository.getPolicies", () => {
  it("pide las 2 políticas públicas y devuelve las que tienen contenido", async () => {
    responde({ data: { titulo: "Privacidad", contenido: "<p>priv</p>" } });
    responde({ data: { titulo: "Términos", contenido: "<p>term</p>" } });

    const resultado = await institutionalRepository.getPolicies();

    expect(resultado.map((p) => p.tipo)).toEqual(["politicas_privacidad", "terminos_condiciones"]);
    expect(resultado).toHaveLength(2);
  });

  it("omite una política sin contenido", async () => {
    responde({ data: { titulo: "Privacidad", contenido: "<p>priv</p>" } });
    responde({ data: { titulo: "Términos" } });

    const resultado = await institutionalRepository.getPolicies();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("politicas_privacidad");
  });

  it("omite una política si su petición falla (no rechaza)", async () => {
    responde({ data: { titulo: "Privacidad", contenido: "<p>priv</p>" } });
    adapter.mockRejectedValueOnce(makeApiError({ status: 500 }));

    const resultado = await institutionalRepository.getPolicies();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("politicas_privacidad");
  });
});

describe("institutionalRepository.subscribeNewsletter", () => {
  it("envía POST /contact/newsletter con nombre y correo", async () => {
    responde({});

    await institutionalRepository.subscribeNewsletter("Ana", "ana@ejemplo.com");

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/contact/newsletter" });
    expect(cuerpo).toEqual({ nombre: "Ana", correo: "ana@ejemplo.com" });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 400, message: "Correo inválido" });
    adapter.mockRejectedValueOnce(error);

    await expect(institutionalRepository.subscribeNewsletter("Ana", "x")).rejects.toBe(error);
  });
});
