import { Canvas, SKRSContext2D } from "@napi-rs/canvas";
import { FieldLayout, FieldStyle } from "./types";
export interface CanvasHandle {
    ctx: SKRSContext2D;
    canvas: Canvas;
    width: number;
    height: number;
}
export declare function createRasterCanvas(template: {
    bytes: Buffer;
}): Promise<CanvasHandle>;
/**
 * Buffer-based font registration — no filesystem access inside the package. Checks the
 * native GlobalFonts registry (not a module-scoped flag) before registering, since in
 * dev mode hot-reloading a consuming site's module resets JS-level flags on every edit
 * but the registry itself is process-global.
 */
export declare function registerCanvasFont(fontBytes: Buffer, familyName: string): void;
export declare function drawAdaptiveField(handle: CanvasHandle, text: string, layout: FieldLayout, style: FieldStyle, fontFamily: string, sizeMultiplier?: number): void;
export declare function drawOverrideField(handle: CanvasHandle, text: string, layout: FieldLayout, style: FieldStyle, fontFamily: string, sizeMultiplier?: number): void;
export declare function finalizePng(handle: CanvasHandle): Buffer;
//# sourceMappingURL=canvas.d.ts.map