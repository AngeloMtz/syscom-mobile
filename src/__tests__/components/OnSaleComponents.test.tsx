import { fireEvent, render, screen } from "@testing-library/react-native";

import OnSaleList from "@/features/catalog/components/OnSaleList";
import OnSaleSection from "@/features/catalog/components/OnSaleSection";

import { makeProduct } from "../fixtures";
import { usarQueryWrapper } from "../utils/queryWrapper";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// ProductCard consulta los favoritos (corazón), así que necesita un QueryClient.
const { wrapper } = usarQueryWrapper();

const oferta = (id: number, nombre: string) =>
  makeProduct({
    id,
    nombre,
    precio_base: 1000,
    precio_final: 900,
    descuento: 100,
    porcentaje_descuento: 10,
    en_promocion: true,
  });

describe("OnSaleSection (inicio)", () => {
  it("muestra el título, 'Ver todas' y las tarjetas de las ofertas", async () => {
    await render(
      <OnSaleSection
        products={[oferta(1, "Laptop A"), oferta(2, "Laptop B")]}
        onSeeAll={jest.fn()}
        onOpenProduct={jest.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByText("Ofertas")).toBeTruthy();
    expect(screen.getByText("Ver todas")).toBeTruthy();
    expect(screen.getByText("Laptop A")).toBeTruthy();
    expect(screen.getByText("Laptop B")).toBeTruthy();
  });

  it("no pinta nada si no hay promociones", async () => {
    await render(<OnSaleSection products={[]} onSeeAll={jest.fn()} onOpenProduct={jest.fn()} />, { wrapper });

    expect(screen.queryByText("Ofertas")).toBeNull();
    expect(screen.queryByText("Ver todas")).toBeNull();
  });

  it("al tocar 'Ver todas' llama a onSeeAll", async () => {
    const onSeeAll = jest.fn();
    await render(<OnSaleSection products={[oferta(1, "Laptop A")]} onSeeAll={onSeeAll} onOpenProduct={jest.fn()} />, { wrapper });

    await fireEvent.press(screen.getByText("Ver todas"));

    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("al tocar una tarjeta llama a onOpenProduct con ese producto", async () => {
    const onOpenProduct = jest.fn();
    const laptop = oferta(1, "Laptop A");
    await render(<OnSaleSection products={[laptop]} onSeeAll={jest.fn()} onOpenProduct={onOpenProduct} />, { wrapper });

    await fireEvent.press(screen.getByText("Laptop A"));

    expect(onOpenProduct).toHaveBeenCalledWith(laptop);
  });
});

type ListProps = React.ComponentProps<typeof OnSaleList>;

const baseLista = (over: Partial<ListProps> = {}): ListProps => ({
  products: [],
  isLoading: false,
  isError: false,
  isRefetching: false,
  onRetry: jest.fn(),
  onRefresh: jest.fn(),
  onOpenProduct: jest.fn(),
  ...over,
});

describe("OnSaleList (Ver todas)", () => {
  it("con datos muestra una tarjeta por oferta y el conteo", async () => {
    await render(<OnSaleList {...baseLista({ products: [oferta(1, "Laptop A"), oferta(2, "Laptop B")] })} />, { wrapper });

    expect(screen.getByText("Laptop A")).toBeTruthy();
    expect(screen.getByText("Laptop B")).toBeTruthy();
    expect(screen.getByText("2 ofertas")).toBeTruthy();
  });

  it("usa el singular con una sola oferta", async () => {
    await render(<OnSaleList {...baseLista({ products: [oferta(1, "Laptop A")] })} />, { wrapper });

    expect(screen.getByText("1 oferta")).toBeTruthy();
  });

  it("con lista vacía muestra 'No hay promociones por ahora'", async () => {
    await render(<OnSaleList {...baseLista()} />, { wrapper });

    expect(screen.getByText("No hay promociones por ahora")).toBeTruthy();
  });

  it("mientras carga no muestra ni la lista ni el mensaje de vacío", async () => {
    await render(<OnSaleList {...baseLista({ isLoading: true })} />, { wrapper });

    expect(screen.queryByText("No hay promociones por ahora")).toBeNull();
    expect(screen.queryByText("Reintentar")).toBeNull();
  });

  it("ante un error muestra el mensaje y 'Reintentar' llama a onRetry", async () => {
    const onRetry = jest.fn();
    await render(<OnSaleList {...baseLista({ isError: true, errorText: "Sin conexión", onRetry })} />, { wrapper });

    expect(screen.getByText("Sin conexión")).toBeTruthy();
    await fireEvent.press(screen.getByText("Reintentar"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("No hay promociones por ahora")).toBeNull();
  });

  it("al tocar una tarjeta llama a onOpenProduct con ese producto", async () => {
    const onOpenProduct = jest.fn();
    const laptop = oferta(1, "Laptop A");
    await render(<OnSaleList {...baseLista({ products: [laptop], onOpenProduct })} />, { wrapper });

    await fireEvent.press(screen.getByText("Laptop A"));

    expect(onOpenProduct).toHaveBeenCalledWith(laptop);
  });
});
