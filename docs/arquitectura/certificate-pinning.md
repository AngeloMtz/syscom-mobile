# Certificate pinning

La app solo acepta la conexión con la API si la cadena de certificados del servidor contiene una de las llaves públicas que trae fijadas. Así, aunque el teléfono confíe en un certificado falso (por ejemplo, el de un proxy en una red pública), la conexión se corta y nadie puede ponerse en medio (MitM).

## Cómo funciona

| Archivo | Qué hace |
|---|---|
| [sslPinning.ts](../../src/shared/api/sslPinning.ts) | Define las llaves fijadas y activa el pinning para el dominio de `EXPO_PUBLIC_API_URL` con [`react-native-ssl-public-key-pinning`](https://github.com/frw/react-native-ssl-public-key-pinning) |
| [_layout.tsx](../../src/app/_layout.tsx) | Lo activa al arrancar, antes de restaurar la sesión, para que ninguna petición salga sin él |

- **Android:** `CertificatePinner` de OkHttp, aplicado al cliente HTTP de React Native.
- **iOS:** TrustKit.
- **Cubre:** `fetch` y `XMLHttpRequest`, que es lo que usa Axios. Es decir, todas las peticiones de los repositorios.
- **No cubre:** el WebSocket del chat en vivo, que React Native maneja con otro cliente.
- **Se omite:** en Expo Go (no existe el módulo nativo) y con un backend local por `http`. Funciona en builds de desarrollo y de producción.

## Llaves fijadas

Se fijan **raíces de Let's Encrypt** y no el certificado del servidor: el de Railway (`*.up.railway.app`) se renueva cada pocos meses y fijarlo dejaría a la app sin conexión en la siguiente renovación.

| Raíz | Vence | SHA-256 del SPKI (base64) |
|---|---|---|
| ISRG Root YE (raíz de la cadena actual) | 2045 | `sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=` |
| ISRG Root X2 (firma a Root YE) | 2040 | `diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=` |
| ISRG Root X1 (respaldo, cadena clásica) | 2035 | `C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=` |

Cadena del servidor revisada el 12/11/2026: `*.up.railway.app` → Let's Encrypt YE2 → Root YE → Root X2.

**Para calcular o revisar una llave:**

```bash
# Llaves de la cadena que envía el servidor
echo | openssl s_client -servername <dominio> -connect <dominio>:443 -showcerts 2>/dev/null
# Hash de un certificado (cert.pem)
openssl x509 -in cert.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

## Mantenimiento

Si Railway deja de usar Let's Encrypt, la app no podrá conectarse hasta publicar una versión con las llaves nuevas. Antes de cambiar de dominio o de proveedor, se calculan las llaves nuevas, se agregan a `API_PUBLIC_KEY_HASHES` junto a las actuales y se publica esa versión.

## Cómo se prueba

Solo en un build (no en Expo Go):

1. Con las llaves correctas, la app inicia sesión y carga el catálogo con normalidad.
2. Con una llave cambiada a propósito, las peticiones a la API fallan y aparece en el log `Certificate pinning: se rechazó la conexión con <dominio>`.

Las pruebas unitarias están en [sslPinning.test.ts](../../src/__tests__/sslPinning.test.ts).
