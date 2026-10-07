# Datos de prueba

## Dónde viven
Las fixtures están en `src/__tests__/fixtures/` y se importan con `import { makeProduct } from "./fixtures"`.
Jest no las ejecuta como pruebas (`testPathIgnorePatterns` en `package.json`).

| Fábrica | Devuelve |
|---|---|
| `makeUser`, `makeProfile` | Usuario de auth y perfil (`/profile`) |
| `makeCategory` | Categoría raíz de productos |
| `makeProduct`, `makeProductImage`, `makeProductVariant` | Producto de listado, con una imagen y una variante |
| `makeApiError`, `makeNetworkError` | Error de Axios con respuesta del backend / sin conexión |

## Reglas
1. **Cada llamada devuelve un objeto nuevo**, con arreglos nuevos. Ninguna prueba debe poder alterar los datos de otra.
2. **Se personaliza por sobrescritura**: `makeProduct({ precio_base: 500 })`. Los valores por defecto son válidos, así que cada prueba solo declara el dato que importa para su comportamiento.
3. **Nunca llamadas reales a la API.** Los repositories se prueban con el cliente Axios simulado (`jest.mock`) y errores creados con `makeApiError`.
4. Si una nueva entidad necesita datos de prueba, se agrega una fábrica aquí; no se duplican datos dentro de cada test.

## Paralelo o secuencia
- **Por defecto, en paralelo.** Jest corre los archivos de prueba en workers distintos y, como las fixtures devuelven copias nuevas, los archivos no dependen entre sí.
- **Dentro de un mismo archivo**, las pruebas corren en orden y no deben depender del resultado de la anterior.
- **Solo en secuencia (`--runInBand`)** si una prueba comparte un estado real que no se puede aislar (por ejemplo, un archivo, una base de datos o un puerto). Hoy ninguna prueba lo necesita.
- **En CI**, los jobs "Análisis estático" y "Pruebas unitarias" corren en paralelo entre sí; dentro de "Pruebas unitarias", Jest paraleliza los archivos.
