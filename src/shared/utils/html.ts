// src/shared/utils/html.ts — Lectura del HTML enriquecido del backend (políticas).
// Sin dependencias: solo los tags que produce el editor del sitio — <p>, <br>,
// <strong>/<b>, <em>/<i>, <ul>/<li> y <a href>. El resto se descarta como texto.

export type HtmlBlock = { type: "p" | "li"; content: string };

export type HtmlSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** Solo http(s), mailto y tel: cualquier otro esquema se pinta como texto. */
  href?: string;
};

// Centinela para <br>: carácter de control que no aparece en el texto real.
const BR = String.fromCharCode(1);
const BR_RE = new RegExp(BR, "g");
const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

/** Decodifica las entidades HTML más comunes. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Divide el HTML en párrafos y elementos de lista, en orden de aparición. */
export function parseHtmlBlocks(html: string): HtmlBlock[] {
  const normalized = html
    .replace(/\r?\n/g, " ")
    .replace(/<br\s*\/?>/gi, BR)
    // <li><p>texto</p></li> → <li>texto</li>
    .replace(/<li[^>]*>\s*<p[^>]*>/gi, "<li>")
    .replace(/<\/p>\s*<\/li>/gi, "</li>");

  const blocks: HtmlBlock[] = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>|<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    if (m[1] !== undefined) blocks.push({ type: "p", content: m[1] });
    else blocks.push({ type: "li", content: m[2] });
  }
  if (blocks.length === 0) blocks.push({ type: "p", content: normalized });
  return blocks;
}

/** Texto plano de un fragmento: sin tags, con entidades y saltos de <br>. */
function plain(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]+>/g, "")).replace(BR_RE, "\n");
}

/** Segmentos con estilo de un bloque. Los vacíos se omiten. */
export function parseHtmlInline(content: string): HtmlSegment[] {
  const segments: HtmlSegment[] = [];
  const re =
    /<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>|<(?:em|i)>([\s\S]*?)<\/(?:em|i)>|<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

  const push = (raw: string, extra: Omit<HtmlSegment, "text"> = {}) => {
    const text = plain(raw);
    if (text) segments.push({ text, ...extra });
  };

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) push(content.slice(last, m.index));
    if (m[1] !== undefined) push(m[1], { bold: true });
    else if (m[2] !== undefined) push(m[2], { italic: true });
    else {
      const href = decodeEntities(m[3].trim());
      push(m[4], SAFE_HREF.test(href) ? { href } : {});
    }
    last = re.lastIndex;
  }
  if (last < content.length) push(content.slice(last));
  return segments;
}
