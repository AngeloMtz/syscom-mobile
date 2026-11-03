import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import FormField from "@/shared/ui/FormField";

// Solo se simulan los iconos, para distinguirlos en pantalla por su nombre.
jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

describe("FormField: alto de la caja", () => {
  it("de una línea mantiene el alto fijo de 48 px", async () => {
    await render(<FormField label="Título" value="" onChangeText={() => {}} />);

    const estilo = StyleSheet.flatten(screen.getByTestId("form-field-box").props.style);
    expect(estilo.height).toBe(48);
  });

  it("multilínea no fija el alto: la caja crece con el texto y alinea arriba", async () => {
    await render(<FormField label="Comentario" value="Muy buen producto" onChangeText={() => {}} multiline />);

    const estilo = StyleSheet.flatten(screen.getByTestId("form-field-box").props.style);
    expect(estilo.height).toBeUndefined();
    expect(estilo.minHeight).toBe(48);
    expect(estilo.alignItems).toBe("flex-start");
  });
});

describe("FormField: contenido y eventos", () => {
  it("muestra la etiqueta y el valor recibido", async () => {
    await render(<FormField label="Correo" value="ana@example.com" onChangeText={() => {}} />);

    expect(screen.getByText("Correo")).toBeTruthy();
    expect(screen.getByDisplayValue("ana@example.com")).toBeTruthy();
  });

  it("dispara onChangeText con el texto escrito", async () => {
    const onChangeText = jest.fn();
    await render(
      <FormField label="Correo" value="" onChangeText={onChangeText} placeholder="tu@email.com" />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("tu@email.com"), "luis@example.com");

    expect(onChangeText).toHaveBeenCalledWith("luis@example.com");
  });

  it("muestra el mensaje de error con su icono y engrosa el borde", async () => {
    await render(
      <FormField label="Correo" value="" onChangeText={() => {}} error="El correo es requerido" />,
    );

    expect(screen.getByText("El correo es requerido")).toBeTruthy();
    expect(screen.getByText("alert-circle")).toBeTruthy();
    const caja = StyleSheet.flatten(screen.getByTestId("form-field-box").props.style);
    expect(caja.borderWidth).toBe(1.5);
  });

  it("con error oculta la pista; sin error la muestra", async () => {
    await render(
      <FormField label="Teléfono" value="" onChangeText={() => {}} hint="10 dígitos" error="Inválido" />,
    );
    expect(screen.getByText("Inválido")).toBeTruthy();
    expect(screen.queryByText("10 dígitos")).toBeNull();

    await screen.rerender(
      <FormField label="Teléfono" value="" onChangeText={() => {}} hint="10 dígitos" />,
    );
    expect(screen.getByText("10 dígitos")).toBeTruthy();
    expect(screen.queryByText("Inválido")).toBeNull();
  });

  it("un error vacío no pinta mensaje ni icono de alerta", async () => {
    await render(<FormField label="Correo" value="" onChangeText={() => {}} error="" />);

    expect(screen.queryByText("alert-circle")).toBeNull();
  });

  it("muestra el prefijo cuando se indica", async () => {
    await render(<FormField label="Teléfono" value="" onChangeText={() => {}} prefix="+52" />);

    expect(screen.getByText("+52")).toBeTruthy();
  });

  it("con secure oculta el texto y el ojo lo revela y lo vuelve a ocultar", async () => {
    await render(
      <FormField label="Contraseña" value="Secreta1!" onChangeText={() => {}} secure placeholder="clave" />,
    );
    const campo = () => screen.getByPlaceholderText("clave");
    expect(campo().props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByText("eye-outline"));
    expect(campo().props.secureTextEntry).toBe(false);
    expect(screen.getByText("eye-off-outline")).toBeTruthy();

    await fireEvent.press(screen.getByText("eye-off-outline"));
    expect(campo().props.secureTextEntry).toBe(true);
  });

  it("sin secure no muestra el ojo ni oculta el texto", async () => {
    await render(<FormField label="Correo" value="" onChangeText={() => {}} placeholder="correo" />);

    expect(screen.queryByText("eye-outline")).toBeNull();
    expect(screen.getByPlaceholderText("correo").props.secureTextEntry).toBeFalsy();
  });

  it("al enfocar engrosa el borde y al salir del campo lo devuelve a su grosor normal", async () => {
    await render(<FormField label="Correo" value="" onChangeText={() => {}} placeholder="correo" />);
    const grosor = () => StyleSheet.flatten(screen.getByTestId("form-field-box").props.style).borderWidth;
    expect(grosor()).toBe(1);

    await fireEvent(screen.getByPlaceholderText("correo"), "focus");
    expect(grosor()).toBe(1.5);

    await fireEvent(screen.getByPlaceholderText("correo"), "blur");
    expect(grosor()).toBe(1);
  });

  it("editable=false deshabilita el campo", async () => {
    await render(<FormField label="Correo" value="a@b.co" onChangeText={() => {}} editable={false} />);

    expect(screen.getByDisplayValue("a@b.co").props.editable).toBe(false);
  });
});
