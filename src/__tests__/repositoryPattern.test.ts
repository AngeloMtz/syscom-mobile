// Patrón Repository: contrato (interface), implementación con el cliente inyectado por
// constructor e implementaciones intercambiables. Ninguna petición sale a la red.
import type { AxiosInstance } from "axios";

import { HttpAuthRepository, authRepository } from "@/features/auth/repositories/authRepository";
import { HttpCartRepository, cartRepository } from "@/features/cart/repositories/cartRepository";
import { HttpProductRepository, productRepository } from "@/features/catalog/repositories/productRepository";
import { HttpOrderRepository, orderRepository } from "@/features/orders/repositories/orderRepository";
import { HttpPaymentRepository, paymentRepository } from "@/features/payments/repositories/paymentRepository";
import {
  HttpProfileRepository,
  profileRepository,
  type ProfileRepository,
} from "@/features/profile/repositories/profileRepository";
import type { Profile, UpdateProfileDTO } from "@/features/profile/types";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const perfil = { nombre: "Ana" } as unknown as Profile;

/** Otra fuente de datos con el mismo contrato: quien consume el repositorio no nota la diferencia. */
class InMemoryProfileRepository implements ProfileRepository {
  constructor(private actual: Profile) {}

  get = async () => this.actual;

  update = async (payload: UpdateProfileDTO) => {
    this.actual = { ...this.actual, ...payload };
    return this.actual;
  };

  deleteAccount = async () => undefined;
}

describe("patrón Repository", () => {
  it.each([
    ["auth", authRepository, HttpAuthRepository],
    ["productos", productRepository, HttpProductRepository],
    ["carrito", cartRepository, HttpCartRepository],
    ["pedidos", orderRepository, HttpOrderRepository],
    ["pagos", paymentRepository, HttpPaymentRepository],
    ["perfil", profileRepository, HttpProfileRepository],
  ])("%s: la instancia exportada es la implementación sobre la API REST", (_nombre, instancia, clase) => {
    expect(instancia).toBeInstanceOf(clase);
  });

  it("usa el cliente HTTP que recibe por el constructor", async () => {
    const get = jest.fn().mockResolvedValue({ data: { data: perfil } });
    const repositorio = new HttpProfileRepository({ get } as unknown as AxiosInstance);

    await expect(repositorio.get()).resolves.toBe(perfil);

    expect(get).toHaveBeenCalledWith("/profile");
  });

  it("sus métodos funcionan sueltos, como los usan los hooks (queryFn: repositorio.get)", async () => {
    const get = jest.fn().mockResolvedValue({ data: { data: perfil } });
    const { get: obtener } = new HttpProfileRepository({ get } as unknown as AxiosInstance);

    await expect(obtener()).resolves.toBe(perfil);
  });

  it("otra implementación del mismo contrato se puede usar en su lugar", async () => {
    const repositorio: ProfileRepository = new InMemoryProfileRepository(perfil);

    await repositorio.update({ nombre: "Luisa" } as UpdateProfileDTO);

    await expect(repositorio.get()).resolves.toMatchObject({ nombre: "Luisa" });
  });
});
