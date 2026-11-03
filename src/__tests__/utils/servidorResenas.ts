import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { makeApiError } from "../fixtures";
import type { CuentaFalsa } from "./servidorAuth";
import type { ServidorTienda } from "./servidorTienda";

/**
 * Servidor falso CON ESTADO de las reseñas de producto para las pruebas de integración. Es un
 * manejador para `enrutadorServidores`: solo reemplaza al adapter de Axios, así que las peticiones
 * pasan por el cliente real y su interceptor Bearer.
 *
 * Las formas de las respuestas salen de `reviewRepository` y de `types.ts` de la app (qué campos
 * lee): can-review `{ canReview, id_pedido?, reason? }`, POST `{ data: { id_resena } }`, /my con
 * `productos`, y /product/:id `{ total, promedio: "4.5", distribucion, reviews }` paginado. Los
 * TEXTOS de `reason` y de los errores, y el código 409 de la reseña duplicada, son de prueba: no se
 * copiaron del backend ni se contrastaron con respuestas reales.
 *
 * Reglas que reproduce: solo se puede reseñar un producto de un pedido ENTREGADO (lo lee de la
 * tienda); una reseña nueva nace "pendiente" y no aparece en la lista pública hasta que
 * `aprobarResena` la aprueba (la acción de un administrador); solo hay una reseña por cuenta y
 * producto. Las rutas con sesión exigen un Bearer emitido por el servidor de auth; la lista pública
 * no. El pedido es de la tienda (que solo modela una cuenta); las reseñas sí son por cuenta.
 * Nada sale a la red.
 */

export interface Fallo {
  status: number;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface ResenaFalsa {
  id_resena: number;
  id_usuario: number;
  id_producto: number;
  id_pedido: number;
  calificacion: number;
  titulo: string | null;
  comentario: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  created_at: string;
}

export interface OpcionesServidorResenas {
  tienda: ServidorTienda;
  /** La cuenta del Bearer de la petición (`servidorAuth.cuentaDe`); undefined si no hay sesión vigente. */
  cuentaDe: (config: InternalAxiosRequestConfig) => CuentaFalsa | undefined;
}

// La respuesta viaja serializada, como por HTTP: la app nunca comparte objetos con el servidor.
const ok = (config: InternalAxiosRequestConfig, cuerpo: Record<string, unknown>, status = 200): AxiosResponse =>
  ({
    data: JSON.parse(JSON.stringify({ success: true, ...cuerpo })),
    status,
    statusText: "OK",
    headers: {},
    config,
  }) as AxiosResponse;

const parsear = (config: InternalAxiosRequestConfig) =>
  typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? {});

