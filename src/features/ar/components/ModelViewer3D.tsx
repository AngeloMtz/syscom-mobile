// src/features/ar/components/ModelViewer3D.tsx
// Visor 3D embebido con WebView + <model-viewer>. Esta app es solo nativa
// (Android/iOS); no se usa en web.
import { WebView } from "react-native-webview";

import { buildModelViewerHtml } from "@/features/ar/modelViewerHtml";

type Props = {
  glbUrl?: string;
  usdzUrl?: string;
  name?: string;
};

export default function ModelViewer3D({ glbUrl, usdzUrl, name }: Props) {
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: buildModelViewerHtml({ glbUrl, usdzUrl, name }) }}
      style={{ flex: 1, backgroundColor: "#f2f4f7" }}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      // UA no estándar: evita la página de aviso de ngrok free al descargar
      // el modelo (ngrok no la mete si el UA no parece navegador).
      userAgent="SyscomMobileApp/1.0"
    />
  );
}
