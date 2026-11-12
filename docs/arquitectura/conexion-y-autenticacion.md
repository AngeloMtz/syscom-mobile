# Conexión con la API y autenticación con JWT

Cómo se definen los endpoints REST en el backend, cómo los consume la app y cómo se gestiona el token Bearer.

El backend (`syscom-backend`) es un repositorio **privado**: sus enlaces apuntan al commit [`28ae22e`](https://github.com/AngeloMtz/syscom-backend/tree/28ae22e) y requieren acceso.

```
App:      Pantalla → Hook → Repository → ApiClient (Bearer)
                                              │ HTTPS / JSON
Backend:  index.ts → routes.ts → middlewares → controller.ts → service → BD
```

## 1. Backend: creación de las rutas

API **REST** con Express. [`src/index.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/index.ts#L128-L166) monta cada módulo bajo un prefijo:

```ts
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
```

Cada módulo en `src/modules/<módulo>/` tiene la misma estructura. Ejemplo, `auth`:

| Archivo | Qué hace |
|---|---|
| [`routes.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/auth/routes.ts#L48) | Declara método, ruta, validación y controlador: `router.post("/login", validateRequest(loginSchema), login)` |
| [`validation.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/auth/validation.ts#L6-L14) | Reglas de los datos de entrada con Zod; si fallan, responde 400 |
| [`controller.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/auth/controller.ts#L40-L79) | Llama al servicio y responde con el código HTTP y el JSON |
| [`clientAccess.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/auth/clientAccess.ts#L26-L40) | Solo en auth: limita la app a cuentas de cliente |
| [`auth.service.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/services/auth.service.ts#L170) | Lógica y acceso a la base de datos (en otros módulos va dentro de la carpeta, como `cart.service.ts`) |

Las rutas privadas se protegen con `authenticateToken`, en todo el módulo ([cart/routes.ts:16](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/cart/routes.ts#L16)) o en una ruta ([auth/routes.ts:54](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/auth/routes.ts#L54)).

## 2. App: consumo de los endpoints

Cada feature tiene un **repositorio por entidad**, el único lugar que conoce las rutas. Todos usan el cliente único [client.ts](../../src/shared/api/client.ts#L84-L85).

| Repositorio | Rutas (`/api/...`) |
|---|---|
| [authRepository](../../src/features/auth/repositories/authRepository.ts) | `/auth/login`, `/auth/register`, `/auth/me` y el resto de `/auth` |
| [profileRepository](../../src/features/profile/repositories/profileRepository.ts) | `/profile` (`GET`, `PUT`, `DELETE`) |
| [addressRepository](../../src/features/addresses/repositories/addressRepository.ts) | `/profile/addresses` |
| [productRepository](../../src/features/catalog/repositories/productRepository.ts), [categoryRepository](../../src/features/catalog/repositories/categoryRepository.ts), [brandRepository](../../src/features/catalog/repositories/brandRepository.ts) | `/catalog/products`, `/catalog/featured`, `/catalog/categories`, `/catalog/brands` |
| [serviceRepository](../../src/features/services/repositories/serviceRepository.ts), [modelsRepository](../../src/features/ar/repositories/modelsRepository.ts) | `/catalog/services`, `/catalog/products/:id` |
| [cartRepository](../../src/features/cart/repositories/cartRepository.ts) | `/cart` |
| [favoriteRepository](../../src/features/favorites/repositories/favoriteRepository.ts) | `/favorites` |
| [orderRepository](../../src/features/orders/repositories/orderRepository.ts) | `/orders` |
| [paymentRepository](../../src/features/payments/repositories/paymentRepository.ts) | `/payments` |
| [reviewRepository](../../src/features/reviews/repositories/reviewRepository.ts) | `/reviews` |
| [notificationRepository](../../src/features/notifications/repositories/notificationRepository.ts) | `/notifications` |
| [institutionalRepository](../../src/features/institutional/repositories/institutionalRepository.ts) | `/institutional`, `/contact/newsletter` |
| [chatbotRepository](../../src/features/chatbot/repositories/chatbotRepository.ts) | `/chatbot/message` |

Ejemplo: [useLogin](../../src/features/auth/hooks/useLogin.ts#L18) → [authRepository.login](../../src/features/auth/repositories/authRepository.ts#L77-L78) → `POST /api/auth/login`.

## 3. Token Bearer

### Backend

| Archivo | Qué hace |
|---|---|
| [`auth.service.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/services/auth.service.ts#L197-L266) | Compara la contraseña con su hash bcrypt, exige cuenta activa y firma el token |
| [`utils/jwt.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/utils/jwt.ts#L12-L27) | Firma y verifica con `JWT_SECRET` (variable de entorno); caduca en 7 días |
| [`auth/controller.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/auth/controller.ts#L65-L71) | Entrega el token a la app en la respuesta |
| [`auth.middleware.ts`](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/middlewares/auth.middleware.ts#L35-L77) | Lee `Authorization: Bearer`, verifica firma, caducidad y cuenta activa. Responde 401 sin token o con cuenta suspendida, 403 si el token es inválido o venció. Guarda el usuario en `req.user` |

### App

| Archivo | Qué hace |
|---|---|
| [secureToken.ts](../../src/shared/api/secureToken.ts#L22-L54) | Guarda, recupera y borra el token en `expo-secure-store` (Keychain / Keystore) |
| [authStore.ts](../../src/shared/store/authStore.ts#L28-L55) | Abre la sesión, la restaura al arrancar y la cierra |
| [client.ts](../../src/shared/api/client.ts#L98-L106) | Agrega `Authorization: Bearer <token>` a cada petición y cierra la sesión ante un 401 o 403 de token caducado |

```
Login:     POST /auth/login → backend firma el JWT → app lo guarda en el almacén seguro
Petición:  app agrega el Bearer → backend lo verifica → 200, o 401/403
Caducado:  app recibe 401/403 → borra el token → login
```
