// src/features/services/components/ZoomableImage.tsx — Imagen con zoom.
// Pellizco para acercar/alejar, arrastre para moverla cuando está ampliada,
// doble toque para alternar el zoom y botones +/− como alternativa. Solo usa
// PanResponder de React Native: no necesita librerías de gestos.
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampScale,
  clampTranslation,
  nextScaleFromPinch,
  stepZoom,
  toggleZoomScale,
  touchDistance,
} from "@/features/services/gallery";

type View2D = { scale: number; tx: number; ty: number };

const VISTA_INICIAL: View2D = { scale: MIN_ZOOM, tx: 0, ty: 0 };
const DOBLE_TOQUE_MS = 280;

export default function ZoomableImage({ uri }: { uri: string }) {
  const { width, height } = useWindowDimensions();
  const [vista, setVista] = useState<View2D>(VISTA_INICIAL);

  // Los gestos corren fuera del render: leen siempre el último estado desde refs.
  const vistaRef = useRef<View2D>(VISTA_INICIAL);
  const tamanoRef = useRef({ width, height });
  const gesto = useRef({ conteo: 0, origenX: 0, origenY: 0, baseTx: 0, baseTy: 0, distInicial: 0, baseScale: 1, ultimoToque: 0 });

  useEffect(() => {
    tamanoRef.current = { width, height };
  }, [width, height]);

  const aplicar = useCallback((siguiente: View2D) => {
    vistaRef.current = siguiente;
    setVista(siguiente);
  }, []);

  /** Aplica un zoom nuevo reacomodando el desplazamiento para no dejar huecos. */
  const aplicarZoom = useCallback(
    (scale: number) => {
      const { width: w, height: h } = tamanoRef.current;
      const actual = vistaRef.current;
      aplicar({
        scale,
        tx: clampTranslation(actual.tx, scale, w),
        ty: clampTranslation(actual.ty, scale, h),
      });
    },
    [aplicar],
  );

  const responder = useMemo(
    () =>
      // Los manejadores solo corren cuando hay un gesto, nunca durante el render:
      // leer/escribir refs ahí es correcto, aunque la regla no lo distinga.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (e) => {
          const g = gesto.current;
          // Hora del propio evento táctil (no del reloj) para medir el doble toque.
          const ahora = e.nativeEvent.timestamp;
          if (e.nativeEvent.touches.length === 1) {
            if (ahora - g.ultimoToque < DOBLE_TOQUE_MS) {
              aplicarZoom(toggleZoomScale(vistaRef.current.scale));
              g.ultimoToque = 0;
            } else {
              g.ultimoToque = ahora;
            }
          }
          // Fuerza a "reanclar" el gesto en el primer movimiento.
          g.conteo = 0;
        },

        onPanResponderMove: (e) => {
          const g = gesto.current;
          const toques = e.nativeEvent.touches;
          const actual = vistaRef.current;
          const { width: w, height: h } = tamanoRef.current;
          if (toques.length === 0) return;

          // Al cambiar el número de dedos se reancla: evita saltos al soltar uno.
          if (toques.length !== g.conteo) {
            g.conteo = toques.length;
            g.origenX = toques[0].pageX;
            g.origenY = toques[0].pageY;
            g.baseTx = actual.tx;
            g.baseTy = actual.ty;
            if (toques.length >= 2) {
              g.distInicial = touchDistance(toques[0], toques[1]);
              g.baseScale = actual.scale;
            }
            return;
          }

          if (toques.length >= 2) {
            const scale = nextScaleFromPinch(g.baseScale, g.distInicial, touchDistance(toques[0], toques[1]));
            aplicar({
              scale,
              tx: clampTranslation(actual.tx, scale, w),
              ty: clampTranslation(actual.ty, scale, h),
            });
          } else if (actual.scale > MIN_ZOOM) {
            aplicar({
              scale: actual.scale,
              tx: clampTranslation(g.baseTx + (toques[0].pageX - g.origenX), actual.scale, w),
              ty: clampTranslation(g.baseTy + (toques[0].pageY - g.origenY), actual.scale, h),
            });
          }
        },
      }),
    [aplicar, aplicarZoom],
  );

  const puedeAcercar = vista.scale < MAX_ZOOM;
  const puedeAlejar = vista.scale > MIN_ZOOM;

  return (
    <View style={styles.contenedor}>
      <View style={styles.area} {...responder.panHandlers}>
        <Image
          source={{ uri }}
          style={{
            width,
            height,
            transform: [{ translateX: vista.tx }, { translateY: vista.ty }, { scale: clampScale(vista.scale) }],
          }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={styles.controles}>
        <ControlBoton
          icono="remove"
          etiqueta="Alejar"
          deshabilitado={!puedeAlejar}
          onPress={() => aplicarZoom(stepZoom(vistaRef.current.scale, -1))}
        />
        <ControlBoton
          icono="contract-outline"
          etiqueta="Restablecer zoom"
          deshabilitado={!puedeAlejar}
          onPress={() => aplicarZoom(MIN_ZOOM)}
        />
        <ControlBoton
          icono="add"
          etiqueta="Acercar"
          deshabilitado={!puedeAcercar}
          onPress={() => aplicarZoom(stepZoom(vistaRef.current.scale, 1))}
        />
      </View>
    </View>
  );
}

function ControlBoton({
  icono,
  etiqueta,
  deshabilitado,
  onPress,
}: {
  icono: React.ComponentProps<typeof Ionicons>["name"];
  etiqueta: string;
  deshabilitado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [styles.boton, { opacity: deshabilitado ? 0.35 : pressed ? 0.8 : 1 }]}
    >
      <Ionicons name={icono} size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#000" },
  area: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  controles: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    flexDirection: "row",
    gap: 14,
  },
  boton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
