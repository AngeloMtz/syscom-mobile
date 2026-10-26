// src/features/services/components/ImageZoomModal.tsx — Visor a pantalla completa.
// Al cerrarse el Modal se desmonta su contenido, así que cada vez que se abre
// la imagen arranca sin zoom.
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ZoomableImage from "@/features/services/components/ZoomableImage";

type Props = {
  visible: boolean;
  uri: string;
  onClose: () => void;
};

export default function ImageZoomModal({ visible, uri, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fondo}>
        <ZoomableImage uri={uri} />
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cerrar imagen"
          style={[styles.cerrar, { top: insets.top + 12 }]}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#000" },
  cerrar: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
