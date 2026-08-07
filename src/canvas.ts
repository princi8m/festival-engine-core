import { Canvas, GlobalFonts, SKRSContext2D, createCanvas, loadImage } from "@napi-rs/canvas";
import { FieldLayout, FieldStyle } from "./types";
import { MeasureFn, fitAdaptiveText, fitOverrideText, sanitizeText } from "./text-fit";

export interface CanvasHandle {
  ctx: SKRSContext2D;
  canvas: Canvas;
  width: number;
  height: number;
}

export async function createRasterCanvas(template: { bytes: Buffer }): Promise<CanvasHandle> {
  const img = await loadImage(template.bytes);
  const { width, height } = img;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height); // keep transparency where the template is transparent
  ctx.drawImage(img, 0, 0, width, height);

  return { ctx, canvas, width, height };
}

/**
 * Buffer-based font registration — no filesystem access inside the package. Checks the
 * native GlobalFonts registry (not a module-scoped flag) before registering, since in
 * dev mode hot-reloading a consuming site's module resets JS-level flags on every edit
 * but the registry itself is process-global.
 */
export function registerCanvasFont(fontBytes: Buffer, familyName: string): void {
  if (GlobalFonts.has(familyName)) return;
  GlobalFonts.register(fontBytes, familyName);
}

// Top-anchored: yFrac measured from the top, lines stack downward — matches every
// laurel field in production today (canvas textBaseline = "top").
function drawLinesTopAnchored(
  ctx: SKRSContext2D,
  lines: string[],
  canvasWidth: number,
  topY: number,
  size: number,
  lineGap: number,
  color: string,
  fontFamily: string,
) {
  ctx.font = `${size}px "${fontFamily}"`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvasWidth / 2, topY + i * lineGap);
  }
}

function assertTopAnchor(layout: FieldLayout, fn: string) {
  if (layout.anchor !== "top") {
    throw new Error(`canvas.${fn}: anchor "${layout.anchor}" is not implemented yet — only "top" is supported today`);
  }
}

export function drawAdaptiveField(
  handle: CanvasHandle,
  text: string,
  layout: FieldLayout,
  style: FieldStyle,
  fontFamily: string,
  sizeMultiplier = 1,
): void {
  assertTopAnchor(layout, "drawAdaptiveField");
  const { ctx, width, height } = handle;
  const clean = sanitizeText(text);
  const maxW = width * layout.maxWidthFrac;
  const fullSize = height * layout.sizeFrac * sizeMultiplier;
  const topY = height * layout.yFrac;
  const lineGapMult = layout.lineGapMult ?? 1.25;

  const measure: MeasureFn = (t, s) => {
    ctx.font = `${s}px "${fontFamily}"`;
    return ctx.measureText(t).width;
  };

  const { lines, size } = fitAdaptiveText(clean, measure, {
    maxW,
    fullSize,
    minSizeRatio: style.minSizeRatio,
    absMinSizeRatio: style.absMinSizeRatio,
    balanceThreshold: style.balanceThreshold,
    lineGapMult,
    maxBlockHeight: layout.maxBlockHeightFrac !== undefined ? height * layout.maxBlockHeightFrac : undefined,
  });

  const lineGap = size * lineGapMult;
  drawLinesTopAnchored(ctx, lines, width, topY, size, lineGap, style.color, fontFamily);
}

export function drawOverrideField(
  handle: CanvasHandle,
  text: string,
  layout: FieldLayout,
  style: FieldStyle,
  fontFamily: string,
  sizeMultiplier = 1,
): void {
  assertTopAnchor(layout, "drawOverrideField");
  const { ctx, width, height } = handle;
  const clean = sanitizeText(text);
  const maxW = width * layout.maxWidthFrac;
  const fullSize = height * layout.sizeFrac * sizeMultiplier;
  const topY = height * layout.yFrac;
  const lineGapMult = layout.lineGapMult ?? 1.25;

  const measure: MeasureFn = (t, s) => {
    ctx.font = `${s}px "${fontFamily}"`;
    return ctx.measureText(t).width;
  };

  // See pdf.ts's drawOverrideField for why style.minSizeRatio is deliberately not
  // threaded through here — it defaults fitOverrideText to its own 0.45 floor.
  const { lines, size } = fitOverrideText(clean, measure, { maxW, fullSize });

  const lineGap = size * lineGapMult;
  drawLinesTopAnchored(ctx, lines, width, topY, size, lineGap, style.color, fontFamily);
}

export function finalizePng(handle: CanvasHandle): Buffer {
  return handle.canvas.toBuffer("image/png");
}
