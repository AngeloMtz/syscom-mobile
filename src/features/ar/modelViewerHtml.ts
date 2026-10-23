// src/features/ar/modelViewerHtml.ts
// HTML del visor 3D con <model-viewer> de Google (misma estrategia que usa el
// admin de la web). Se embebe en un WebView. La RA real la lanza el botón
// nativo desde React Native, no desde este HTML, para no depender del botón
// del propio <model-viewer> (que falla si el WebView no puede abrir intents).

export function buildModelViewerHtml(opts: {
  glbUrl?: string;
  usdzUrl?: string;
  name?: string;
}): string {
  const { glbUrl, usdzUrl, name } = opts;
  const src = (glbUrl ?? "").replace(/"/g, "&quot;");
  const iosSrc = usdzUrl ? ` ios-src="${usdzUrl.replace(/"/g, "&quot;")}"` : "";
  const alt = (name ?? "Modelo 3D").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #f2f4f7; }
    model-viewer {
      width: 100%;
      height: 100%;
      --poster-color: transparent;
      background: linear-gradient(180deg, #ffffff 0%, #eef1f5 100%);
    }
    .hint {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      color: #6b7683;
      font: 500 12px system-ui, -apple-system, sans-serif;
      background: rgba(255,255,255,0.85);
      border-radius: 999px;
      padding: 6px 14px;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <model-viewer
    src="${src}"${iosSrc}
    alt="${alt}"
    camera-controls
    auto-rotate
    shadow-intensity="1"
    touch-action="pan-y"></model-viewer>
  <div class="hint">Arrastra para girar · pellizca para acercar</div>
</body>
</html>`;
}
