/**
 * Minimal multi-page PDF (JPEG images). Offline, no external PDF library.
 */

export type PdfPageImage = {
  jpeg: Uint8Array;
  width: number;
  height: number;
};

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const c of chunks) n += c.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** Build a PDF 1.4 document with one page per JPEG. */
export function buildPdfFromJpegs(pages: PdfPageImage[]): Uint8Array {
  if (!pages.length) throw new Error('no pages');

  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;

  const push = (chunk: Uint8Array | string) => {
    const bytes = typeof chunk === 'string' ? enc(chunk) : chunk;
    parts.push(bytes);
    pos += bytes.length;
  };

  const markObj = (num: number) => {
    offsets[num] = pos;
  };

  push('%PDF-1.4\n');

  // Catalog + pages tree placeholders — object numbers:
  // 1: Catalog, 2: Pages, then per page: Page, Image, Content (3 objs each)
  const pageCount = pages.length;
  const kids: string[] = [];
  let nextObj = 3;

  type PageObjs = { page: number; image: number; content: number };
  const pageObjs: PageObjs[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = nextObj++;
    const image = nextObj++;
    const content = nextObj++;
    pageObjs.push({ page, image, content });
    kids.push(`${page} 0 R`);
  }

  markObj(1);
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  markObj(2);
  push(
    `2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>\nendobj\n`,
  );

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i]!;
    const ids = pageObjs[i]!;
    const w = p.width;
    const h = p.height;

    markObj(ids.page);
    push(
      `${ids.page} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${ids.image} 0 R >> >> /Contents ${ids.content} 0 R >>\nendobj\n`,
    );

    markObj(ids.image);
    push(
      `${ids.image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
    );
    push(p.jpeg);
    push('\nendstream\nendobj\n');

    const contentStream = `q\n${w} 0 0 ${h} 0 0 cm\n/Im${i} Do\nQ\n`;
    markObj(ids.content);
    push(
      `${ids.content} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
    );
  }

  const xrefStart = pos;
  const maxObj = nextObj - 1;
  let xref = `xref\n0 ${maxObj + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i <= maxObj; i++) {
    const off = offsets[i] ?? 0;
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  push(xref);
  push(
    `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  );

  return concat(parts);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
