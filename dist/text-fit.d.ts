export type MeasureFn = (text: string, size: number) => number;
export declare function sanitizeText(text: string): string;
export declare function bestTwoLineSplit(text: string, measure: MeasureFn, size: number, maxW: number): {
    line1: string;
    line2: string;
    balance: number;
    fits: boolean;
};
export declare function wrapToFit(text: string, measure: MeasureFn, size: number, maxW: number): string[];
export interface FitOptions {
    maxW: number;
    fullSize: number;
    minSizeRatio?: number;
    absMinSizeRatio?: number;
    balanceThreshold?: number;
    lineGapMult?: number;
    /** If set, shrink the final size further so the whole block height stays within this. */
    maxBlockHeight?: number;
}
export interface FitResult {
    lines: string[];
    size: number;
}
/**
 * Two-tier adaptive fit: shrink the text at its own size first; if that alone gets it
 * close enough (>=90% of full size), keep it on one line; else try a balanced two-word
 * split at full size; else fall back to greedy wrapping, shrinking further if any
 * wrapped line still overflows.
 */
export declare function fitAdaptiveText(text: string, measure: MeasureFn, opts: FitOptions): FitResult;
export interface OverrideFitOptions {
    maxW: number;
    fullSize: number;
    minSizeRatio?: number;
}
/** Manual multi-line text (split on "\n"), shrunk only as far as needed to fit each line. */
export declare function fitOverrideText(text: string, measure: MeasureFn, opts: OverrideFitOptions): FitResult;
//# sourceMappingURL=text-fit.d.ts.map