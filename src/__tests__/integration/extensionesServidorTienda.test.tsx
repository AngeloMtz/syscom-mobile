// Comprueba las extensiones del servidor falso de la tienda (promociones, cupones, catálogo paginado
// y pedido entregado) y el enrutador de servidores, con los repositories y selectores REALES de la app.
// Las usan las pruebas de ofertas, carrito con descuento y reseñas. Simulado: solo el adapter de Axios.
// Valida el contrato que la app espera del servidor, NO el comportamiento del backend real.
import api from "@/shared/api/client";
import { addressRepository } from "@/features/addresses/repositories/addressRepository";
import { getLineDiscount, toCartLineData } from "@/features/cart/cartSelectors";
import { cartRepository } from "@/features/cart/repositories/cartRepository";
import { productRepository } from "@/features/catalog/repositories/productRepository";
import { orderRepository } from "@/features/orders/repositories/orderRepository";
import { paymentRepository } from "@/features/payments/repositories/paymentRepository";

import { crearAxiosFalso } from "../utils/axiosFake";
import { crearTiendaEnrutable, instalarEnrutador } from "../utils/enrutadorServidores";
import type { ProductoFalso } from "../utils/servidorTienda";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter } = crearAxiosFalso();

const DIRECCION = {
  calle: "Av. Juárez 123",
  colonia: "Centro",
  ciudad: "Huejutla",
  estado: "Hidalgo",
  codigo_postal: "43000",
};

let tienda: ReturnType<typeof crearTiendaEnrutable>["servidor"];
let enrutador: ReturnType<typeof instalarEnrutador>;

function montar(productos: ProductoFalso[]) {
  const t = crearTiendaEnrutable(productos);
  tienda = t.servidor;
  enrutador = instalarEnrutador(adapter as never, [t.manejador]);
}

beforeEach(() => {
  adapter.mockReset();
  montar([
    { id: 7, nombre: "HP ProBook 850 G4 Touch", precio: 7200, stock: 3, precioPromocion: 6480 },
    { id: 9, nombre: "Lenovo ThinkPad X13 Gen 1", precio: 6500, stock: 3 },
  ]);
});

describe("integración: promociones y cupones en el carrito", () => {
  it("con promoción vigente el carrito trae el precio resuelto y la app deriva el -10 %", async () => {
    await cartRepository.add(7);

    const { data, totalPrice } = await cartRepository.getPage();

    expect(data[0].precio_unitario).toBe("6480.00");
    expect(data[0].productos.precio_base).toBe("7200.00");
    expect(data[0].codigo_promo_aplicado).toBeNull();
    expect(totalPrice).toBe("6480.00");
    expect(getLineDiscount(data[0])).toEqual({ originalCents: 720000, percent: 10 });
    expect(toCartLineData(data[0]).descuentoPorcentaje).toBe(10);
  });

  it("un producto sin promoción conserva su precio y no tiene descuento (comportamiento anterior)", async () => {
    await cartRepository.add(9);

    const { data } = await cartRepository.getPage();

    expect(data[0].precio_unitario).toBe("6500.00");
    expect(getLineDiscount(data[0])).toBeNull();
  });

  it("al desactivar la promoción la línea del carrito vuelve al precio base", async () => {
    await cartRepository.add(7);

    tienda.fijarPromocion(7, null);
    const { data, totalPrice } = await cartRepository.getPage();

    expect(data[0].precio_unitario).toBe("7200.00");
    expect(totalPrice).toBe("7200.00");
    expect(getLineDiscount(data[0])).toBeNull();
  });

  it("con cupón la línea declara el código y la app no muestra descuento de promoción", async () => {
    await cartRepository.add(7);

    tienda.aplicarCupon(7, "VERANO10", 6000);
    const { data } = await cartRepository.getPage();

    expect(data[0]).toMatchObject({
      precio_unitario: "6000.00",
      codigo_promo_aplicado: "VERANO10",
      id_promocion_aplicada: 1,
    });
    expect(getLineDiscount(data[0])).toBeNull();
  });
});

describe("integración: catálogo paginado y ofertas", () => {
  it("getOnSale recorre las páginas de 100 y ordena por mayor descuento", async () => {
    const productos: ProductoFalso[] = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      nombre: `Producto ${i + 1}`,
      precio: 1000,
      stock: 5,
    }));
    productos[119].precioPromocion = 900; // id 120: -10 %
    productos[4].precioPromocion = 700; // id 5: -30 %
    productos[139].precioPromocion = 800; // id 140: -20 %
    adapter.mockReset();
    montar(productos);

    const ofertas = await productRepository.getOnSale();

    expect(ofertas.map((p) => [p.id, p.porcentaje_descuento])).toEqual([
      [5, 30],
      [140, 20],
      [120, 10],
    ]);
    const paginas = enrutador.de("GET", "/catalog/products");
    expect(paginas).toHaveLength(2);
  });
});

describe("integración: pedido entregado", () => {
  it("el pedido nace confirmado con el total con descuento y el administrador puede marcarlo entregado", async () => {
    await cartRepository.add(7);
    const direccion = await addressRepository.create(DIRECCION);
    const intent = await paymentRepository.createCheckout(direccion.id_direccion);
    tienda.confirmarPago(intent.paymentIntentId);
    const estado = await paymentRepository.getOrderStatus(intent.paymentIntentId);

    const confirmado = await orderRepository.getById(estado?.id_pedido as number);
    expect(confirmado).toMatchObject({ estado: "confirmado", total: "6480.00" });

    tienda.marcarEntregado(estado?.id_pedido as number);
    const entregado = await orderRepository.getById(estado?.id_pedido as number);
    expect(entregado?.estado).toBe("entregado");
  });
});

describe("integración: enrutador de servidores", () => {
  it("una ruta que ningún servidor conoce falla como «Ruta no simulada»", async () => {
    await expect(api.get("/ruta/inexistente")).rejects.toThrow("Ruta no simulada: GET /ruta/inexistente");
  });

  it("el error de un servidor se propaga tal cual, sin pasar a otro manejador", async () => {
    await expect(cartRepository.setQuantity(99, 2)).rejects.toMatchObject({
      response: { status: 404, data: { message: "El producto no está en el carrito" } },
    });
  });
});
