"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRasterCanvas = createRasterCanvas;
exports.registerCanvasFont = registerCanvasFont;
exports.drawAdaptiveField = drawAdaptiveField;
exports.drawOverrideField = drawOverrideField;
exports.finalizePng = finalizePng;
const canvas_1 = require("@napi-rs/canvas");
const text_fit_1 = require("./text-fit");
async function createRasterCanvas(template) {
    const img = await (0, canvas_1.loadImage)(template.bytes);
    const { width, height } = img;
    const canvas = (0, canvas_1.createCanvas)(width, height);
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
function registerCanvasFont(fontBytes, familyName) {
    if (canvas_1.GlobalFonts.has(familyName))
        return;
    canvas_1.GlobalFonts.register(fontBytes, familyName);
}
// Top-anchored: yFrac measured from the top, lines stack downward — matches every
// laurel field in production today (canvas textBaseline = "top").
function drawLinesTopAnchored(ctx, lines, canvasWidth, topY, size, lineGap, color, fontFamily) {
    ctx.font = `${size}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvasWidth / 2, topY + i * lineGap);
    }
}
function assertTopAnchor(layout, fn) {
    if (layout.anchor !== "top") {
        throw new Error(`canvas.${fn}: anchor "${layout.anchor}" is not implemented yet — only "top" is supported today`);
    }
}
function drawAdaptiveField(handle, text, layout, style, fontFamily, sizeMultiplier = 1) {
    assertTopAnchor(layout, "drawAdaptiveField");
    const { ctx, width, height } = handle;
    const clean = (0, text_fit_1.sanitizeText)(text);
    const maxW = width * layout.maxWidthFrac;
    const fullSize = height * layout.sizeFrac * sizeMultiplier;
    const topY = height * layout.yFrac;
    const lineGapMult = layout.lineGapMult ?? 1.25;
    const measure = (t, s) => {
        ctx.font = `${s}px "${fontFamily}"`;
        return ctx.measureText(t).width;
    };
    const { lines, size } = (0, text_fit_1.fitAdaptiveText)(clean, measure, {
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
function drawOverrideField(handle, text, layout, style, fontFamily, sizeMultiplier = 1) {
    assertTopAnchor(layout, "drawOverrideField");
    const { ctx, width, height } = handle;
    const clean = (0, text_fit_1.sanitizeText)(text);
    const maxW = width * layout.maxWidthFrac;
    const fullSize = height * layout.sizeFrac * sizeMultiplier;
    const topY = height * layout.yFrac;
    const lineGapMult = layout.lineGapMult ?? 1.25;
    const measure = (t, s) => {
        ctx.font = `${s}px "${fontFamily}"`;
        return ctx.measureText(t).width;
    };
    // See pdf.ts's drawOverrideField for why style.minSizeRatio is deliberately not
    // threaded through here — it defaults fitOverrideText to its own 0.45 floor.
    const { lines, size } = (0, text_fit_1.fitOverrideText)(clean, measure, { maxW, fullSize });
    const lineGap = size * lineGapMult;
    drawLinesTopAnchored(ctx, lines, width, topY, size, lineGap, style.color, fontFamily);
}
function finalizePng(handle) {
    return handle.canvas.toBuffer("image/png");
}
//# sourceMappingURL=canvas.js.map