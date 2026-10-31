import { fireEvent, render, screen } from "@testing-library/react-native";

import PersonalDataScreen from "@/app/profile/personal-data";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";

import { makeProfile } from "../fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
// La sesión no es lo que se prueba aquí: RequireAuth deja pasar a los hijos.
jest.mock("@/features/auth/components/RequireAuth", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/features/profile/hooks/useProfile", () => ({ useProfile: jest.fn() }));
jest.mock("@/features/profile/hooks/useUpdateProfile", () => ({ useUpdateProfile: jest.fn() }));

const mutateAsync = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  mutateAsync.mockResolvedValue(makeProfile());
  (useProfile as jest.Mock).mockReturnValue({
    data: makeProfile({ nombre: "Ana" }),
    isPending: false,
    isError: false,
  });
  (useUpdateProfile as jest.Mock).mockReturnValue({ mutateAsync, reset: jest.fn(), error: null, isPending: false });
});

describe("Datos personales: nombre", () => {
  it("indica el rango de 3 a 40 caracteres, el mismo que el registro", async () => {
    await render(<PersonalDataScreen />);

    expect(screen.getByText("Entre 3 y 40 caracteres")).toBeTruthy();
    expect(screen.queryByText("Entre 4 y 25 caracteres")).toBeNull();
  });

  it("deja escribir hasta 40 caracteres", async () => {
    await render(<PersonalDataScreen />);

    expect(screen.getByDisplayValue("Ana").props.maxLength).toBe(40);
  });

  it("un nombre de 3 letras como «Ana» ya no se bloquea: se envía al guardar", async () => {
    await render(<PersonalDataScreen />);
    await fireEvent.changeText(screen.getByDisplayValue("7711234567"), "7717654321");

    await fireEvent.press(screen.getByText("Guardar cambios"));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Ana", telefono: "7717654321" }),
    );
  });

  it("un nombre de 2 letras sí se rechaza en pantalla y no se envía", async () => {
    await render(<PersonalDataScreen />);
    await fireEvent.changeText(screen.getByDisplayValue("Ana"), "An");

    await fireEvent.press(screen.getByText("Guardar cambios"));

    expect(await screen.findByText("El nombre debe tener al menos 3 caracteres")).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
