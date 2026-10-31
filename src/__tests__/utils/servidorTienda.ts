import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { makeApiError, makeProduct, makeProductImage, makeProductVariant } from "../fixtures";

/**
 * Servidor falso CON ESTADO de la tienda (carrito, direcciones, pagos y pedidos)
 * para las pruebas de integración. Reemplaza únicamente el adapter de Axios: las
 * peticiones pasan por el cliente real, sus interceptores, el repository y el
 * hook. Reproduce las reglas del backend que importan para el flujo de compra
 * (formas tomadas del código del backend; sin contrastar con respuestas vivas):
 *   - el carrito guarda `precio_unitario` y el total lo calcula el servidor;
 *   - POST /payments/checkout valida carrito, dirección y stock;
 *   - el pedido lo crea el "webhook" leyendo el carrito ACTUAL y vaciándolo.
 * Nada sale a la red ni toca Stripe.
 */

export interface ProductoFalso {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  estado?: string;
  /** Precio con promoción vigente. Sin este campo el producto no tiene promoción. */
  precioPromocion?: number;
}

interface LineaCarrito {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  /** Código de cupón aplicado a la línea (lo fija `aplicarCupon`). */
  cupon?: string;
}

interface DireccionFalsa {
  id_direccion: number;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias: string | null;
  created_at: string;
}

interface PedidoFalso {
  id_pedido: number;
  estado: string;
  total: string;
  fecha_pedido: string;
  direccion: DireccionFalsa;
  items: { id_pedido_detalle: number; id_producto: number; cantidad: number; precio_unitario: string; subtotal: string }[];
  pago: { id_pago: number; metodo_pago: string; estado_pago: string; stripe_payment_intent_id: string };
  paymentIntent: string;
}

interface IntentFalso {
  id: string;
  id_direccion: number;
  /** Lo que Stripe cobraría: el total del carrito (con descuentos) al crear el PaymentIntent. */
  monto: number;
  pagado: boolean;
  consultas: number;
}

export interface Fallo {
  status: number;
  message: string;
  errors?: { field: string; message: string }[];
}

type Adapter = jest.Mock<Promise<AxiosResponse>, [InternalAxiosRequestConfig]>;

const ok = (config: InternalAxiosRequestConfig, cuerpo: Record<string, unknown>, status = 200): AxiosResponse =>
  ({ data: { success: true, ...cuerpo }, status, statusText: "OK", headers: {}, config }) as AxiosResponse;

const dinero = (n: number) => n.toFixed(2);

