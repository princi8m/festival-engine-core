"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCertificatePdf = createCertificatePdf;
exports.embedPdfFont = embedPdfFont;
exports.drawAdaptiveField = drawAdaptiveField;
exports.drawOverrideField = drawOverrideField;
exports.finalizePdf = finalizePdf;
const pdf_lib_1 = require("pdf-lib");
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const text_fit_1 = require("./text-fit");
async function createCertificatePdf(template) {
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    pdfDoc.registerFontkit(fontkit_1.default);
    const image = template.format === "png" ? await pdfDoc.embedPng(template.bytes) : await pdfDoc.embedJpg(template.bytes);
    const { width, height } = image.size();
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    return { pdfDoc, page, width, height };
}
async function embedPdfFont(handle, fontBytes) {
    return handle.pdfDoc.embedFont(fontBytes);
}
function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return (0, pdf_lib_1.rgb)(r, g, b);
}
// Centered: yFrac measured from the bottom (pdf-lib's origin), lines vertically
// centered around it — matches every certificate field in production today.
function drawLinesCentered(page, lines, width, height, yFrac, size, lineGapMult, font, color) {
    const lineGap = size * lineGapMult;
    const yStart = height * yFrac + (lineGap * (lines.length - 1)) / 2;
    for (let i = 0; i < lines.length; i++) {
        const lw = font.widthOfTextAtSize(lines[i], size);
        page.drawText(lines[i], { x: width / 2 - lw / 2, y: yStart - i * lineGap, size, font, color });
    }
}
function assertCenterAnchor(layout, fn) {
    if (layout.anchor !== "center") {
        throw new Error(`pdf.${fn}: anchor "${layout.anchor}" is not implemented yet — only "center" is supported today`);
    }
}
function drawAdaptiveField(handle, text, layout, style, font, sizeMultiplier = 1) {
    assertCenterAnchor(layout, "drawAdaptiveField");
    const { width, height } = handle;
    const clean = (0, text_fit_1.sanitizeText)(text);
    const maxW = width * layout.maxWidthFrac;
    const fullSize = height * layout.sizeFrac * sizeMultiplier;
    const lineGapMult = layout.lineGapMult ?? 1.25;
    const measure = (t, s) => font.widthOfTextAtSize(t, s);
    const { lines, size } = (0, text_fit_1.fitAdaptiveText)(clean, measure, {
        maxW,
        fullSize,
        minSizeRatio: style.minSizeRatio,
        absMinSizeRatio: style.absMinSizeRatio,
        balanceThreshold: style.balanceThreshold,
        lineGapMult,
        maxBlockHeight: layout.maxBlockHeightFrac !== undefined ? height * layout.maxBlockHeightFrac : undefined,
    });
    drawLinesCentered(handle.page, lines, width, height, layout.yFrac, size, lineGapMult, font, hexToRgb(style.color));
}
function drawOverrideField(handle, text, layout, style, font, sizeMultiplier = 1) {
    assertCenterAnchor(layout, "drawOverrideField");
    const { width, height } = handle;
    const clean = (0, text_fit_1.sanitizeText)(text);
    const maxW = width * layout.maxWidthFrac;
    const fullSize = height * layout.sizeFrac * sizeMultiplier;
    const lineGapMult = layout.lineGapMult ?? 1.25;
    const measure = (t, s) => font.widthOfTextAtSize(t, s);
    // Deliberately not threading style.minSizeRatio here — that field's default (0.55) is
    // tuned for the adaptive fitter; override text has always used its own 0.45 floor,
    // and reusing the same style field for both would silently change one if a site ever
    // customizes the other.
    const { lines, size } = (0, text_fit_1.fitOverrideText)(clean, measure, { maxW, fullSize });
    drawLinesCentered(handle.page, lines, width, height, layout.yFrac, size, lineGapMult, font, hexToRgb(style.color));
}
async function finalizePdf(handle, opts) {
    if (opts?.creationDate)
        handle.pdfDoc.setCreationDate(opts.creationDate);
    if (opts?.modificationDate)
        handle.pdfDoc.setModificationDate(opts.modificationDate);
    return handle.pdfDoc.save();
}
//# sourceMappingURL=pdf.js.map