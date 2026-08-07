import { PDFDocument, PDFFont, PDFPage } from "pdf-lib";
import { FieldLayout, FieldStyle } from "./types";
export interface PdfDocHandle {
    pdfDoc: PDFDocument;
    page: PDFPage;
    width: number;
    height: number;
}
export declare function createCertificatePdf(template: {
    bytes: Buffer;
    format: "jpg" | "png";
}): Promise<PdfDocHandle>;
export declare function embedPdfFont(handle: PdfDocHandle, fontBytes: Buffer): Promise<PDFFont>;
export declare function drawAdaptiveField(handle: PdfDocHandle, text: string, layout: FieldLayout, style: FieldStyle, font: PDFFont, sizeMultiplier?: number): void;
export declare function drawOverrideField(handle: PdfDocHandle, text: string, layout: FieldLayout, style: FieldStyle, font: PDFFont, sizeMultiplier?: number): void;
export declare function finalizePdf(handle: PdfDocHandle, opts?: {
    creationDate?: Date;
    modificationDate?: Date;
}): Promise<Uint8Array>;
//# sourceMappingURL=pdf.d.ts.map