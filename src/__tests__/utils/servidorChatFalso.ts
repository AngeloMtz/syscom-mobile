import { act } from "@testing-library/react-native";

/**
 * Socket.io falso del chat en vivo para las pruebas de integración. Hace de socket del cliente:
 * guarda los manejadores que registra liveChatGateway y registra lo que el cliente emite. El "servidor"
 * es la prueba: con `envia` manda un evento al cliente y, con `alRecibir`, reacciona a lo que el cliente
 * emite (por ejemplo, responder a `chat:init`). Nada abre una conexión real.
 */
export class SocketFalso {
  url = "";
  opciones: Record<string, unknown> = {};
  emitidos: { evento: string; datos?: any }[] = [];
  desconectado = false;
  /** Reacción del servidor a lo que emite el cliente. */
  alRecibir?: (evento: string, datos: any, socket: SocketFalso) => void;

  private eventos = new Map<string, (payload?: any) => void>();
  private gestor = new Map<string, () => void>();

  /** Equivale a `socket.io` (el Manager): solo se usa para `reconnect_failed`. */
  io = {
    on: (evento: string, fn: () => void) => {
      this.gestor.set(evento, fn);
    },
  };

  on(evento: string, fn: (payload?: any) => void) {
    this.eventos.set(evento, fn);
    return this;
  }

  emit = (evento: string, datos?: any) => {
    this.emitidos.push({ evento, datos });
    this.alRecibir?.(evento, datos, this);
  };

  disconnect = () => {
    this.desconectado = true;
  };

  /** El servidor manda un evento al cliente. */
  async envia(evento: string, datos?: any) {
    await act(async () => {
      this.eventos.get(evento)?.(datos);
    });
  }

  /** El gestor de reconexión de Socket.io avisa de un evento (por ejemplo `reconnect_failed`). */
  async gestorEmite(evento: string) {
    await act(async () => {
      this.gestor.get(evento)?.();
    });
  }

  /** Datos de todos los emits de un evento, en orden. */
  emitidosDe(evento: string) {
    return this.emitidos.filter((e) => e.evento === evento).map((e) => e.datos);
  }
}
