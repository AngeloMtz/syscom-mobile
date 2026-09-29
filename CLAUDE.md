# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Proyecto

App móvil de SYSCOM (React Native + Expo, TypeScript). Es un NUEVO cliente del
backend existente de SYSCOM web: consume su API REST, la misma que ya usa el
cliente web. No duplica lógica de negocio ni validaciones — todo eso vive en el
servidor, y cualquier corrección se refleja en ambos clientes sin publicar una
nueva versión de la app.

### Backend que consume (referencia, no se toca desde aquí)

- API REST: Express + TypeScript (hospedado en Render) · Auth JWT
- Datos: Prisma ORM sobre PostgreSQL (Neon) · 7 esquemas · 66 tablas
- Servicios externos vía backend (sus credenciales **nunca** van en la app):
  Stripe (pagos), Cloudinary (imágenes), Brevo (correo),
  OpenAI GPT-4o-mini (chatbot), Expo Push Service (FCM/APNs).
- La base URL se lee de `EXPO_PUBLIC_API_URL`.

## Tarea principal: portar, no reescribir

Existe un avance funcional de la app en otro proyecto:

```
C:\Users\OWNER\OneDrive\Documentos\UNIVERSIDAD\8 CUATRIMESTRE\PROYECTO SYSCOM\syscom-mobile
```

El trabajo es **portarlo a este repo reestructurándolo** según la arquitectura de
abajo, reutilizando la lógica que ya sirve pero reacomodándola en las capas
correctas. No es copiar y pegar: el fuente está organizado por tipo de archivo y
el destino se organiza por feature, y tres piezas cambian de tecnología.

| Proyecto fuente | Destino |
|---|---|
| `src/services/*.service.ts` | `repositories/` dentro de cada feature |
| `useAsync` casero, sin caché | **TanStack Query** |
| `AuthContext` (Context API) | **Zustand** |
| `@react-native-async-storage/async-storage` | **expo-secure-store** (JWT) |
| `src/lib/api.ts` | `src/shared/api/client.ts` (se reutiliza casi tal cual) |
| `src/types/*`, `src/theme/*`, componentes de presentación | se reutilizan |

El fuente cubre **auth, catalog, chatbot y parte de profile**. **`cart`, `orders`
y `notifications` son desarrollo nuevo**, no port.

Dos piezas del fuente que la arquitectura original no contempla:
`socket.io-client` + `useLiveChat` (chat en vivo) y el visor 3D
(`ModelViewer3D`, WebView, con variante `.web.tsx`). Ubicarlas en `chatbot/` y
`catalog/` respectivamente.

## Stack móvil

- React Native + Expo, TypeScript
- Expo Router (navegación basada en archivos)
- TanStack Query (estado del servidor: caché, reintentos, carga/error)
- Zustand (estado global del cliente: sesión, carrito)
- Axios (cliente HTTP Singleton con interceptor JWT)
- expo-secure-store (almacenamiento seguro del JWT)
- Expo Notifications (push: FCM en Android, APNs en iOS)

## Arquitectura — 3 capas

1. **PRESENTACIÓN** → Pantallas (Expo Router, `src/app/`), componentes de cada
   feature (`features/*/components`) y UI compartida (`shared/ui`).
2. **ESTADO Y LÓGICA** → Custom Hooks + TanStack Query (estado del servidor) +
   Zustand (estado global del cliente).
3. **DATOS** → Repositories + Cliente API (Singleton Axios + interceptor JWT) +
   almacenamiento local seguro (expo-secure-store · JWT).

Debajo, la API REST de SYSCOM (HTTPS / JSON).

Cadena directa, sin atajos:
**Pantalla → Custom Hook → Repository → Cliente API (Singleton) → API REST**

### Reglas duras (no negociables)

- Pantallas y hooks **nunca** contienen URLs ni llamadas HTTP directas. Todo
  acceso a la API pasa por un repository por entidad.
- Fetching + caché + estados de carga/error → custom hooks con TanStack Query.
  Las pantallas solo consumen el hook.
- **Una sola** instancia de Axios en `src/shared/api/client.ts` (Singleton):
  base URL, timeout e interceptor que inyecta `Bearer <JWT>` en cada request.
- El JWT se guarda **solo** en expo-secure-store, nunca en texto plano.
- Estado global del cliente (sesión, carrito) → Zustand.
- Navegación con Expo Router (React Navigation por debajo): stack + tabs vía
  convenciones de archivos, no `NavigationContainer` manual.

## Estructura de carpetas (por feature)

```
src/
  app/                  # rutas (Expo Router)
  features/
    auth/ catalog/ cart/ orders/ notifications/ chatbot/ profile/
      components/ hooks/ repositories/ types.ts
  shared/
    api/client.ts       # cliente API (Singleton)
    store/              # Zustand
    ui/                 # componentes reutilizables
```

