# Patrones de diseño de syscom-mobile

Documenta los patrones que existen hoy en el código (issue #191): qué son, por qué se usan, cómo se implementan y dónde están. Las líneas corresponden a la rama `feature/191-patrones-diseno`.

Cuando el motivo de un patrón no aparece en el repositorio, se indica **No consta**.

La cadena principal de la app es:

```
Pantalla → Custom Hook → Repository → ApiClient (Singleton) → API REST
```

| Patrón | Estado | Dónde |
|---|---|---|
| [Singleton](#1-singleton) | Implementado | `shared/api/client.ts` |
| [Repository](#2-repository) | Implementado en 6 de 16 repositorios | `features/*/repositories` |
| [Custom Hooks](#3-custom-hooks) | Implementado | `features/*/hooks` |
| [Gateway](#4-gateway) | Implementado | `liveChatGateway.ts` |
| [Observer](#5-observer) | Parcial | Gateway, Zustand y TanStack Query |
| [Store global](#6-store-global) | Implementado | Zustand |
| [Caché de consultas](#7-caché-de-consultas-del-servidor) | Implementado | TanStack Query |
| [Selectors](#8-selectors) | Implementado | `features/*/*elector*.ts` |
| [Reducer](#9-reducer) | Implementado | Pago y chat en vivo |
| [Interceptor](#10-interceptor) | Implementado | `shared/api/client.ts` |
| [Actualización optimista](#11-actualización-optimista) | Implementado | Hooks de mutación |
| [Guard de rutas](#12-guard-de-rutas) | Implementado | `RequireAuth.tsx` |
| [Enrutamiento por archivos](#13-enrutamiento-por-archivos) | Implementado | `src/app` |
| [Componentes reutilizables](#14-componentes-reutilizables) | Implementado | `shared/ui` |

**Factory no se documenta como patrón porque no hay uno implementado.** Lo más cercano es `liveChatGateway.open()`, que crea y devuelve una conexión, pero no tiene la estructura de ese patrón.

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

**Cómo:** se aplicó la estructura completa a los 6 repositorios del flujo principal.

| Repositorio | Interface | Implementación | Instancia |
|---|---|---|---|
| Auth | [L37](../../src/features/auth/repositories/authRepository.ts#L37) | [L74](../../src/features/auth/repositories/authRepository.ts#L74) | [L116](../../src/features/auth/repositories/authRepository.ts#L116) |
| Productos | [L18](../../src/features/catalog/repositories/productRepository.ts#L18) | [L40](../../src/features/catalog/repositories/productRepository.ts#L40) | [L91](../../src/features/catalog/repositories/productRepository.ts#L91) |
| Carrito | [L17](../../src/features/cart/repositories/cartRepository.ts#L17) | [L34](../../src/features/cart/repositories/cartRepository.ts#L34) | [L93](../../src/features/cart/repositories/cartRepository.ts#L93) |
| Pedidos | [L16](../../src/features/orders/repositories/orderRepository.ts#L16) | [L27](../../src/features/orders/repositories/orderRepository.ts#L27) | [L68](../../src/features/orders/repositories/orderRepository.ts#L68) |
| Pagos | [L11](../../src/features/payments/repositories/paymentRepository.ts#L11) | [L22](../../src/features/payments/repositories/paymentRepository.ts#L22) | [L43](../../src/features/payments/repositories/paymentRepository.ts#L43) |
| Perfil | [L9](../../src/features/profile/repositories/profileRepository.ts#L9) | [L17](../../src/features/profile/repositories/profileRepository.ts#L17) | [L26](../../src/features/profile/repositories/profileRepository.ts#L26) |

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
- Los otros 10 repositorios siguen como objeto literal, por ejemplo [addressRepository.ts:28](../../src/features/addresses/repositories/addressRepository.ts#L28). Cumplen la misma función, pero no tienen interface ni constructor.
- Los hooks usan la instancia exportada; no reciben el repositorio como parámetro.
- La implementación en memoria solo existe en las pruebas.

**Pruebas:** [repositoryPattern.test.ts](../../src/__tests__/repositoryPattern.test.ts).

## 3. Custom Hooks

**Qué es:** funciones `useX` que reutilizan lógica con estado y separan esa lógica de la presentación.

**Por qué:** las pantallas se limitan a presentar. Consta, por ejemplo, en [favorites.tsx:2](../../src/app/favorites.tsx#L2): "Solo presentación: la consulta viene de useFavorites".

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

**Dónde:** `src/features/*/hooks`. Ejemplos: [useProfile.ts:8](../../src/features/profile/hooks/useProfile.ts#L8) y su consumo en [personal-data.tsx:30](../../src/app/profile/personal-data.tsx#L30).

## 4. Gateway

**Qué es:** un objeto que envuelve un sistema externo y expone una API propia.

**Por qué:** "Es al socket lo que un repository a la API REST: única capa que conoce la URL y los nombres de los eventos". Consta en [liveChatGateway.ts:2](../../src/features/chatbot/liveChat/liveChatGateway.ts#L2).

**Cómo:** `liveChatGateway.open()` crea la conexión de Socket.io y devuelve operaciones propias, como `sendMessage` y `close`. Hooks y pantallas no importan `socket.io-client`.

**Dónde:** [liveChatGateway.ts:49](../../src/features/chatbot/liveChat/liveChatGateway.ts#L49).

## 5. Observer

**Estado: parcial.** No hay una clase propia con `subscribe`, `unsubscribe` y `notify`. El comportamiento existe de estas formas:

| Dónde | Qué notifica |
|---|---|
| [LiveChatHandlers](../../src/features/chatbot/liveChat/liveChatGateway.ts#L17) | Callbacks por cada evento del chat |
| [useAuthStore](../../src/shared/store/authStore.ts#L23) | Zustand vuelve a pintar a quienes se suscriben con un selector |
| [queryClient](../../src/shared/api/queryClient.ts#L5) | TanStack Query notifica a los hooks suscritos a una consulta |
| [setSessionExpiredHandler](../../src/shared/store/authStore.ts#L55) | El cliente HTTP avisa al store que la sesión caducó |

**Por qué:** en el caso de la sesión, evita que `client.ts` importe el store y se forme un ciclo. Consta en [client.ts:137](../../src/shared/api/client.ts#L137). Para los demás casos, **No consta**.

## 6. Store global

**Qué es:** un estado de cliente compartido por varias pantallas.

**Por qué:** separa el estado del cliente de las llamadas HTTP. Consta en [authStore.ts:2](../../src/shared/store/authStore.ts#L2). El bloqueo del carrito durante un pago consta en [paymentStore.ts:2](../../src/features/payments/paymentStore.ts#L2).

**Cómo y dónde (Zustand):**
- Sesión: [authStore.ts:23](../../src/shared/store/authStore.ts#L23)
- Onboarding: [onboardingStore.ts:17](../../src/shared/store/onboardingStore.ts#L17)
- Dirección elegida: [checkoutStore.ts:13](../../src/features/addresses/checkoutStore.ts#L13)
- Pago en curso: [paymentStore.ts:15](../../src/features/payments/paymentStore.ts#L15)
- Chatbot: [chatStore.ts:25](../../src/features/chatbot/chatStore.ts#L25)

El carrito no está en Zustand: vive en el servidor y se consulta con TanStack Query.

## 7. Caché de consultas del servidor

**Qué es:** una caché compartida de las respuestas del servidor, con reintentos y estados de carga y error.

**Por qué:** los comentarios de [queryClient.ts:8](../../src/shared/api/queryClient.ts#L8) explican los valores: en móvil la red falla de formas transitorias y el catálogo no cambia cada segundo.

**Cómo:** 2 reintentos en consultas, 5 minutos de vigencia y ningún reintento automático en mutaciones.

**Dónde:** [queryClient.ts:5](../../src/shared/api/queryClient.ts#L5).

## 8. Selectors

**Qué es:** funciones puras que derivan datos para mostrarlos.

**Por qué:** "Funciones puras: no tocan la red ni React". Consta en [cartSelectors.ts:2](../../src/features/cart/cartSelectors.ts#L2).

**Dónde:** por ejemplo, [cartSelectors.ts](../../src/features/cart/cartSelectors.ts), [favoriteSelectors.ts](../../src/features/favorites/favoriteSelectors.ts) y [catalog/selectors.ts](../../src/features/catalog/selectors.ts).

## 9. Reducer

**Qué es:** una función pura `(estado, acción) => nuevoEstado`.

**Por qué:** en el pago, garantiza que "un pago pagado, pendiente o en curso NUNCA vuelve a crear un PaymentIntent". Consta en [paymentReducer.ts:3](../../src/features/payments/paymentReducer.ts#L3). En el chat, traduce los eventos del socket a acciones ([liveChatReducer.ts:2](../../src/features/chatbot/liveChat/liveChatReducer.ts#L2)).

**Dónde:** [paymentReducer.ts:57](../../src/features/payments/paymentReducer.ts#L57), usado en [usePayment.ts:44](../../src/features/payments/hooks/usePayment.ts#L44). [liveChatReducer.ts:51](../../src/features/chatbot/liveChat/liveChatReducer.ts#L51), usado en [useLiveChat.ts:21](../../src/features/chatbot/hooks/useLiveChat.ts#L21).

## 10. Interceptor

**Qué es:** código que se ejecuta en cada petición o respuesta, sin que quien llama lo sepa.

**Por qué:** la sesión viaja solo como Bearer, y una sesión caducada debe cerrarse una sola vez aunque lleguen varias respuestas. Consta en [client.ts:96](../../src/shared/api/client.ts#L96) y [client.ts:104](../../src/shared/api/client.ts#L104).

**Dónde:**
- Petición: agrega el JWT ([client.ts:98](../../src/shared/api/client.ts#L98)).
- Respuesta: cierra la sesión si caducó ([client.ts:106](../../src/shared/api/client.ts#L106)).

## 11. Actualización optimista

**Qué es:** la pantalla cambia antes de que responda el servidor, y se revierte si falla.

**Por qué:** la dirección "sale de la lista al instante, vuelve si la API falla". Consta en [useDeleteAddress.ts:11](../../src/features/addresses/hooks/useDeleteAddress.ts#L11).

**Dónde:** [useDeleteAddress.ts:23](../../src/features/addresses/hooks/useDeleteAddress.ts#L23), [useUpdateCartItem.ts:22](../../src/features/cart/hooks/useUpdateCartItem.ts#L22), [useRemoveCartItem.ts:19](../../src/features/cart/hooks/useRemoveCartItem.ts#L19), [useToggleFavorite.ts:21](../../src/features/favorites/hooks/useToggleFavorite.ts#L21) y [useNotificationPreferences.ts:31](../../src/features/notifications/hooks/useNotificationPreferences.ts#L31).

## 12. Guard de rutas

**Qué es:** un componente que solo deja ver su contenido si se cumple una condición.

**Por qué:** el catálogo y el inicio son públicos, así que el guard se aplica pantalla por pantalla. Consta en [RequireAuth.tsx:2](../../src/features/auth/components/RequireAuth.tsx#L2).

**Dónde:** [RequireAuth.tsx:10](../../src/features/auth/components/RequireAuth.tsx#L10).

```tsx
if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
```

## 13. Enrutamiento por archivos

**Qué es:** las rutas se definen por la estructura de carpetas (Expo Router).

**Por qué:** **No consta.**

**Dónde:** carpeta `src/app`, con stack en [_layout.tsx:55](../../src/app/_layout.tsx#L55) y pestañas en [(tabs)/_layout.tsx:14](<../../src/app/(tabs)/_layout.tsx#L14>).

## 14. Componentes reutilizables

**Qué es:** componentes de interfaz compartidos por varias features.

**Por qué:** en los estados de carga, las pantallas solo pasan los flags del hook. Consta en [ScreenState.tsx:2](../../src/shared/ui/ScreenState.tsx#L2). Para los demás componentes, **No consta**.

**Dónde:** `src/shared/ui`. Por ejemplo, [ScreenState.tsx:22](../../src/shared/ui/ScreenState.tsx#L22).
