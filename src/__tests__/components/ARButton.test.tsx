import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRouter } from "expo-router";

import ARButton from "@/features/ar/components/ARButton";
import { useProductModels } from "@/features/ar/hooks/useProductModels";

// Los íconos se simulan como texto con el nombre del ícono.
jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("@/features/ar/hooks/useProductModels", () => ({ useProductModels: jest.fn() }));

const router = useRouter as jest.Mock;
const useModels = useProductModels as jest.Mock;

const push = jest.fn();
const GLB = "https://cdn.example.com/laptop.glb";
const USDZ = "https://cdn.example.com/laptop.usdz";

beforeEach(() => {
  jest.resetAllMocks();
  router.mockReturnValue({ push });
});

describe("ARButton", () => {
  it("pide los modelos del producto recibido", async () => {
    useModels.mockReturnValue({ data: undefined });
    await render(<ARButton productId={7} />);

    expect(useModels).toHaveBeenCalledWith(7);
  });

  it("mientras no hay respuesta (cargando o con error) no se pinta", async () => {
    useModels.mockReturnValue({ data: undefined });
    await render(<ARButton productId={7} />);

    expect(screen.queryByLabelText("Ver en Realidad Aumentada")).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("un producto sin modelos 3D no muestra el botón", async () => {
    useModels.mockReturnValue({ data: {} });
    await render(<ARButton productId={7} />);

    expect(screen.toJSON()).toBeNull();
  });

  it.each([
    ["solo glb", { glb: GLB }],
    ["solo usdz", { usdz: USDZ }],
    ["glb y usdz", { glb: GLB, usdz: USDZ }],
  ])("con %s muestra el botón", async (_caso, modelos) => {
    useModels.mockReturnValue({ data: modelos });
    await render(<ARButton productId={7} productName="Laptop" />);

    expect(screen.getByLabelText("Ver en Realidad Aumentada")).toBeTruthy();
    expect(screen.getByText("Ver en Realidad Aumentada")).toBeTruthy();
    expect(screen.getByText("cube-outline")).toBeTruthy();
  });

  it("al tocarlo abre el visor con el nombre y las dos URLs", async () => {
    useModels.mockReturnValue({ data: { glb: GLB, usdz: USDZ } });
    await render(<ARButton productId={7} productName="Lenovo ThinkPad" />);

    await fireEvent.press(screen.getByLabelText("Ver en Realidad Aumentada"));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({
      pathname: "/viewer3d",
      params: { name: "Lenovo ThinkPad", glb: GLB, usdz: USDZ },
    });
  });

  it("el formato que falta viaja como texto vacío", async () => {
    useModels.mockReturnValue({ data: { glb: GLB } });
    await render(<ARButton productId={7} productName="Laptop" />);

    await fireEvent.press(screen.getByLabelText("Ver en Realidad Aumentada"));

    expect(push).toHaveBeenCalledWith({ pathname: "/viewer3d", params: { name: "Laptop", glb: GLB, usdz: "" } });
  });

  it("sin nombre de producto el nombre viaja vacío", async () => {
    useModels.mockReturnValue({ data: { usdz: USDZ } });
    await render(<ARButton productId={7} />);

    await fireEvent.press(screen.getByLabelText("Ver en Realidad Aumentada"));

    expect(push).toHaveBeenCalledWith({ pathname: "/viewer3d", params: { name: "", glb: "", usdz: USDZ } });
  });
});