Cada feature es autocontenida → un issue se completa sin tocar otros módulos
(coherente con la regla 1 rama por issue).

> **Rutas en `src/app/`, no en `app/`.** El documento de arquitectura original
> decía `app/`, pero `AGENTS.md` y el proyecto fuente usan `src/app/`. Decidido
> a favor de `src/app/`.

## Patrones de diseño

Patrón estructural: arquitectura en capas organizada por **features**.

**1. Repository** — abstrae el acceso a la API REST detrás de una interfaz por
entidad. Si un endpoint cambia, solo se toca el repository.

```ts
export const productRepository = {
  getAll: (params?: ProductFilters) =>
    api.get<Product[]>('/products', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get<Product>(`/products/${id}`).then(r => r.data),
};
```

**2. Custom Hooks** — encapsulan fetching, caché y estados de carga/error,
separando lógica de presentación.

```ts
export const useProducts = (filters?: ProductFilters) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => productRepository.getAll(filters),
  });
```

**3. Singleton** — el cliente HTTP es una única instancia de Axios compartida por
toda la app. Al ser un módulo de TypeScript se evalúa una sola vez.

```ts
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
```

## Flujo de Git — GitFlow simplificado (sin ramas release)

- Integración: `develop`. **Nunca trabajar sobre `main`.**
- `main`: código estable; cada merge = versión etiquetada.
- **1 issue = 1 rama = 1 Pull Request.** Rama `feature/<#issue>-<descripcion>`
  (ej. `feature/2-navegacion`), creada desde `develop` y eliminada tras el merge.
- Hotfix: `hotfix/<#issue>-<descripcion>` desde `main` → `main` y `develop`.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
  (ej. `feat(cart): agregar control de cantidad por producto`).
- PR **siempre** con base en `develop`. Merge con `--no-ff` (conserva historial).
- `main` y `develop` protegidas: PR con ≥1 aprobación del otro desarrollador.
  Queda en "In review" hasta aprobarse. **No** usar "Bypass rules and merge" en
  historias de código.

```bash
git fetch origin
git switch develop
git switch -c feature/<#issue>-<descripcion>
```

## Versionamiento (SemVer)

- Al cierre de cada Sprint Review: merge `develop` → `main` + tag.
  Sprints 1–4 → v0.1.0 … v0.4.0.
- Hotfix incrementa PATCH (ej. v0.4.1).
- Cierre Sprint 5 (15 nov) → v1.0.0-rc.1 (preliminar).
- v1.0.0 final → 24 nov, tras pruebas de regresión (16–20 nov) y EAS Build
  Android (20–24 nov).

## Metodología

Scrumban: cadencia Scrum (Planning, Review, Retrospectiva en sprints de 2
semanas) + flujo Kanban con límite WIP.

- Tablero: Backlog → Ready → In progress → In review → Done.
- Límite WIP: máximo 2 issues por desarrollador en "In progress".
- **Definition of Done**: PR aprobado, sin errores de lint ni de TypeScript,
  probado en Android (development build si usa funciones nativas) y en iOS vía
  Expo Go cuando la función lo permita.

## Equipo y roles

- Product Owner: Ing. Juan Castillo Bautista (cliente) — define y prioriza.
- Stakeholders: docentes — evalúan avances en revisiones.
- Desarrollo: **@LAHH18** (Luis Ángel) y **@AngeloMtz** (Angel Uriel) —
  desarrollo, pruebas y revisión cruzada de código.
  - @LAHH18 → issues #1–#5, #16–#18, #20
  - @AngeloMtz → issues #6–#15, #19

## Estado actual del repositorio

El repo es todavía la plantilla `blank-typescript` de Expo: `App.tsx` en la raíz
registrado por `index.ts` vía `registerRootComponent`. **Nada de la arquitectura
de arriba existe aún** — no hay `src/`, ni Expo Router, ni TanStack Query, ni
Zustand, ni Axios instalados. Todo eso es el trabajo por hacer.

- **Expo SDK 57** (`expo ~57.0.25`, React Native 0.86.3, React 19.2.3,
  TypeScript ~6.0.3 `strict`). Docs versionados:
  `https://docs.expo.dev/versions/v57.0.0/`.
- **Gestor de paquetes: npm** (`package-lock.json`, sin `bun.lock`) → `npx`, no
  `bunx`.
- Al instalar Expo Router hay que cambiar el entry point (adiós `index.ts` +
  `App.tsx`): https://docs.expo.dev/router/installation.md
- **No hay `ios/` ni `android/`** y están en `.gitignore`: Continuous Native
  Generation, lo nativo se configura en `app.json`.
- **No hay `eas.json`** ni suite de pruebas. **ESLint no está instalado**, así que
  `npx expo lint` ofrecerá instalarlo la primera vez; `npx tsc --noEmit` ya
  funciona.

## Comandos

Además de los de `AGENTS.md`:

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```
