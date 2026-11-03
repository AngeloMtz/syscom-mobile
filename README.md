# syscom-mobile

App móvil de **SYSCOM**, complemento de la plataforma web de comercio electrónico de tecnología. Permite a los clientes consultar el catálogo, comprar productos y dar seguimiento a sus pedidos desde el celular, con funciones adicionales de Realidad Aumentada, notificaciones push y chatbot de soporte.

Proyecto de la materia *Gestión del Proceso de Desarrollo de Software* (UTHH).

## Funcionalidades principales

- Registro, inicio de sesión y perfil de usuario
- Onboarding y navegación principal
- Catálogo: categorías, productos por categoría, buscador, detalle y favoritos
- Carrito de compras y checkout con dirección de envío
- Pago con Stripe (sandbox), confirmación de orden e historial de pedidos
- Vista de producto en Realidad Aumentada
- Notificaciones push
- Chatbot de soporte
- Reseñas y calificaciones de productos
- Servicios: pestaña con el listado de servicios técnicos (búsqueda por nombre, scroll infinito y actualización con pull-to-refresh) y detalle con precio, duración, garantía, qué incluye, cómo se trabaja, videos y galería con zoom. Es de solo consulta: no hay carrito ni reserva de servicios
- Ofertas y descuentos: sección «Ofertas» en Inicio (con «Ver todas» hacia las promociones vigentes) y descuento visible en el carrito (precio original, precio final y porcentaje)
- Mi cuenta: datos personales, direcciones, pedidos, favoritos, reseñas, notificaciones e información institucional
- Notificaciones push (con canal de Android)
- Sesión caducada: cuando el servidor indica que la sesión venció, la app cierra la sesión y vuelve a Login, sin mostrar ningún mensaje

**Fuera del alcance de esta versión:** panel administrativo y asistente de voz Alexa (permanecen en la plataforma web). La app solo consulta los servicios técnicos; su gestión sigue en la web.

## Tecnologías

- React Native 0.88 con Expo SDK 58 (`expo` ~58.0.19) y TypeScript
- Navegación con Expo Router (`expo-router` ~58.0.26)
- Backend reutilizado de SYSCOM (Express + PostgreSQL)
- Git y GitHub (repositorio, GitHub Projects y Pull Requests)
- GitHub Actions (CI en cada Pull Request) y EAS Build (el perfil `preview` genera un APK de distribución interna)

## Equipo

