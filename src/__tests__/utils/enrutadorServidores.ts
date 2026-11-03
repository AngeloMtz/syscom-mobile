import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { crearServidorTienda, type ProductoFalso } from "./servidorTienda";

/**
 * Enrutador de servidores falsos: combina varios en un solo adapter de Axios para que una
 * prueba pueda recorrer módulos distintos (sesión, perfil, carrito, pagos…) con la misma
 * instancia real del cliente. Cada servidor es un manejador que devuelve la respuesta o
 * `undefined` si la ruta no es suya; los errores que lanza (por ejemplo un 400) se propagan
 * tal cual. Si ninguno atiende la petición, falla con "Ruta no simulada", como `servidorTienda`.
 *
 * `peticiones` guarda lo que salió por el cliente, incluida la cabecera Authorization, para
 * comprobar que el interceptor Bearer funciona entre módulos. Nada sale a la red.
 */

export type Manejador = (
  config: InternalAxiosRequestConfig,
) => AxiosResponse | undefined | Promise<AxiosResponse | undefined>;

export interface PeticionRegistrada {
  metodo: string;
  ruta: string;
  autorizacion?: string;
  cuerpo: unknown;
}

type Adapter = jest.Mock<Promise<AxiosResponse>, [InternalAxiosRequestConfig]>;

export function instalarEnrutador(adapter: Adapter, manejadores: Manejador[]) {
  const peticiones: PeticionRegistrada[] = [];

  adapter.mockImplementation(async (config) => {
    const metodo = (config.method ?? "get").toLowerCase();
    const ruta = config.url ?? "";
    const autorizacion = config.headers?.Authorization;
    peticiones.push({
      metodo,
      ruta,
      autorizacion: autorizacion === undefined ? undefined : String(autorizacion),
      cuerpo: typeof config.data === "string" ? JSON.parse(config.data) : config.data,
    });

    for (const manejador of manejadores) {
      const respuesta = await manejador(config);
      if (respuesta) return respuesta;
    }
    throw new Error(`Ruta no simulada: ${metodo.toUpperCase()} ${ruta}`);
  });

  return {
    peticiones,
    /** Peticiones a una ruta, por ejemplo `de("GET", "/cart")`. */
    de: (metodo: string, ruta: string) =>
      peticiones.filter((p) => p.metodo === metodo.toLowerCase() && p.ruta === ruta),
  };
}

/**
 * `servidorTienda` registra su propio adapter; aquí se le da uno privado y se expone como
 * manejador. Sus rutas siguen igual: lo que no conoce lo deja pasar (`undefined`) en vez de fallar.
 */
export function crearTiendaEnrutable(productos: ProductoFalso[]) {
  const adapterPrivado: Adapter = jest.fn();
  const servidor = crearServidorTienda(adapterPrivado, productos);

  const manejador: Manejador = async (config) => {
    try {
      return await adapterPrivado(config);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Ruta no simulada")) return undefined;
      throw error;
    }
  };

  return { servidor, manejador };
}
