import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Dimensions, ScrollView, StyleSheet } from "react-native";

import BannerCarousel from "@/shared/ui/BannerCarousel";
import { spacing } from "@/shared/theme/useColors";

// Mismo cálculo que el componente: el ancho de cada banner es la pantalla menos los márgenes.
const SLIDE_W = Dimensions.get("window").width - spacing.lg * 2;
const INTERVALO_MS = 4000;

const IMAGENES = ["https://example.com/a.jpg", "https://example.com/b.jpg", "https://example.com/c.jpg"];

type Nodo = { props?: Record<string, unknown>; children?: unknown[] | null };

function buscar(nodo: unknown, cumple: (n: Nodo) => boolean, acumulado: Nodo[] = []): Nodo[] {
  if (nodo === null || typeof nodo !== "object") return acumulado;
  if (Array.isArray(nodo)) {
    nodo.forEach((n) => buscar(n, cumple, acumulado));
    return acumulado;
  }
  const n = nodo as Nodo;
  if (cumple(n)) acumulado.push(n);
  (n.children ?? []).forEach((h) => buscar(h, cumple, acumulado));
  return acumulado;
}

/** Anchos de los puntos indicadores: el activo mide 18 y los demás 6. */
function anchosDePuntos(): number[] {
  return buscar(screen.toJSON(), (n) => {
    const e = StyleSheet.flatten(n.props?.style as never) as { height?: number; borderRadius?: number } | undefined;
    return e?.height === 6 && e?.borderRadius === 3;
  }).map((n) => (StyleSheet.flatten(n.props?.style as never) as { width: number }).width);
}

// RNTL 14 solo expone elementos del host: la raíz del carrusel es un View cuyo primer hijo es el ScrollView.
// El mock de ScrollView de React Native define `scrollTo` como un jest.fn compartido en su prototipo.
type Anfitrion = { children: Anfitrion[]; props: Record<string, any> };
const scrollView = () => (screen.root as unknown as Anfitrion).children[0] as unknown as Parameters<typeof fireEvent>[0] & Anfitrion;
const scrollTo = () => (ScrollView.prototype as unknown as { scrollTo: jest.Mock }).scrollTo;

beforeEach(() => {
  jest.useFakeTimers();
  scrollTo().mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

const avanzar = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

describe("BannerCarousel", () => {
  it("sin imágenes no dibuja nada", async () => {
    await render(<BannerCarousel images={[]} />);

    expect(screen.toJSON()).toBeNull();
  });

  it("dibuja un banner por imagen, con su URL", async () => {
    await render(<BannerCarousel images={IMAGENES} />);

    const imagenes = scrollView().children[0].children;
    expect(imagenes.map((i) => i.props.source.uri)).toEqual(IMAGENES);
  });

  it("con varias imágenes muestra un punto por banner y el primero activo", async () => {
    await render(<BannerCarousel images={IMAGENES} />);

    expect(anchosDePuntos()).toEqual([18, 6, 6]);
  });

  it("con una sola imagen no muestra puntos y no rota", async () => {
    await render(<BannerCarousel images={[IMAGENES[0]]} />);

    expect(anchosDePuntos()).toEqual([]);
    await avanzar(INTERVALO_MS * 3);
    expect(scrollTo()).not.toHaveBeenCalled();
  });

  it("rota sola cada 4 segundos: se desplaza al siguiente banner y mueve el punto activo", async () => {
    await render(<BannerCarousel images={IMAGENES} />);

    await avanzar(INTERVALO_MS);

    expect(scrollTo()).toHaveBeenLastCalledWith({ x: SLIDE_W, animated: true });
    expect(anchosDePuntos()).toEqual([6, 18, 6]);

    await avanzar(INTERVALO_MS);

    expect(scrollTo()).toHaveBeenLastCalledWith({ x: SLIDE_W * 2, animated: true });
    expect(anchosDePuntos()).toEqual([6, 6, 18]);
  });

  it("al llegar al último banner vuelve al primero", async () => {
    await render(<BannerCarousel images={IMAGENES} />);

    // Un avance por turno: el componente vuelve a armar su temporizador tras cada cambio de banner.
    await avanzar(INTERVALO_MS);
    await avanzar(INTERVALO_MS);
    await avanzar(INTERVALO_MS);

    expect(scrollTo()).toHaveBeenLastCalledWith({ x: 0, animated: true });
    expect(anchosDePuntos()).toEqual([18, 6, 6]);
  });

  it("no rota antes de que pasen los 4 segundos", async () => {
    await render(<BannerCarousel images={IMAGENES} />);

    await avanzar(INTERVALO_MS - 1);

    expect(scrollTo()).not.toHaveBeenCalled();
    expect(anchosDePuntos()).toEqual([18, 6, 6]);
  });

  it("al deslizar con el dedo actualiza el punto activo según la posición", async () => {
    await render(<BannerCarousel images={IMAGENES} />);

    await fireEvent(scrollView(), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: SLIDE_W * 2 } },
    });

    expect(anchosDePuntos()).toEqual([6, 6, 18]);
  });

  it("tras deslizar a mano, la rotación automática continúa desde ese banner", async () => {
    await render(<BannerCarousel images={IMAGENES} />);
    await fireEvent(scrollView(), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: SLIDE_W } },
    });

    await avanzar(INTERVALO_MS);

    expect(scrollTo()).toHaveBeenLastCalledWith({ x: SLIDE_W * 2, animated: true });
    expect(anchosDePuntos()).toEqual([6, 6, 18]);
  });

  it("al desmontar deja de rotar (limpia el temporizador)", async () => {
    const limpiar = jest.spyOn(globalThis, "clearInterval");
    const { unmount } = await render(<BannerCarousel images={IMAGENES} />);
    limpiar.mockClear();

    await unmount();

    // Tras desmontar la ref ya es nula, así que "no llamó a scrollTo" no basta: se comprueba la limpieza misma.
    expect(limpiar).toHaveBeenCalled();
    limpiar.mockRestore();
  });

  it("si las imágenes pasan a ser una sola, desaparecen los puntos y se detiene la rotación", async () => {
    const { rerender } = await render(<BannerCarousel images={IMAGENES} />);
    expect(anchosDePuntos()).toHaveLength(3);

    await rerender(<BannerCarousel images={[IMAGENES[0]]} />);

    expect(anchosDePuntos()).toEqual([]);
    scrollTo().mockClear();
    await avanzar(INTERVALO_MS * 2);
    expect(scrollTo()).not.toHaveBeenCalled();
  });
});
