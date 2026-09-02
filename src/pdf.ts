import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { FieldLayout, FieldStyle } from "./types";
import { MeasureFn, fitAdaptiveText, fitOverrideText, sanitizeText } from "./text-fit";

export interface PdfDocHandle {
  pdfDoc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
}

export async function createCertificatePdf(template: {
  bytes: Buffer;
  format: "jpg" | "png";
}): Promise<PdfDocHandle> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const image =
    template.format === "png" ? await pdfDoc.embedPng(template.bytes) : await pdfDoc.embedJpg(template.bytes);
  const { width, height } = image.size();

  const page = pdfDoc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });

  return { pdfDoc, page, width, height };
}

export async function embedPdfFont(handle: PdfDocHandle, fontBytes: Buffer): Promise<PDFFont> {
  return handle.pdfDoc.embedFont(fontBytes);
}

function hexToRgb(hex: string): ReturnType<typeof rgb> {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// Centered: yFrac measured from the bottom (pdf-lib's origin), lines vertically
// centered around it — matches every certificate field in production today.
function drawLinesCentered(
  page: PDFPage,
  lines: string[],
  width: number,
  height: number,
  yFrac: number,
  size: number,
  lineGapMult: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  const lineGap = size * lineGapMult;
  const yStart = height * yFrac + (lineGap * (lines.length - 1)) / 2;
  for (let i = 0; i < lines.length; i++) {
    const lw = font.widthOfTextAtSize(lines[i], size);
    page.drawText(lines[i], { x: width / 2 - lw / 2, y: yStart - i * lineGap, size, font, color });
  }
}

// Top-anchored: yFrac measured from the TOP of the page — same convention as canvas.ts's
// "top" anchor, so the admin drag-to-reposition editor (FieldPositionEditor.tsx) needs no
// backend-specific inversion logic. pdf-lib's own coordinate origin is bottom-left, so the
// first line's baseline is computed as height * (1 - yFrac); subsequent lines are drawn at
// decreasing native-y (visually downward, i.e. increasing distance from top), exactly
// reproducing each site's pre-existing hand-rolled top-anchored positioning (sicilian,
// mannheimweb) once their yFrac values are expressed as "distance from top" instead of
// their old "distance from bottom".
function drawLinesTopAnchored(
  page: PDFPage,
  lines: string[],
  width: number,
  height: number,
  yFrac: number,
  size: number,
  lineGapMult: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  const lineGap = size * lineGapMult;
  const yStart = height * (1 - yFrac);
  for (let i = 0; i < lines.length; i++) {
    const lw = font.widthOfTextAtSize(lines[i], size);
    page.drawText(lines[i], { x: width / 2 - lw / 2, y: yStart - i * lineGap, size, font, color });
  }
}

function assertSupportedAnchor(layout: FieldLayout, fn: string) {
  if (layout.anchor !== "center" && layout.anchor !== "top") {
    throw new Error(`pdf.${fn}: anchor "${layout.anchor}" is not implemented yet`);
  }
}

export function drawAdaptiveField(
  handle: PdfDocHandle,
  text: string,
  layout: FieldLayout,
  style: FieldStyle,
  font: PDFFont,
  sizeMultiplier = 1,
): void {
  assertSupportedAnchor(layout, "drawAdaptiveField");
  const { width, height } = handle;
  const clean = sanitizeText(text);
  const maxW = width * layout.maxWidthFrac;
  const fullSize = height * layout.sizeFrac * sizeMultiplier;
  const lineGapMult = layout.lineGapMult ?? 1.25;

  const measure: MeasureFn = (t, s) => font.widthOfTextAtSize(t, s);
  const { lines, size } = fitAdaptiveText(clean, measure, {
    maxW,
    fullSize,
    minSizeRatio: style.minSizeRatio,
    absMinSizeRatio: style.absMinSizeRatio,
    balanceThreshold: style.balanceThreshold,
    lineGapMult,
    maxBlockHeight: layout.maxBlockHeightFrac !== undefined ? height * layout.maxBlockHeightFrac : undefined,
  });

  const draw = layout.anchor === "top" ? drawLinesTopAnchored : drawLinesCentered;
  draw(handle.page, lines, width, height, layout.yFrac, size, lineGapMult, font, hexToRgb(style.color));
}

export function drawOverrideField(
  handle: PdfDocHandle,
  text: string,
  layout: FieldLayout,
  style: FieldStyle,
  font: PDFFont,
  sizeMultiplier = 1,
): void {
  assertSupportedAnchor(layout, "drawOverrideField");
  const { width, height } = handle;
  const clean = sanitizeText(text);
  const maxW = width * layout.maxWidthFrac;
  const fullSize = height * layout.sizeFrac * sizeMultiplier;
  const lineGapMult = layout.lineGapMult ?? 1.25;

  const measure: MeasureFn = (t, s) => font.widthOfTextAtSize(t, s);
  // Deliberately not threading style.minSizeRatio here — that field's default (0.55) is
  // tuned for the adaptive fitter; override text has always used its own 0.45 floor,
  // and reusing the same style field for both would silently change one if a site ever
  // customizes the other.
  const { lines, size } = fitOverrideText(clean, measure, { maxW, fullSize });

  const draw = layout.anchor === "top" ? drawLinesTopAnchored : drawLinesCentered;
  draw(handle.page, lines, width, height, layout.yFrac, size, lineGapMult, font, hexToRgb(style.color));
}

export async function finalizePdf(
  handle: PdfDocHandle,
  opts?: { creationDate?: Date; modificationDate?: Date },
): Promise<Uint8Array> {
  if (opts?.creationDate) handle.pdfDoc.setCreationDate(opts.creationDate);
  if (opts?.modificationDate) handle.pdfDoc.setModificationDate(opts.modificationDate);
  return handle.pdfDoc.save();
}
