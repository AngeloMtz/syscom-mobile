import { buildModelViewerHtml } from "@/features/ar/modelViewerHtml";

describe("buildModelViewerHtml", () => {
  it("incluye el script de <model-viewer>", () => {
    const html = buildModelViewerHtml({ glbUrl: "https://cdn.com/a.glb" });
    expect(html).toContain('src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"');
    expect(html).toContain("<model-viewer");
  });

  it("pone el glb en el atributo src", () => {
    const html = buildModelViewerHtml({ glbUrl: "https://cdn.com/a.glb" });
    expect(html).toContain('src="https://cdn.com/a.glb"');
  });

  it("añade ios-src cuando hay usdz, y lo omite cuando no", () => {
    const con = buildModelViewerHtml({ glbUrl: "https://cdn.com/a.glb", usdzUrl: "https://cdn.com/a.usdz" });
    expect(con).toContain('ios-src="https://cdn.com/a.usdz"');

    const sin = buildModelViewerHtml({ glbUrl: "https://cdn.com/a.glb" });
    expect(sin).not.toContain("ios-src");
  });

  it("usa el nombre como alt y escapa las comillas dobles", () => {
    const html = buildModelViewerHtml({ glbUrl: "https://cdn.com/a.glb", name: 'Cámara "pro"' });
    expect(html).toContain('alt="Cámara &quot;pro&quot;"');
  });

  it("sin nombre usa un alt genérico", () => {
    const html = buildModelViewerHtml({ glbUrl: "https://cdn.com/a.glb" });
    expect(html).toContain('alt="Modelo 3D"');
  });
});
