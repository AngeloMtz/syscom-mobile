# Patrones de diseño de syscom-mobile

Documenta los patrones de diseño que existen hoy en el código (issues #191 y #196): qué son, por qué se usan, cómo se implementan y dónde están. Las líneas corresponden a la rama `develop`.

Se distinguen dos grupos:

- **5 patrones de diseño**: tienen nombre y definición reconocidos y están implementados como tales.
- **9 convenciones y decisiones de arquitectura**: son usos normales de una librería, convenciones de carpetas o decisiones de estructura. Se documentan porque explican cómo está organizada la app, pero **no se presentan como patrones de diseño**.

Cuando el motivo de algo no aparece en el repositorio, se indica **No consta**.

La cadena principal de la app es:

```
Pantalla → Custom Hook → Repository → ApiClient (Singleton) → API REST
```

## Patrones de diseño (5)

| Patrón | Estado | Dónde |
|---|---|---|
| [Singleton](#1-singleton) | Implementado | `shared/api/client.ts` |
| [Repository](#2-repository) | Implementado en 6 de 16 repositorios | `features/*/repositories` |
| [Gateway](#3-gateway) | Implementado | `liveChatGateway.ts` |
| [Reducer](#4-reducer) | Implementado | Pago y chat en vivo |
| [Actualización optimista](#5-actualización-optimista) | Implementado | Hooks de mutación |

## Convenciones y decisiones de arquitectura (9)

| Convención | Qué es en realidad | Dónde |
|---|---|---|
| [Custom Hooks](#c1-custom-hooks) | Técnica estándar de React para reutilizar lógica | `features/*/hooks` |
| [Store global](#c2-store-global) | Uso de Zustand: 5 stores pequeños e independientes | Zustand |
| [Caché de consultas](#c3-caché-de-consultas-del-servidor) | Configuración de TanStack Query | `shared/api/queryClient.ts` |
| [Selectors](#c4-selectors) | Funciones puras en archivos `*Selectors.ts` | `features/*/*elector*.ts` |
| [Enrutamiento por archivos](#c5-enrutamiento-por-archivos) | Característica de Expo Router | `src/app` |
| [Componentes reutilizables](#c6-componentes-reutilizables) | Carpeta de componentes compartidos | `shared/ui` |
| [Interceptor](#c7-interceptores-de-axios) | Interceptores de Axios para el token y la sesión caducada | `shared/api/client.ts` |
| [Guard de rutas](#c8-protección-de-pantallas-con-requireauth) | Componente con un `if` y un `Redirect` | `RequireAuth.tsx` |
| [Observer](#c9-suscripción-por-callbacks-y-por-librerías) | Callbacks y suscripciones de librerías, sin Observer propio | Gateway, Zustand y TanStack Query |

**Factory no se documenta porque no hay uno implementado.** Lo más cercano es `liveChatGateway.open()`, que crea y devuelve una conexión, pero no tiene la estructura de ese patrón.

# Patrones de diseño

## 1. Singleton

**Qué es:** garantiza una sola instancia de una clase, con un único punto de acceso.

**Por qué:** toda la app comparte la misma configuración de red: base URL, timeout e interceptores. Consta en el encabezado de [client.ts](../../src/shared/api/client.ts#L1).

**Cómo:**

| Elemento | Modificador | Línea |
|---|---|---|
| `instance` | `private static` | [client.ts:71](../../src/shared/api/client.ts#L71) |
| `constructor()` | `private` | [client.ts:79](../../src/shared/api/client.ts#L79) |
| `getInstance()` | `public static` | [client.ts:124](../../src/shared/api/client.ts#L124) |
| `setSessionExpiredHandler()` | Método público | [client.ts:130](../../src/shared/api/client.ts#L130) |

```ts
export class ApiClient {
  private static instance: ApiClient | null = null;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient();
    return ApiClient.instance;
  }
}
```

**Límite conocido:** `queryClient` también es instancia única, pero solo porque el módulo se evalúa una vez ([queryClient.ts:5](../../src/shared/api/queryClient.ts#L5)). No tiene constructor privado propio.

**Pruebas:** bloque "patrón Singleton" de [apiClient.test.ts](../../src/__tests__/apiClient.test.ts).

## 2. Repository

**Qué es:** oculta el acceso a los datos detrás de un contrato por entidad.

**Por qué:** es la "única capa que conoce rutas y forma de las respuestas del backend". Consta en [authRepository.ts:2](../../src/features/auth/repositories/authRepository.ts#L2).

**Cómo:** se aplicó la estructura completa (interface, clase e instancia) a los 6 repositorios del flujo principal.

| Repositorio | Interface | Implementación | Instancia |
|---|---|---|---|
| Auth | [L37](../../src/features/auth/repositories/authRepository.ts#L37) | [L74](../../src/features/auth/repositories/authRepository.ts#L74) | [L116](../../src/features/auth/repositories/authRepository.ts#L116) |
| Productos | [L18](../../src/features/catalog/repositories/productRepository.ts#L18) | [L40](../../src/features/catalog/repositories/productRepository.ts#L40) | [L91](../../src/features/catalog/repositories/productRepository.ts#L91) |
| Carrito | [L17](../../src/features/cart/repositories/cartRepository.ts#L17) | [L34](../../src/features/cart/repositories/cartRepository.ts#L34) | [L93](../../src/features/cart/repositories/cartRepository.ts#L93) |
| Pedidos | [L16](../../src/features/orders/repositories/orderRepository.ts#L16) | [L27](../../src/features/orders/repositories/orderRepository.ts#L27) | [L68](../../src/features/orders/repositories/orderRepository.ts#L68) |
| Pagos | [L11](../../src/features/payments/repositories/paymentRepository.ts#L11) | [L22](../../src/features/payments/repositories/paymentRepository.ts#L22) | [L43](../../src/features/payments/repositories/paymentRepository.ts#L43) |
| Perfil | [L9](../../src/features/profile/repositories/profileRepository.ts#L9) | [L19](../../src/features/profile/repositories/profileRepository.ts#L19) | [L31](../../src/features/profile/repositories/profileRepository.ts#L31) |

```ts
export interface ProfileRepository {
  get(): Promise<Profile>;
  update(payload: UpdateProfileDTO): Promise<Profile>;
}

export class HttpProfileRepository implements ProfileRepository {
  constructor(private readonly http: AxiosInstance) {}

  get = (): Promise<Profile> => this.http.get("/profile").then((r) => r.data.data);
}

export const profileRepository: ProfileRepository = new HttpProfileRepository(ApiClient.getInstance().http);
```

Los métodos son funciones flecha porque los hooks los pasan sueltos, como en `queryFn: profileRepository.get`. Con métodos normales se perdería `this`.

**Límites conocidos:**
- **Aplica en 6 de 16 repositorios.** Los otros 10 siguen como objeto literal, por ejemplo [addressRepository.ts:28](../../src/features/addresses/repositories/addressRepository.ts#L28). Cumplen la misma función, pero no tienen interface ni constructor.
- Los hooks usan la instancia exportada; no reciben el repositorio como parámetro.
- La implementación en memoria solo existe en las pruebas.

**Pruebas:** [repositoryPattern.test.ts](../../src/__tests__/repositoryPattern.test.ts).

## 3. Gateway

**Qué es:** un objeto que envuelve un sistema externo y expone una API propia.

**Por qué:** "Es al socket lo que un repository a la API REST: única capa que conoce la URL y los nombres de los eventos". Consta en [liveChatGateway.ts:2](../../src/features/chatbot/liveChat/liveChatGateway.ts#L2).

**Cómo:** `liveChatGateway.open()` crea la conexión de Socket.io y devuelve operaciones propias, como `sendMessage` y `close`. Hooks y pantallas no importan `socket.io-client`: solo este archivo lo hace.

**Dónde:** [liveChatGateway.ts:49](../../src/features/chatbot/liveChat/liveChatGateway.ts#L49).

## 4. Reducer

**Qué es:** una función pura `(estado, acción) => nuevoEstado`.

**Por qué:** en el pago, garantiza que "un pago pagado, pendiente o en curso NUNCA vuelve a crear un PaymentIntent". Consta en [paymentReducer.ts:3](../../src/features/payments/paymentReducer.ts#L3). En el chat, traduce los eventos del socket a acciones ([liveChatReducer.ts:2](../../src/features/chatbot/liveChat/liveChatReducer.ts#L2)).

**Cómo:** cada reducer es una función pura con transiciones protegidas (por ejemplo, `START` solo avanza desde `idle`, `failed` o `canceled`), y se usa con `useReducer` de React.

**Dónde:** [paymentReducer.ts:57](../../src/features/payments/paymentReducer.ts#L57), usado en [usePayment.ts:44](../../src/features/payments/hooks/usePayment.ts#L44). [liveChatReducer.ts:51](../../src/features/chatbot/liveChat/liveChatReducer.ts#L51), usado en [useLiveChat.ts:21](../../src/features/chatbot/hooks/useLiveChat.ts#L21).

## 5. Actualización optimista

**Qué es:** la pantalla cambia antes de que responda el servidor, y se revierte si falla.

**Por qué:** la dirección "sale de la lista al instante, vuelve si la API falla". Consta en [useDeleteAddress.ts:11](../../src/features/addresses/hooks/useDeleteAddress.ts#L11).

**Cómo:** se hace a mano en cada hook de mutación con las opciones `onMutate` y `onError` de TanStack Query. En `onMutate` se guarda el estado previo de la caché y se aplica el cambio; en `onError` se restaura lo guardado ([useDeleteAddress.ts:25-30](../../src/features/addresses/hooks/useDeleteAddress.ts#L25)). La librería aporta el mecanismo de ganchos; la lógica de guardar y revertir es del proyecto.

**Dónde:** [useDeleteAddress.ts:23](../../src/features/addresses/hooks/useDeleteAddress.ts#L23), [useUpdateCartItem.ts:22](../../src/features/cart/hooks/useUpdateCartItem.ts#L22), [useRemoveCartItem.ts:19](../../src/features/cart/hooks/useRemoveCartItem.ts#L19), [useToggleFavorite.ts:21](../../src/features/favorites/hooks/useToggleFavorite.ts#L21) y [useNotificationPreferences.ts:31](../../src/features/notifications/hooks/useNotificationPreferences.ts#L31).

# Convenciones y decisiones de arquitectura

Lo siguiente describe cómo está organizada la app, pero **no son patrones de diseño**: cada apartado indica por qué.

## C1. Custom Hooks

**Qué es:** funciones `useX` que reutilizan lógica con estado y separan esa lógica de la presentación.

**Por qué no es un patrón:** es la técnica estándar de React para reutilizar lógica, no un patrón con nombre propio.

**Por qué se usa:** las pantallas se limitan a presentar. Consta, por ejemplo, en [favorites.tsx:2](../../src/app/favorites.tsx#L2): "Solo presentación: la consulta viene de useFavorites".

**Cómo:** cada hook usa otros hooks y devuelve estado. Las pantallas y los componentes no llaman a `useQuery`, `useMutation` ni a un repositorio directamente.

```ts
export const useProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["profile"],
    queryFn: profileRepository.get,
    enabled: isAuthenticated,
  });
};
```

**Dónde:** `src/features/*/hooks`. Ejemplos: [useProfile.ts:8](../../src/features/profile/hooks/useProfile.ts#L8) y su consumo en [personal-data.tsx:32](../../src/app/profile/personal-data.tsx#L32).

## C2. Store global

**Qué es:** un estado de cliente compartido por varias pantallas.

**Por qué no es un patrón:** es el uso normal de Zustand, con 5 stores pequeños e independientes.

**Por qué se usa:** separa el estado del cliente de las llamadas HTTP. Consta en [authStore.ts:2](../../src/shared/store/authStore.ts#L2). El bloqueo del carrito durante un pago consta en [paymentStore.ts:2](../../src/features/payments/paymentStore.ts#L2).

**Dónde (Zustand):**
- Sesión: [authStore.ts:23](../../src/shared/store/authStore.ts#L23)
- Onboarding: [onboardingStore.ts:17](../../src/shared/store/onboardingStore.ts#L17)
- Dirección elegida: [checkoutStore.ts:13](../../src/features/addresses/checkoutStore.ts#L13)
- Pago en curso: [paymentStore.ts:15](../../src/features/payments/paymentStore.ts#L15)
- Chatbot: [chatStore.ts:25](../../src/features/chatbot/chatStore.ts#L25)

El carrito no está en Zustand: vive en el servidor y se consulta con TanStack Query.

## C3. Caché de consultas del servidor

**Qué es:** una caché compartida de las respuestas del servidor, con reintentos y estados de carga y error.

**Por qué no es un patrón:** es la configuración de TanStack Query, no una implementación propia.

**Por qué se usa:** los comentarios de [queryClient.ts:8](../../src/shared/api/queryClient.ts#L8) explican los valores: en móvil la red falla de formas transitorias y el catálogo no cambia cada segundo.

**Cómo:** 2 reintentos en consultas, 5 minutos de vigencia y ningún reintento automático en mutaciones.

**Dónde:** [queryClient.ts:5](../../src/shared/api/queryClient.ts#L5).

## C4. Selectors

**Qué es:** funciones puras que derivan datos para mostrarlos.

**Por qué no es un patrón:** son funciones puras en archivos con nombre `*Selectors.ts`, sin memoización (ninguno usa `createSelector` ni `useMemo`). Es una convención de nombres y de organización.

**Por qué se usa:** "Funciones puras: no tocan la red ni React". Consta en [cartSelectors.ts:2](../../src/features/cart/cartSelectors.ts#L2).

**Dónde:** por ejemplo, [cartSelectors.ts](../../src/features/cart/cartSelectors.ts), [favoriteSelectors.ts](../../src/features/favorites/favoriteSelectors.ts) y [catalog/selectors.ts](../../src/features/catalog/selectors.ts).

## C5. Enrutamiento por archivos

**Qué es:** las rutas se definen por la estructura de carpetas (Expo Router).

**Por qué no es un patrón:** es una característica de Expo Router, no un patrón implementado por el proyecto.

**Por qué se usa:** **No consta.** `AGENTS.md` solo indica usar Expo Router para toda la navegación.

**Dónde:** carpeta `src/app`, con stack en [_layout.tsx:55](../../src/app/_layout.tsx#L55) y pestañas en [(tabs)/_layout.tsx:14](<../../src/app/(tabs)/_layout.tsx#L14>).

## C6. Componentes reutilizables

**Qué es:** componentes de interfaz compartidos entre pantallas, en una carpeta común.

**Por qué no es un patrón:** es una decisión de estructura de carpetas. Algunos componentes tienen un solo uso (`BannerCarousel`, `HtmlContent`) y `ScreenPlaceholder` no lo importa nadie.

**Por qué se usa:** en los estados de carga, las pantallas solo pasan los flags del hook. Consta en [ScreenState.tsx:2](../../src/shared/ui/ScreenState.tsx#L2). Para los demás componentes, **No consta**.

**Dónde:** `src/shared/ui`. Por ejemplo, [ScreenState.tsx:22](../../src/shared/ui/ScreenState.tsx#L22).

## C7. Interceptores de Axios

**Qué es:** código que se ejecuta en cada petición o respuesta, sin que quien llama lo sepa.

**Por qué no es un patrón:** registrar interceptores es una función de Axios; lo propio del proyecto es la lógica que van dentro (el JWT y el cierre de sesión).

**Por qué se usa:** la sesión viaja solo como Bearer, y una sesión caducada debe cerrarse una sola vez aunque lleguen varias respuestas. Consta en [client.ts:96](../../src/shared/api/client.ts#L96) y [client.ts:104](../../src/shared/api/client.ts#L104).

**Dónde:**
- Petición: agrega el JWT ([client.ts:98](../../src/shared/api/client.ts#L98)).
- Respuesta: cierra la sesión si caducó ([client.ts:106](../../src/shared/api/client.ts#L106)).

## C8. Protección de pantallas con RequireAuth

**Qué es:** un componente que solo deja ver su contenido si hay sesión.

**Por qué no es un patrón:** es un componente con un `if` y un `Redirect`. El nombre "guard de rutas" viene de otros frameworks.

**Por qué se usa:** el catálogo y el inicio son públicos, así que se aplica pantalla por pantalla. Consta en [RequireAuth.tsx:2](../../src/features/auth/components/RequireAuth.tsx#L2).

**Dónde:** [RequireAuth.tsx:10](../../src/features/auth/components/RequireAuth.tsx#L10).

```tsx
if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
```

## C9. Suscripción por callbacks y por librerías

**Qué es:** formas en que una parte del código avisa a otra cuando algo cambia.

**Por qué no es un patrón:** no hay una clase propia con `subscribe`, `unsubscribe` y `notify`. El comportamiento viene de callbacks y de librerías:

| Dónde | Qué notifica |
|---|---|
| [LiveChatHandlers](../../src/features/chatbot/liveChat/liveChatGateway.ts#L17) | Callbacks por cada evento del chat |
| [useAuthStore](../../src/shared/store/authStore.ts#L23) | Zustand vuelve a pintar a quienes se suscriben con un selector |
| [queryClient](../../src/shared/api/queryClient.ts#L5) | TanStack Query notifica a los hooks suscritos a una consulta |

**Inyección del handler de sesión caducada:** el cliente HTTP no importa el store; el store registra su `logout` con [setSessionExpiredHandler](../../src/shared/store/authStore.ts#L55) y el cliente lo llama cuando la sesión caduca. Así se evita un ciclo de importaciones. Consta en [client.ts:137](../../src/shared/api/client.ts#L137).

**Por qué se usa:** para la sesión, el motivo es el anterior. Para los demás casos, **No consta**.
