// Tiempo límite por carpeta de pruebas (issue #129). La primera prueba que renderiza una
// pantalla paga la transformación en frío de los módulos de React Native, y con el
// paralelismo por defecto esa espera se multiplica. Las demás pruebas conservan los 5 s de Jest.
export const LIMITE_INTEGRACION_MS = 60_000;
export const LIMITE_COMPONENTES_MS = 30_000;

export function tiempoLimiteDe(testPath: string): number | undefined {
  const ruta = testPath.replace(/\\/g, "/");
  if (ruta.includes("/__tests__/integration/")) return LIMITE_INTEGRACION_MS;
  if (ruta.includes("/__tests__/components/")) return LIMITE_COMPONENTES_MS;
  return undefined;
}