export function crearServidorResenas({ tienda, cuentaDe }: OpcionesServidorResenas) {
  const resenas: ResenaFalsa[] = [];
  const cuentasPorId = new Map<number, CuentaFalsa>();
  const llamadas: string[] = [];
  const fallos = new Map<string, Fallo[]>();
  let siguienteResena = 1;

  const exigirCuenta = (config: InternalAxiosRequestConfig): CuentaFalsa => {
    const cuenta = cuentaDe(config);
    if (!cuenta) throw makeApiError({ status: 401, message: "Token inválido o expirado." });
    cuentasPorId.set(cuenta.user.id_usuario, cuenta);
    return cuenta;
  };

  const pedidoEntregadoCon = (idProducto: number) =>
    tienda.pedidos.find((p) => p.estado === "entregado" && p.items.some((i) => i.id_producto === idProducto));

  const productoDe = (id: number) => {
    const p = tienda.catalogo.get(id);
    return {
      nombre: p?.nombre ?? "",
      slug: `producto-${id}`,
      producto_imagenes: [{ url_imagen: `https://example.com/p${id}.jpg` }],
    };
  };

  function manejar(config: InternalAxiosRequestConfig): AxiosResponse | undefined {
    const metodo = (config.method ?? "get").toLowerCase();
    const ruta = config.url ?? "";
    if (!ruta.startsWith("/reviews")) return undefined;

    const clave = `${metodo.toUpperCase()} ${ruta}`;
    llamadas.push(clave);
    const cuerpo = parsear(config);

    const forzados = fallos.get(`${metodo.toUpperCase()} ${ruta.replace(/\/\d+$/, "/:id")}`) ?? fallos.get(clave);
    if (forzados && forzados.length > 0) {
      const f = forzados.shift() as Fallo;
      throw makeApiError({ status: f.status, message: f.message, errors: f.errors });
    }

    const puede = /^\/reviews\/can-review\/(\d+)$/.exec(ruta);
    if (metodo === "get" && puede) {
      const cuenta = exigirCuenta(config);
      const idProducto = Number(puede[1]);
      if (!tienda.catalogo.has(idProducto)) throw makeApiError({ status: 404, message: "Producto no encontrado." });
      if (resenas.some((r) => r.id_usuario === cuenta.user.id_usuario && r.id_producto === idProducto)) {
        return ok(config, { data: { canReview: false, reason: "Ya dejaste una reseña para este producto." } });
      }
      const pedido = pedidoEntregadoCon(idProducto);
      if (!pedido) {
        return ok(config, {
          data: { canReview: false, reason: "Solo puedes reseñar productos de un pedido entregado." },
        });
      }
      return ok(config, { data: { canReview: true, id_pedido: pedido.id_pedido } });
    }

    if (clave === "POST /reviews") {
      const cuenta = exigirCuenta(config);
      const comentario = String(cuerpo.comentario ?? "").trim();
      if (cuerpo.tipo !== "producto" || comentario.length < 10) {
        throw makeApiError({ status: 400, message: "Los datos de la reseña no son válidos." });
      }
      const pedido = tienda.pedidos.find((p) => p.id_pedido === cuerpo.id_pedido);
      if (!pedido || pedido.estado !== "entregado" || !pedido.items.some((i) => i.id_producto === cuerpo.id_producto)) {
        throw makeApiError({ status: 400, message: "Solo puedes reseñar productos de un pedido entregado." });
      }
      if (resenas.some((r) => r.id_usuario === cuenta.user.id_usuario && r.id_producto === cuerpo.id_producto)) {
        throw makeApiError({ status: 409, message: "Ya dejaste una reseña para este producto." });
      }
      const id = siguienteResena++;
      resenas.push({
        id_resena: id,
        id_usuario: cuenta.user.id_usuario,
        id_producto: cuerpo.id_producto,
        id_pedido: cuerpo.id_pedido,
        calificacion: cuerpo.calificacion,
        titulo: cuerpo.titulo ?? null,
        comentario,
        estado: "pendiente",
        created_at: `2026-10-20T10:${String(id).padStart(2, "0")}:00.000Z`,
      });
      return ok(config, { message: "Reseña enviada. Se publicará cuando sea aprobada.", data: { id_resena: id } }, 201);
    }

    if (clave === "GET /reviews/my") {
      const cuenta = exigirCuenta(config);
      const mias = resenas
        .filter((r) => r.id_usuario === cuenta.user.id_usuario)
        .sort((a, b) => b.id_resena - a.id_resena)
        .map((r) => ({
          id_resena: r.id_resena,
          tipo: "producto",
          calificacion: r.calificacion,
          titulo: r.titulo,
          comentario: r.comentario,
          estado: r.estado,
          created_at: r.created_at,
          productos: productoDe(r.id_producto),
        }));
      return ok(config, { data: mias });
    }

    const publicas = /^\/reviews\/product\/(\d+)$/.exec(ruta);
    if (metodo === "get" && publicas) {
      const idProducto = Number(publicas[1]);
      const aprobadas = resenas
        .filter((r) => r.id_producto === idProducto && r.estado === "aprobada")
        .sort((a, b) => b.id_resena - a.id_resena);
      const page = Number(config.params?.page ?? 1);
      const limit = Number(config.params?.limit ?? 5);
      const distribucion = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } as Record<string, number>;
      for (const r of aprobadas) distribucion[String(r.calificacion)] += 1;
      const suma = aprobadas.reduce((s, r) => s + r.calificacion, 0);
      return ok(config, {
        data: {
          total: aprobadas.length,
          // Como el backend, el promedio viaja como texto.
          promedio: (aprobadas.length ? suma / aprobadas.length : 0).toFixed(1),
          distribucion,
          reviews: aprobadas.slice((page - 1) * limit, page * limit).map((r) => {
            const autor = cuentasPorId.get(r.id_usuario)?.user;
            return {
              id_resena: r.id_resena,
              calificacion: r.calificacion,
              titulo: r.titulo,
              comentario: r.comentario,
              estado: r.estado,
              created_at: r.created_at,
              usuarios: autor
                ? { nombre: autor.nombre, apellido_paterno: autor.apellido_paterno, foto_perfil: null }
                : null,
            };
          }),
        },
      });
    }

    return undefined;
  }

  return {
    manejar,
    resenas,
    llamadas,
    /** Cuántas veces se llamó a una ruta, por ejemplo "POST /reviews". */
    veces: (clave: string) => llamadas.filter((l) => l === clave).length,
    /** La próxima petición a esa ruta (por ejemplo "POST /reviews") falla con ese error, una vez. */
    fallarProxima: (clave: string, fallo: Fallo) => {
      fallos.set(clave, [...(fallos.get(clave) ?? []), fallo]);
    },
    /** Un administrador aprueba la reseña: desde ahora sale en la lista pública del producto. */
    aprobarResena: (idResena: number) => {
      const r = resenas.find((x) => x.id_resena === idResena);
      if (r) r.estado = "aprobada";
    },
    /** Un administrador rechaza la reseña: nunca sale en la lista pública. */
    rechazarResena: (idResena: number) => {
      const r = resenas.find((x) => x.id_resena === idResena);
      if (r) r.estado = "rechazada";
    },
  };
}

export type ServidorResenas = ReturnType<typeof crearServidorResenas>;
