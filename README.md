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

**Fuera del alcance de esta versión:** panel administrativo, gestión de servicios técnicos y asistente de voz Alexa (permanecen en la plataforma web).

## Tecnologías

- React Native con Expo (TypeScript)
- Backend reutilizado de SYSCOM (Express + PostgreSQL)
- Git y GitHub (repositorio, GitHub Projects y Pull Requests)
- Pipeline previsto: GitHub Actions (CI) y EAS Build (builds y distribución beta)

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

Las variables de entorno van en un archivo `.env` local, que no se versiona.

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

Los reportes de pruebas de cada sprint están en [`docs/pruebas/`](docs/pruebas/) (`sprint-1.md`, `sprint-2.md`, `sprint-3.md`), junto con la plantilla, la evidencia y los datos de prueba.

## Documentación generada (DeepWiki)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/AngeloMtz/syscom-mobile)

Wiki del repositorio: <https://deepwiki.com/AngeloMtz/syscom-mobile>

La wiki se genera automáticamente a partir de la rama por defecto (`main`), así que puede ir atrás de `develop`.
No sustituye la documentación del repositorio (`docs/` y los reportes de pruebas), que es la referencia vigente.

## Licencia

MIT
