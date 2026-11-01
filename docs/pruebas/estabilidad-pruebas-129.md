# Estabilidad de las pruebas por tiempo límite (#129)

- **Fecha:** 2026-10-31
- **Rama:** `fix/129-timeout-pruebas` (desde `develop` en `bb3c777`, con el PR #178 ya fusionado)
- **Origen:** el hallazgo del PR #178: con el paralelismo por defecto, 11, 8 y 7 pruebas superaron los 5000 ms en tres corridas seguidas ([regresion-final.md](regresion-final.md), sección 2.4). #129 describía el mismo patrón en `AddressForm` y `OrderCard`.
- **Máquina:** Windows 11, 16 procesadores lógicos, Node 22.13.0. Sin cambios de código de producción.

## 1. Qué se midió (antes del cambio)

Todas las corridas son `npx jest --ci --coverage` con `--json` sobre el mismo commit. «Frío» significa `--no-cache` (sin caché de transformación de Jest). Salidas en [evidencia/estabilidad-129/antes/](evidencia/estabilidad-129/antes/).

| Corrida | Pruebas que fallan | Tiempo total |
|---|---|---|
| Caché caliente, paralelismo por defecto (16 workers) | 0 | 16.5 s |
| Caché caliente, `--maxWorkers=2` | 0 | 27.7 s |
| **Caché fría, paralelismo por defecto** | **7 (6 suites)** | 46.2 s |
| Caché fría, `--maxWorkers=2` | 0 | 45.2 s |

Duración de la **primera prueba** de cada suite de integración, en ms (la lista completa está en `duraciones-*.txt`):

| Suite | Caliente, 16 workers | Fría, 2 workers | Fría, 16 workers |
|---|---|---|---|
| `chatbotYChatEnVivo` | 1394 | 3529 | **9989 (falla)** |
| `recorridoCompleto` | 1501 | 630 | 8903 (pasa: tiene su propio límite de 30 s) |
| `autenticacion` | 1162 | 363 | **8309 (falla)** |
| `ofertasYDescuentoCarrito` | 961 | 133 | **7314 (falla)** |
| `arranqueDeLaApp` | 793 | 220 | 4924 (pasa, a 76 ms del límite) |

Las otras pruebas que fallaron en la corrida fría con 16 workers duraron entre 6.5 y 8.7 s: `notificacionesPush` (13.ª prueba, 8708 ms), `perfilYMiCuenta` (2.ª, 7007 ms; la siguiente falló por aserción a los 1092 ms), `resenas` (2.ª, 6578 ms).

Medición de la misma suite, aislada (un solo worker, caché fría): `chatbotYChatEnVivo` 3400 ms y `autenticacion` 2894 ms en la primera prueba. En un archivo mínimo, con caché fría y un worker, el primer `render` de React Native Testing Library tardó 990–1225 ms, y 218 ms con caché caliente.

Datos de #178 (primera corrida en un clon recién hecho, 147.7 s en total, 16 workers): las pruebas fallidas duraron hasta **30.3 s** en integración y **19.0 s** en componentes (`ReviewWriteComponents`; `NotificationComponents` 18.1 s; `OrderComponents` 7.3 s).

## 2. Qué demuestran los números y qué no

**Demuestran:**
- Con la misma caché fría, la misma prueba tarda 3.4 s con un worker, 3.5 s con 2 workers, 10.0 s con 16 workers y 30.3 s en el peor caso observado. El aumento viene de ejecutar muchos workers a la vez en esta máquina.
- Con caché caliente, la misma prueba tarda 1.4 s con 16 workers. La caché de transformación explica la mayor parte de la diferencia.
- Son pruebas que **esperan** (`findBy…`, `waitFor`) algo que depende de que se cargue y se transforme una pantalla, así que el cronómetro de 5 s corre mientras tanto.
- No hay una prueba individual que sea lenta por sí misma: con 2 workers la más lenta de integración dura 3.5 s.

**No demuestran:**
- Cuál módulo exacto se transforma durante la prueba. El experimento del primer `render` apunta a la carga diferida de componentes de React Native, pero no lo aislé por módulo.
- Que la causa sea el número de workers por sí solo: la carpeta de integración sola con 2 workers falló 2 pruebas en una corrida de #178 (sin cobertura), y la batería completa con 2 workers pasó dos veces.
- Cómo se comporta el CI (ubuntu, menos procesadores); ahí las pruebas pasaban.

## 3. El cambio

1. `src/__tests__/utils/tiempoLimite.ts`: función `tiempoLimiteDe(ruta)` y dos constantes.
2. `src/__tests__/utils/setupTiempoLimite.ts`: archivo de setup que llama a `jest.setTimeout` según la carpeta de la prueba.
3. `package.json`: `"setupFilesAfterEnv"` apunta a ese setup (único cambio de configuración).
4. `src/__tests__/tiempoLimite.test.ts`: 4 pruebas unitarias de la función.

| Carpeta | Límite | Datos que lo respaldan |
|---|---|---|
| `src/__tests__/integration/` | **60 s** | Peor caso observado 30.3 s (#178) y 27.2 s con la CPU saturada artificialmente; el valor es el doble del peor caso |
| `src/__tests__/components/` | **30 s** | Peor caso observado 19.0 s (#178); 7.9 s en las corridas de esta pasada; el valor es 1.6 veces el peor caso |
| El resto (hooks, selectores, repositorios, utilidades) | 5 s, sin cambio | Ninguna falló; la más lenta fue `apiClient.test.ts` con 2.6–3.3 s en frío y 8.4 s bajo carga |

No se subió el límite global. Se comprobó con archivos temporales (borrados) que una espera de 6 s pasa en `integration/` y `components/` y falla con «Exceeded timeout of 5000 ms» en el resto.

**Contrapartida:** una prueba colgada en esas dos carpetas tarda hasta 60 o 30 s en fallar, en vez de 5 s. `recorridoCompleto.test.tsx` conserva su propio `jest.setTimeout(30000)`; no lo toqué.

**Alternativa que no apliqué:** precalentar los módulos de React Native en el setup. Movería el costo fuera del cronómetro, pero no lo reduciría, y cada archivo paga la carga igual.

## 4. Verificación después del cambio

Salidas en [evidencia/estabilidad-129/despues/](evidencia/estabilidad-129/despues/). Todas con `--ci --coverage --no-cache` (frío, el escenario que fallaba). La suite pasó de 132 a 133 suites y de 1665 a 1669 pruebas (el archivo y las 4 pruebas nuevas).

| Corrida | Suites | Pruebas | Fallan | Tiempo | Máx. integración | Máx. componentes |
|---|---|---|---|---|---|---|
| Por defecto 1 | 133/133 | 1669/1669 | **0** | 41.1 s | 9300 ms | 5902 ms |
| Por defecto 2 | 133/133 | 1669/1669 | **0** | 42.3 s | 10185 ms | 6982 ms |
| Por defecto 3 | 133/133 | 1669/1669 | **0** | 45.4 s | 10394 ms | 6966 ms |
| `--maxWorkers=2` 1 | 133/133 | 1669/1669 | **0** | 44.6 s | 3568 ms | 91 ms |
| `--maxWorkers=2` 2 | 133/133 | 1669/1669 | **0** | 40.1 s | 3424 ms | 94 ms |
| Extra: por defecto con 16 procesos ocupando la CPU | 133/133 | 1669/1669 | **0** | 138.6 s | 27185 ms | 7907 ms |

- **Cobertura** idéntica en todas: 99.11 % sentencias / 97.46 % ramas / 98.56 % funciones / 99.36 % líneas.
- **Lint** (`npx expo lint`): exit 0, sin errores ni advertencias. **tsc** (`npx tsc --noEmit`): exit 0. Archivos `lint.txt` y `tsc.txt`.
- Sin el cambio, las pruebas de componentes de 5.9 a 7.0 s de las corridas 1 a 3 habrían superado el límite de 5 s si hubieran estado esperando un temporizador.

## 5. Lo que no queda resuelto

- **Son 6 corridas completas con 0 fallos.** Es una muestra pequeña de una falla que era intermitente; no demuestra que no vuelva a ocurrir. El criterio de #129 pide 5 corridas seguidas en una máquina cargada y aquí hay **una** bajo carga artificial (procesos que ocupan la CPU).
- **Pruebas fuera de las dos carpetas siguen en 5 s y también se vuelven lentas bajo carga.** Con la CPU saturada, `apiClient.test.ts` registró una prueba de 8.4 s que pasó (la prueba terminó antes de que el temporizador de Jest pudiera dispararse). Pasar con 8.4 s sobre un límite de 5 s es suerte, no margen. No lo cambié porque no hay una falla que lo justifique, pero es el siguiente candidato.
- **El CI es la comprobación final.** No lo he visto correr con este cambio.
- #129 propone además un script local con menos workers (opción B) y medir una máquina cargada cinco veces; no se hizo.
