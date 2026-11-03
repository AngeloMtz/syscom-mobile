import { tiempoLimiteDe } from "./tiempoLimite";

const limite = tiempoLimiteDe(expect.getState().testPath ?? "");
if (limite !== undefined) jest.setTimeout(limite);
