import { decodeEntities, parseHtmlBlocks, parseHtmlInline } from "@/shared/utils/html";

describe("decodeEntities", () => {
  it("decodifica las entidades más comunes", () => {
    expect(decodeEntities("Tú &amp; yo")).toBe("Tú & yo");
    expect(decodeEntities("&lt;etiqueta&gt;")).toBe("<etiqueta>");
    expect(decodeEntities("dice &quot;hola&quot;")).toBe('dice "hola"');
    expect(decodeEntities("d&#39;accord")).toBe("d'accord");
    expect(decodeEntities("uno&nbsp;dos")).toBe("uno dos");
  });
});

describe("parseHtmlBlocks", () => {
  it("separa párrafos en orden", () => {
    expect(parseHtmlBlocks("<p>Hola</p><p>Mundo</p>")).toEqual([
      { type: "p", content: "Hola" },
      { type: "p", content: "Mundo" },
    ]);
  });

  it("separa elementos de lista", () => {
    expect(parseHtmlBlocks("<ul><li>uno</li><li>dos</li></ul>")).toEqual([
      { type: "li", content: "uno" },
      { type: "li", content: "dos" },
    ]);
  });

  it("desanida <li><p>texto</p></li>", () => {
    expect(parseHtmlBlocks("<li><p>anidado</p></li>")).toEqual([{ type: "li", content: "anidado" }]);
  });

  it("si no hay bloques reconocibles, trata todo como un párrafo", () => {
    expect(parseHtmlBlocks("texto suelto")).toEqual([{ type: "p", content: "texto suelto" }]);
  });
});

describe("parseHtmlInline", () => {
  it("marca negritas e itálicas", () => {
    expect(parseHtmlInline("hola <strong>fuerte</strong> y <em>suave</em>")).toEqual([
      { text: "hola " },
      { text: "fuerte", bold: true },
      { text: " y " },
      { text: "suave", italic: true },
    ]);
  });

  it("conserva el href de un enlace seguro", () => {
    expect(parseHtmlInline('ver <a href="https://syscom.com">sitio</a>')).toEqual([
      { text: "ver " },
      { text: "sitio", href: "https://syscom.com" },
    ]);
  });

  it("descarta el href de un esquema no seguro (deja solo el texto)", () => {
    expect(parseHtmlInline('<a href="javascript:alert(1)">malo</a>')).toEqual([{ text: "malo" }]);
  });

  it("omite segmentos vacíos", () => {
    expect(parseHtmlInline("")).toEqual([]);
    expect(parseHtmlInline("<strong></strong>")).toEqual([]);
  });
});
