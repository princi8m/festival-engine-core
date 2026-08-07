// Position/behavior for one text field on a certificate or laurel template.
//
// "center": yFrac is measured from the BOTTOM of the image (pdf-lib's coordinate origin),
//   and lines are vertically centered around it — matches how certificate fields are
//   positioned today.
// "top": yFrac is measured from the TOP of the image, and lines stack downward from it —
//   matches how laurel fields are positioned today (canvas's textBaseline = "top").
//
// Only one anchor mode is actually implemented per format today (pdf.ts: "center",
// canvas.ts: "top") — the other throws a clear "not implemented yet" error rather than
// silently producing wrong output. The type itself stays open so a future site (e.g. a
// top-anchored certificate, matching sicilian/mannheimweb's current behavior) can add
// support without a breaking change to sites that don't need it.
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
