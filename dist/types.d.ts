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
//# sourceMappingURL=types.d.ts.map