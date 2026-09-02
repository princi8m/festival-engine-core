// Position/behavior for one text field on a certificate or laurel template.
//
// "center": yFrac is measured from the BOTTOM of the image (pdf-lib's coordinate origin),
//   and lines are vertically centered around it — matches how certificate fields are
//   positioned today.
// "top": yFrac is measured from the TOP of the image, and lines stack downward from it —
//   matches how laurel fields are positioned today (canvas's textBaseline = "top").
//
// pdf.ts supports both "center" and "top"; canvas.ts supports only "top" today (laurel
// has never needed a centered field). Either backend throws a clear "not implemented yet"
// error for an anchor it doesn't support, rather than silently producing wrong output.
// "top" means the same thing in both backends — yFrac is the first line's distance from
// the TOP of the image, lines stacking downward — regardless of that backend's own native
// coordinate origin (pdf-lib's is bottom-left; pdf.ts converts internally). This keeps the
// admin drag-to-reposition editor (FieldPositionEditor.tsx) backend-agnostic.
export interface FieldLayout {
  anchor: "center" | "top";
  yFrac: number;
  sizeFrac: number;
  maxWidthFrac: number;
  /** Line-height multiplier for multi-line text. Default 1.25. */
  lineGapMult?: number;
  /**
   * Absolute fraction of the image height this field's whole text block must not exceed
   * (e.g. so it doesn't bleed into an adjacent field below it). Only laurel's category
   * field uses this today; site config computes it relative to another field's position.
   */
  maxBlockHeightFrac?: number;
}

export interface FieldStyle {
  /** Hex color, e.g. "#c8102e". */
  color: string;
  /** Floor for the initial single-line shrink pass, as a fraction of the full size. Default 0.55. */
  minSizeRatio?: number;
  /** Floor for the wrap+shrink fallback pass, as a fraction of the full size. Default 0.35. */
  absMinSizeRatio?: number;
  /** Minimum word-length balance (0..1) for a 2-line split to be accepted over shrinking. Default 0.60. */
  balanceThreshold?: number;
}