export function crearServidorTienda(adapter: Adapter, productos: ProductoFalso[]) {
  const catalogo = new Map(productos.map((p) => [p.id, { estado: "activo", ...p }]));
  const carrito: LineaCarrito[] = [];
  const direcciones: DireccionFalsa[] = [];
  const intents = new Map<string, IntentFalso>();
  const pedidos: PedidoFalso[] = [];
  const llamadas: string[] = [];
  const fallos = new Map<string, Fallo[]>();
  let siguienteDireccion = 1;
  let siguientePedido = 8;
  let siguienteIntent = 1;
  const estado = { retrasoWebhook: 0 };

  const total = () => carrito.reduce((s, l) => s + l.precio_unitario * l.cantidad, 0);

  const productoDe = (id: number) => {
    const p = catalogo.get(id);
    return {
      id_producto: id,
      nombre: p?.nombre ?? "",
      slug: `producto-${id}`,
      precio_base: dinero(p?.precio ?? 0),
      estado: p?.estado ?? "activo",
      envio_gratis: false,
      marcas: { nombre: "HP", slug: "hp" },
      producto_imagenes: [{ url_imagen: `https://example.com/p${id}.jpg` }],
      variantes_producto: [{ stock: p?.stock ?? 0 }],
    };
  };

  function crearPedido(intent: IntentFalso): PedidoFalso | null {
    // Igual que el webhook: lee el carrito ACTUAL; si está vacío no hay pedido.
    if (carrito.length === 0) return null;
    const direccion = direcciones.find((d) => d.id_direccion === intent.id_direccion);
    if (!direccion) return null;
    const idPedido = siguientePedido++;
    const pedido: PedidoFalso = {
      id_pedido: idPedido,
      estado: "confirmado",
      total: dinero(total()),
      fecha_pedido: "2026-10-12T15:00:00.000Z",
      direccion,
      items: carrito.map((l, i) => ({
        id_pedido_detalle: idPedido * 10 + i,
        id_producto: l.id_producto,
        cantidad: l.cantidad,
        precio_unitario: dinero(l.precio_unitario),
        subtotal: dinero(l.precio_unitario * l.cantidad),
      })),
      pago: { id_pago: idPedido, metodo_pago: "stripe", estado_pago: "completado", stripe_payment_intent_id: intent.id },
      paymentIntent: intent.id,
    };
    for (const l of carrito) {
      const p = catalogo.get(l.id_producto);
      if (p) p.stock -= l.cantidad;
    }
    carrito.length = 0;
    pedidos.unshift(pedido);
    return pedido;
  }

  const detalle = (p: PedidoFalso) => ({
    id_pedido: p.id_pedido,
    id_usuario: 4,
    estado: p.estado,
    total: p.total,
    fecha_pedido: p.fecha_pedido,
    direccion: p.direccion,
    items: p.items.map((i) => ({ ...i, id_variante: null, productos: { ...productoDe(i.id_producto), sku: `SKU-${i.id_producto}`, marcas: { nombre: "HP" } } })),
    pago: { ...p.pago, referencia: p.pago.stripe_payment_intent_id, fecha_pago: p.fecha_pedido },
  });

  adapter.mockImplementation(async (config) => {
    const metodo = (config.method ?? "get").toLowerCase();
    const ruta = config.url ?? "";
    const clave = `${metodo.toUpperCase()} ${ruta}`;
    llamadas.push(clave);
    const cuerpo = typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? {});

    const forzados = fallos.get(`${metodo.toUpperCase()} ${ruta.replace(/\/\d+$/, "/:id")}`) ?? fallos.get(clave);
    if (forzados && forzados.length > 0) {
      const f = forzados.shift() as Fallo;
      throw makeApiError({ status: f.status, message: f.message, errors: f.errors });
    }

    // ── Carrito ──────────────────────────────────────────────────────────────
    if (metodo === "get" && ruta === "/cart") {
      const data = carrito
        .map((l, i) => ({
          id_carrito_detalle: 100 + i,
          cantidad: l.cantidad,
          precio_unitario: dinero(l.precio_unitario),
          created_at: "2026-10-12T14:00:00.000Z",
          id_promocion_aplicada: l.cupon ? 1 : null,
          codigo_promo_aplicado: l.cupon ?? null,
          productos: productoDe(l.id_producto),
        }))
        .reverse();
      return ok(config, {
        data,
        meta: { nextCursor: null, hasMore: false, total: carrito.length, totalPrice: dinero(total()) },
      });
    }

    const item = /^\/cart\/items\/(\d+)$/.exec(ruta);
    if (item) {
      const id = Number(item[1]);
      const linea = carrito.find((l) => l.id_producto === id);
      if (metodo === "post") {
        const p = catalogo.get(id);
        if (!p) throw makeApiError({ status: 404, message: "Producto no encontrado" });
        if (p.estado !== "activo") throw makeApiError({ status: 404, message: "El producto no está disponible" });
        if (linea) linea.cantidad += 1;
        else carrito.push({ id_producto: id, cantidad: 1, precio_unitario: p.precioPromocion ?? p.precio });
        return ok(config, { data: { id_carrito_detalle: 100 } }, 201);
      }
      if (metodo === "patch") {
        if (!linea) throw makeApiError({ status: 404, message: "El producto no está en el carrito" });
        if (cuerpo.cantidad === 0) carrito.splice(carrito.indexOf(linea), 1);
        else linea.cantidad = cuerpo.cantidad;
        return ok(config, { message: "Cantidad actualizada correctamente" });
      }
      if (metodo === "delete") {
        if (!linea) throw makeApiError({ status: 404, message: "El producto no está en el carrito" });
        carrito.splice(carrito.indexOf(linea), 1);
        return ok(config, { message: "Producto eliminado del carrito" });
      }
    }

    // ── Direcciones ──────────────────────────────────────────────────────────
    if (ruta === "/profile/addresses") {
      if (metodo === "get") return ok(config, { data: [...direcciones].reverse() });
      if (metodo === "post") {
        const d: DireccionFalsa = {
          id_direccion: siguienteDireccion++,
          calle: cuerpo.calle,
          colonia: cuerpo.colonia,
          ciudad: cuerpo.ciudad,
          estado: cuerpo.estado,
          codigo_postal: cuerpo.codigo_postal,
          referencias: cuerpo.referencias ?? null,
          created_at: `2026-10-12T14:0${direcciones.length}:00.000Z`,
        };
        direcciones.push(d);
        return ok(config, { message: "Dirección creada correctamente", data: { ...d, id_usuario: 4, activa: true } }, 201);
      }
    }

    // ── Pagos ────────────────────────────────────────────────────────────────
    if (metodo === "post" && ruta === "/payments/checkout") {
      if (carrito.length === 0) {
        throw makeApiError({ status: 400, message: "Tu carrito está vacío. Agrega productos antes de continuar." });
      }
      if (!direcciones.some((d) => d.id_direccion === cuerpo.id_direccion)) {
        throw makeApiError({
          status: 400,
          message: "Dirección de envío no encontrada o no pertenece a tu cuenta.",
        });
      }
      for (const l of carrito) {
        const p = catalogo.get(l.id_producto);
        if (!p || p.estado !== "activo") {
          throw makeApiError({ status: 400, message: `El producto "${p?.nombre}" ya no está disponible.` });
        }
        if (p.stock < l.cantidad) {
          throw makeApiError({
            status: 400,
            message: `Stock insuficiente para "${p.nombre}". Disponible: ${p.stock}.`,
          });
        }
      }
      const id = `pi_${siguienteIntent++}`;
      intents.set(id, { id, id_direccion: cuerpo.id_direccion, monto: total(), pagado: false, consultas: 0 });
      return ok(config, { data: { clientSecret: `${id}_secret_abc`, paymentIntentId: id } });
    }

    const estadoPago = /^\/payments\/order-status\/(.+)$/.exec(ruta);
    if (metodo === "get" && estadoPago) {
      const intent = intents.get(decodeURIComponent(estadoPago[1]));
      let pedido = pedidos.find((p) => p.paymentIntent === intent?.id);
      if (intent && !pedido && intent.pagado) {
        intent.consultas += 1;
        if (intent.consultas > estado.retrasoWebhook) pedido = crearPedido(intent) ?? undefined;
      }
      return ok(config, { data: pedido ? { id_pedido: pedido.id_pedido, estado: pedido.estado } : null });
    }

    // ── Pedidos ──────────────────────────────────────────────────────────────
    if (metodo === "get" && ruta === "/orders") {
      const page = Number(config.params?.page ?? 1);
      const limit = Number(config.params?.limit ?? 10);
      const data = pedidos.slice((page - 1) * limit, page * limit).map((p) => ({
        id_pedido: p.id_pedido,
        estado: p.estado,
        total: p.total,
        fecha_pedido: p.fecha_pedido,
        total_items: p.items.length,
        primer_producto: catalogo.get(p.items[0].id_producto)?.nombre ?? "",
        imagen_preview: `https://example.com/p${p.items[0].id_producto}.jpg`,
      }));
      return ok(config, {
        data,
        meta: { total: pedidos.length, page, limit, totalPages: Math.ceil(pedidos.length / limit) },
      });
    }
    const unPedido = /^\/orders\/(\d+)$/.exec(ruta);
    if (metodo === "get" && unPedido) {
      const p = pedidos.find((x) => x.id_pedido === Number(unPedido[1]));
      if (!p) throw makeApiError({ status: 404, message: "Pedido no encontrado." });
      return ok(config, { data: detalle(p) });
    }

    // ── Catálogo paginado (solo page y limit; no filtra por búsqueda ni categoría) ──
    if (metodo === "get" && ruta === "/catalog/products") {
      const page = Number(config.params?.page ?? 1);
      const limit = Number(config.params?.limit ?? 20);
      const activos = [...catalogo.values()].filter((p) => p.estado === "activo");
      const data = activos.slice((page - 1) * limit, page * limit).map((p) => {
        const enPromocion = p.precioPromocion !== undefined && p.precioPromocion < p.precio;
        const final = enPromocion ? (p.precioPromocion as number) : p.precio;
        return makeProduct({
          id: p.id,
          sku: `SKU-${p.id}`,
          nombre: p.nombre,
          slug: `producto-${p.id}`,
          precio_base: p.precio,
          precio_final: final,
          descuento: p.precio - final,
          porcentaje_descuento: enPromocion ? Math.round(((p.precio - final) * 100) / p.precio) : 0,
          en_promocion: enPromocion,
          imagenes: [makeProductImage({ url: `https://example.com/p${p.id}.jpg` })],
          variantes: [makeProductVariant({ stock: p.stock })],
        });
      });
      return ok(config, {
        data,
        pagination: { page, limit, total: activos.length, pages: Math.ceil(activos.length / limit) },
      });
    }

    throw new Error(`Ruta no simulada: ${clave}`);
  });

  return {
    estado,
    carrito,
    direcciones,
    pedidos,
    intents,
    llamadas,
    catalogo,
    /** Cuántas veces se llamó a una ruta, por ejemplo "POST /payments/checkout". */
    veces: (clave: string) => llamadas.filter((l) => l === clave).length,
    /** La próxima petición a esa ruta falla con ese error (una vez). Usar ":id" para ids. */
    fallarProxima: (clave: string, fallo: Fallo) => {
      fallos.set(clave, [...(fallos.get(clave) ?? []), fallo]);
    },
    /** Stripe cobró el PaymentIntent: el "webhook" crea el pedido tras `retrasoWebhook` consultas. */
    confirmarPago: (paymentIntentId: string) => {
      const intent = intents.get(paymentIntentId);
      if (intent) intent.pagado = true;
    },
    /** Producto de la tienda (para ajustar stock en una prueba). */
    producto: (id: number) => catalogo.get(id),
    /**
     * Activa (precio) o desactiva (null) la promoción de un producto. Como el backend, el
     * carrito se vuelve a resolver al consultarlo: las líneas sin cupón toman el precio nuevo.
     */
    fijarPromocion: (id: number, precio: number | null) => {
      const p = catalogo.get(id);
      if (!p) return;
      p.precioPromocion = precio ?? undefined;
      for (const l of carrito) {
        if (l.id_producto === id && !l.cupon) l.precio_unitario = p.precioPromocion ?? p.precio;
      }
    },
    /** Aplica un cupón a la línea: el precio unitario es el del cupón y la línea lo declara. */
    aplicarCupon: (id: number, codigo: string, precioUnitario: number) => {
      const l = carrito.find((x) => x.id_producto === id);
      if (l) {
        l.cupon = codigo;
        l.precio_unitario = precioUnitario;
      }
    },
    /** El administrador marca el pedido como entregado. */
    marcarEntregado: (idPedido: number) => {
      const pedido = pedidos.find((x) => x.id_pedido === idPedido);
      if (pedido) pedido.estado = "entregado";
    },
  };
}

export type ServidorTienda = ReturnType<typeof crearServidorTienda>;
