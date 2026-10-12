import { fireEvent, render, screen } from "@testing-library/react-native";

import AddressForm from "@/features/addresses/components/AddressForm";

import { makeAddressInput } from "../fixtures";

// @expo/vector-icons arrastra expo-font y expo-asset, que no cargan en Jest: los íconos no se prueban.
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

type Props = React.ComponentProps<typeof AddressForm>;

const props = (over: Partial<Props> = {}): Props => ({
  submitLabel: "Guardar dirección",
  submitting: false,
  onSubmit: jest.fn(),
  ...over,
});

async function escribir(etiqueta: string, texto: string) {
  await fireEvent.changeText(screen.getByLabelText(etiqueta), texto);
}

describe("AddressForm: validación local", () => {
  it("con todo vacío muestra un error por campo obligatorio y no envía", async () => {
    const onSubmit = jest.fn();
    await render(<AddressForm {...props({ onSubmit })} />);

    await fireEvent.press(screen.getByLabelText("Guardar dirección"));

    expect(screen.getByText("La calle debe tener al menos 5 caracteres")).toBeTruthy();
    expect(screen.getByText("La colonia debe tener al menos 3 caracteres")).toBeTruthy();
    expect(screen.getByText("La ciudad debe tener al menos 3 caracteres")).toBeTruthy();
    expect(screen.getByText("El estado debe tener al menos 3 caracteres")).toBeTruthy();
    expect(screen.getByText("El código postal debe tener exactamente 5 dígitos")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("código postal de 4 y de 6 dígitos es inválido; de 5 es válido", async () => {
    const onSubmit = jest.fn();
    await render(<AddressForm {...props({ initial: makeAddressInput(), onSubmit })} />);

    await escribir("Código postal", "4300");
    await fireEvent.press(screen.getByLabelText("Guardar dirección"));
    expect(screen.getByText("El código postal debe tener exactamente 5 dígitos")).toBeTruthy();

    await escribir("Código postal", "430000");
    await fireEvent.press(screen.getByLabelText("Guardar dirección"));
    expect(screen.getByText("El código postal debe tener exactamente 5 dígitos")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    await escribir("Código postal", "43000");
    await fireEvent.press(screen.getByLabelText("Guardar dirección"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("marca el contenido no permitido (etiquetas) en el campo", async () => {
    await render(<AddressForm {...props({ initial: makeAddressInput({ calle: "Calle <b>Norte</b> 5" }) })} />);

    await fireEvent.press(screen.getByLabelText("Guardar dirección"));

    expect(screen.getByText("Este campo contiene caracteres no permitidos")).toBeTruthy();
  });

  it("al escribir en un campo con error, ese error desaparece", async () => {
    await render(<AddressForm {...props()} />);
    await fireEvent.press(screen.getByLabelText("Guardar dirección"));
    expect(screen.getByText("La calle debe tener al menos 5 caracteres")).toBeTruthy();

    await escribir("Calle y número", "Av. Juárez 123");

    expect(screen.queryByText("La calle debe tener al menos 5 caracteres")).toBeNull();
    expect(screen.getByText("La colonia debe tener al menos 3 caracteres")).toBeTruthy();
  });
});

describe("AddressForm: envío", () => {
  it("con datos válidos entrega los valores escritos", async () => {
    const onSubmit = jest.fn();
    await render(<AddressForm {...props({ onSubmit })} />);

    await escribir("Calle y número", "Av. Juárez 123");
    await escribir("Colonia", "Centro");
    await escribir("Ciudad", "Huejutla");
    await escribir("Estado", "Hidalgo");
    await escribir("Código postal", "43000");
    await escribir("Referencias", "Junto al parque");
    await fireEvent.press(screen.getByLabelText("Guardar dirección"));

    expect(onSubmit).toHaveBeenCalledWith({
      calle: "Av. Juárez 123",
      colonia: "Centro",
      ciudad: "Huejutla",
      estado: "Hidalgo",
      codigo_postal: "43000",
      referencias: "Junto al parque",
    });
  });

  it("al editar parte de los valores iniciales", async () => {
    const onSubmit = jest.fn();
    await render(
      <AddressForm
        {...props({ initial: makeAddressInput({ referencias: "Junto al parque" }), submitLabel: "Guardar cambios", onSubmit })}
      />,
    );

    expect(screen.getByLabelText("Calle y número").props.value).toBe("Av. Juárez 123");
    expect(screen.getByLabelText("Referencias").props.value).toBe("Junto al parque");
    await fireEvent.press(screen.getByLabelText("Guardar cambios"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("mientras guarda, el botón queda deshabilitado y no envía de nuevo", async () => {
    const onSubmit = jest.fn();
    await render(<AddressForm {...props({ initial: makeAddressInput(), submitting: true, onSubmit })} />);

    const boton = screen.getByLabelText("Guardar dirección");
    expect(boton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(boton);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("AddressForm: errores del servidor", () => {
  it("muestra el error 400 del servidor bajo su campo", async () => {
    await render(
      <AddressForm
        {...props({
          initial: makeAddressInput(),
          serverErrors: { codigo_postal: "El código postal debe tener exactamente 5 dígitos" },
        })}
      />,
    );

    expect(screen.getByText("El código postal debe tener exactamente 5 dígitos")).toBeTruthy();
  });

  it("editar el campo descarta el error del servidor, pero no el de otros campos", async () => {
    await render(
      <AddressForm
        {...props({
          initial: makeAddressInput(),
          serverErrors: { codigo_postal: "CP del servidor", ciudad: "Ciudad del servidor" },
        })}
      />,
    );

    await escribir("Código postal", "43001");

    expect(screen.queryByText("CP del servidor")).toBeNull();
    expect(screen.getByText("Ciudad del servidor")).toBeTruthy();
  });

  it("un error local tiene prioridad sobre el del servidor del mismo campo", async () => {
    await render(
      <AddressForm
        {...props({ initial: makeAddressInput({ calle: "ab" }), serverErrors: { calle: "Calle del servidor" } })}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Guardar dirección"));

    expect(screen.getByText("La calle debe tener al menos 5 caracteres")).toBeTruthy();
    expect(screen.queryByText("Calle del servidor")).toBeNull();
  });
});
