// OnboardingFlow: el componente recibe `onFinish` por prop (RootLayout le pasa complete() del
// onboardingStore; ese cableado y la bandera guardada ya los cubre integration/arranqueDeLaApp).
// Aquí se simulan solo los iconos y las áreas seguras; el carrusel, los puntos y los botones son reales.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import OnboardingFlow from "@/features/onboarding/components/OnboardingFlow";
import { SLIDES } from "@/features/onboarding/slides";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const ancho = Dimensions.get("window").width;

/** El ScrollView del carrusel: el ancestro de una lámina que escucha el fin del deslizamiento. */
const carrusel = () => {
  let nodo = screen.getByText(SLIDES[0].title).parent;
  while (nodo && !nodo.props.onMomentumScrollEnd) nodo = nodo.parent;
  if (!nodo) throw new Error("No se encontró el ScrollView del carrusel");
  return nodo;
};

/** Simula que el usuario terminó de deslizar hasta la lámina `pagina` (0 = primera). */
const deslizarA = (pagina: number, desfase = 0) =>
  fireEvent(carrusel(), "momentumScrollEnd", {
    nativeEvent: { contentOffset: { x: pagina * ancho + desfase, y: 0 } },
  });

const progreso = (n: number) => screen.getByLabelText(`Pantalla ${n} de ${SLIDES.length}`);

describe("OnboardingFlow", () => {
  it("empieza en la primera lámina con el botón Siguiente", async () => {
    await render(<OnboardingFlow onFinish={jest.fn()} />);

    expect(screen.getByText(SLIDES[0].title)).toBeTruthy();
    expect(progreso(1)).toBeTruthy();
    expect(screen.getByLabelText("Siguiente")).toBeTruthy();
    expect(screen.queryByLabelText("Comenzar")).toBeNull();
  });

  it("Omitir llama a onFinish desde la primera lámina", async () => {
    const onFinish = jest.fn();
    await render(<OnboardingFlow onFinish={onFinish} />);

    await fireEvent.press(screen.getByLabelText("Omitir la bienvenida"));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("Siguiente no termina el flujo mientras haya más láminas", async () => {
    const onFinish = jest.fn();
    await render(<OnboardingFlow onFinish={onFinish} />);

    await fireEvent.press(screen.getByLabelText("Siguiente"));

    expect(onFinish).not.toHaveBeenCalled();
  });

  it("al deslizar a la segunda lámina avanza el indicador de progreso", async () => {
    await render(<OnboardingFlow onFinish={jest.fn()} />);

    await deslizarA(1);

    expect(progreso(2)).toBeTruthy();
    expect(screen.queryByLabelText(`Pantalla 1 de ${SLIDES.length}`)).toBeNull();
    expect(screen.getByLabelText("Siguiente")).toBeTruthy();
  });

  it("en la última lámina el botón es Comenzar y llama a onFinish una sola vez", async () => {
    const onFinish = jest.fn();
    await render(<OnboardingFlow onFinish={onFinish} />);

    await deslizarA(SLIDES.length - 1);

    expect(progreso(SLIDES.length)).toBeTruthy();
    expect(screen.queryByLabelText("Siguiente")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Comenzar"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("Omitir sigue disponible en la última lámina", async () => {
    const onFinish = jest.fn();
    await render(<OnboardingFlow onFinish={onFinish} />);
    await deslizarA(SLIDES.length - 1);

    await fireEvent.press(screen.getByLabelText("Omitir la bienvenida"));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("un desplazamiento a medias se redondea a la lámina más cercana", async () => {
    await render(<OnboardingFlow onFinish={jest.fn()} />);

    await deslizarA(1, ancho * 0.4);
    expect(progreso(2)).toBeTruthy();

    await deslizarA(1, -ancho * 0.6); // 0.4 de ancho: queda en la primera
    expect(progreso(1)).toBeTruthy();
  });

  it("volver a la lámina anterior restablece el botón Siguiente", async () => {
    await render(<OnboardingFlow onFinish={jest.fn()} />);
    await deslizarA(SLIDES.length - 1);
    expect(screen.getByLabelText("Comenzar")).toBeTruthy();

    await deslizarA(0);

    expect(screen.getByLabelText("Siguiente")).toBeTruthy();
    expect(screen.queryByLabelText("Comenzar")).toBeNull();
  });
});
