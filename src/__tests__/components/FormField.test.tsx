import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import FormField from "@/shared/ui/FormField";

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