| Integrante | Usuario | Rol | Responsabilidad |
|---|---|---|---|
| Angel | @AngeloMtz | Desarrollador móvil | Catálogo, flujo de compra y reseñas (issues #6–#15 y #19) |
| Luis Ángel Hernández Hernández | @LAHH18 | Desarrollador móvil | Base del proyecto, autenticación, perfil, AR, push, chatbot y pruebas E2E (issues #1–#5, #16–#18 y #20) |
| Docente | @afelipe23 | Supervisión | Revisión y seguimiento del proyecto |
| Luis Alberto Mendoza San Juan | @LMendoza70 | Supervisión | Revisión y seguimiento del proyecto |

## Metodología y planeación

Se trabaja con **Scrumban** en GitHub Projects: 5 sprints de 2 semanas (2.5 meses). El backlog de 20 historias de usuario está distribuido en las 5 iteraciones.

| Sprint | Issues | Producto verificable |
|---|---|---|
| 1 | #1–#5 | App Expo funcionando con navegación, registro/login y perfil |
| 2 | #6–#10 | Catálogo navegable con búsqueda, detalle y favoritos |
| 3 | #11–#15 | Compra completa con pago Stripe sandbox e historial de pedidos |
| 4 | #16–#18 | AR, notificaciones push y chatbot funcionando en un build de prueba |
| 5 | #19–#20 | Reseñas y build final con pruebas end-to-end aprobadas |

Tablero de planeación: https://github.com/users/AngeloMtz/projects/3

## Estrategia de ramas (GitFlow)

| Rama | Propósito |
|---|---|
| `main` | Código estable, listo para publicar |
| `develop` | Integración de las funcionalidades terminadas |
| `feature/*` | Una rama por historia de usuario, por ejemplo `feature/12-checkout-direccion` |
| `release/*` | Preparación de la versión al cerrar un sprint |
| `test/*` | Pruebas y su documentación, por ejemplo `test/46-rendimiento` (convención `test/<n°-issue>-nombre`) |
| `fix/*` | Correcciones, por ejemplo `fix/78-url-api-obligatoria` (convención `fix/<n°-issue>-nombre`) |

## Reglas para integrar código

1. Nadie hace push directo a `main` ni a `develop`; ambas ramas están protegidas.
2. Cada historia se desarrolla en su propia rama `feature/<n°-issue>-nombre`, creada desde `develop`.
3. Los cambios entran mediante Pull Request hacia `develop`, que referencia el issue (`Closes #n`).
4. Cada Pull Request requiere la aprobación del otro desarrollador.
5. Al cerrar un sprint, `develop` pasa a `main` mediante un Pull Request desde `release/*`.
6. La rama se elimina después de fusionarla.

Mensajes de commit con prefijo: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.

## Ejecución local

```bash
git clone https://github.com/AngeloMtz/syscom-mobile.git
cd syscom-mobile
npm install
npx expo start
```

Las variables de entorno van en un archivo `.env` local, que no se versiona. Copia [`.env.example`](.env.example) como punto de partida:

- `EXPO_PUBLIC_API_URL` (**obligatoria**): URL base de la API de SYSCOM. En desarrollo, si falta, la app usa `http://localhost:4000/api` y muestra una advertencia; en una compilación de producción, si falta (o está vacía), la app lanza un error al iniciar (`src/shared/api/client.ts`, issue #78). En un dispositivo físico, `localhost` no apunta a tu PC: usa la IP de tu red local.
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: clave **publicable** de Stripe en modo prueba (`pk_test_...`). Nunca pongas la clave secreta en la app.

`npm run verificar-entorno` comprueba la versión mínima de Node, que exista `package-lock.json` y, fuera de CI, que exista `.env` o `EXPO_PUBLIC_API_URL` (`scripts/verificar-entorno.mjs`).

### Generar el APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

El perfil `preview` (`eas.json`) genera un APK de distribución interna. Las variables de entorno de un build en EAS se definen en EAS, no en el `.env`: el detalle y el despliegue a Google Play están en [`docs/despliegue-google-play.md`](docs/despliegue-google-play.md).

## Estructura del proyecto

```text
src/
├── app/          # Pantallas y navegación (Expo Router): cada archivo es una ruta
│   ├── (auth)/   #   login, registro, verificación y recuperación de contraseña
│   ├── (tabs)/   #   las 5 pestañas: Inicio, Catálogo, Carrito, Servicios, Más
│   └── ...       #   checkout, favorites, orders, addresses, profile, product, service, etc.
├── features/     # Lógica por dominio: addresses, auth, cart, catalog, favorites,
│                 #   institutional, onboarding, orders, payments, profile, services
│                 #   (cada una con repositories/, hooks/, components/ y types.ts según aplique)
├── shared/       # Código común: api (cliente HTTP, token), store, storage, theme,
│                 #   ui (componentes reutilizables), hooks y utils
└── __tests__/    # Pruebas unitarias e integración (Jest); fixtures/ y utils/ son apoyo
docs/
└── pruebas/      # Reportes de pruebas por sprint, plantilla, evidencia y datos de prueba
scripts/          # Scripts de apoyo (por ejemplo, verificar-entorno)
.github/          # Workflows de CI
```

Las rutas de `src/app/` solo contienen pantallas; los componentes, hooks y repositorios viven en `src/features/` y `src/shared/`.

## Pruebas

```bash
npx expo lint                # análisis estático (ESLint)
npx tsc --noEmit             # verificación de tipos
npx jest --ci --coverage     # pruebas unitarias con cobertura
```

El CI (`.github/workflows/ci.yml`) corre en cada Pull Request hacia `develop` y `main` con dos jobs en paralelo:
- **Análisis estático:** `npx expo lint`, `npx tsc --noEmit` y `npm audit` (bloquea con vulnerabilidades críticas).
- **Pruebas unitarias:** `npx jest --ci --coverage` y sube el reporte de cobertura como artefacto.

Herramientas: Jest con `jest-expo` y React Native Testing Library. El umbral de cobertura global es 80 % en líneas, sentencias y funciones, y 70 % en ramas (`coverageThreshold` en `package.json`; ver [umbral-de-cobertura.md](docs/pruebas/umbral-de-cobertura.md)). Si baja, el job «Pruebas unitarias» del CI falla.

Scripts de apoyo (`scripts/`):
- `npm run verificar-entorno`: comprueba el entorno local.
- `scripts/medir-rendimiento.mjs`: mide tiempos de respuesta de la API; solo corre contra el backend **local** (`scripts/lib/perfGuard.js` lo impide contra otros servidores). Su uso está en el encabezado del propio archivo.

Los reportes de pruebas están en [`docs/pruebas/`](docs/pruebas/), junto con la plantilla, la evidencia y los datos de prueba:

- Por sprint: [sprint-1](docs/pruebas/sprint-1.md), [sprint-2](docs/pruebas/sprint-2.md), [sprint-3](docs/pruebas/sprint-3.md), [sprint-4](docs/pruebas/sprint-4.md), [sprint-5](docs/pruebas/sprint-5.md) y [sprint-5-aceptacion](docs/pruebas/sprint-5-aceptacion.md).
- De cierre: [integracion-completa](docs/pruebas/integracion-completa.md), [regresion-final](docs/pruebas/regresion-final.md), [regresion-manual-sprint-5](docs/pruebas/regresion-manual-sprint-5.md) y [rendimiento-final](docs/pruebas/rendimiento-final.md).
- Otros: [plan-de-pruebas](docs/pruebas/plan-de-pruebas.md) y [estabilidad-pruebas-129](docs/pruebas/estabilidad-pruebas-129.md).

## Limitaciones conocidas

- **Realidad Aumentada:** requiere un dispositivo compatible con ARCore. No se pudo verificar en el Samsung A16 usado en las pruebas, que no es compatible: [regresion-final](docs/pruebas/regresion-final.md).
- **Solo Android:** no hay build para iOS: [regresion-final](docs/pruebas/regresion-final.md).
- **Accesibilidad:** TalkBack no se probó: [sprint-5-aceptacion](docs/pruebas/sprint-5-aceptacion.md).
- **Dependencias:** `npx expo-doctor` reporta 12 paquetes con una versión de parche anterior a la que pide el SDK 58: [regresion-final](docs/pruebas/regresion-final.md).
- **Pruebas de integración:** usan un servidor simulado, no el backend real: [integracion-completa](docs/pruebas/integracion-completa.md).
- **Webhook de Stripe:** no se midió su tiempo de respuesta: [rendimiento-final](docs/pruebas/rendimiento-final.md).
- **Regresión manual:** sus resultados «Pasa» son según Angel, sin capturas: [regresion-manual-sprint-5](docs/pruebas/regresion-manual-sprint-5.md) y [regresion-final](docs/pruebas/regresion-final.md).

## Documentación generada (DeepWiki)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/AngeloMtz/syscom-mobile)

Wiki del repositorio: <https://deepwiki.com/AngeloMtz/syscom-mobile>

La wiki se genera automáticamente a partir de la rama por defecto (`main`), así que puede ir atrás de `develop`.
No sustituye la documentación del repositorio (`docs/` y los reportes de pruebas), que es la referencia vigente.

## Licencia

MIT
