import { fireEvent, render, screen } from "@testing-library/react-native";

import AddressCard from "@/features/addresses/components/AddressCard";

import { makeAddress } from "../fixtures";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const handlers = () => ({ onSelect: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn() });

describe("AddressCard", () => {
  it("muestra la dirección completa", async () => {
    await render(<AddressCard address={makeAddress({ referencias: "Junto al parque" })} selected={false} {...handlers()} />);

    expect(screen.getByText("Av. Juárez 123")).toBeTruthy();
    expect(screen.getByText("Centro, Huejutla, Hidalgo")).toBeTruthy();
    expect(screen.getByText("C.P. 43000")).toBeTruthy();
    expect(screen.getByText("Referencias: Junto al parque")).toBeTruthy();
  });

  it("no muestra referencias cuando no hay", async () => {
    await render(<AddressCard address={makeAddress({ referencias: null })} selected={false} {...handlers()} />);

    expect(screen.queryByText(/Referencias:/)).toBeNull();
  });

  it("la elegida se marca 'Para el envío' y se anuncia como elegida", async () => {
    await render(<AddressCard address={makeAddress()} selected {...handlers()} />);

    expect(screen.getByText("Para el envío")).toBeTruthy();
    expect(
      screen.getByLabelText("Av. Juárez 123, Centro, Huejutla, Hidalgo, C.P. 43000, dirección de envío elegida"),
    ).toBeTruthy();
  });

  it("una no elegida no tiene la marca", async () => {
    await render(<AddressCard address={makeAddress()} selected={false} {...handlers()} />);

    expect(screen.queryByText("Para el envío")).toBeNull();
  });

  it("tocar la tarjeta la elige; Editar y Eliminar son acciones aparte", async () => {
    const h = handlers();
    await render(<AddressCard address={makeAddress()} selected={false} {...h} />);

    await fireEvent.press(screen.getByRole("radio"));
    await fireEvent.press(screen.getByLabelText("Editar la dirección Av. Juárez 123"));
    await fireEvent.press(screen.getByLabelText("Eliminar la dirección Av. Juárez 123"));

    expect(h.onSelect).toHaveBeenCalledTimes(1);
    expect(h.onEdit).toHaveBeenCalledTimes(1);
    expect(h.onDelete).toHaveBeenCalledTimes(1);
  });
});
