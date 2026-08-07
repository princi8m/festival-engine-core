// Pure text-fitting math, shared between the pdf-lib (certificate) and canvas (laurel)
// backends via an injected width-measurement function — this is the one algorithm that
// was previously implemented twice, identically in shape, once per backend.

export type MeasureFn = (text: string, size: number) => number;

export function sanitizeText(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ");
}

export function bestTwoLineSplit(
  text: string,
  measure: MeasureFn,
  size: number,
  maxW: number,
): { line1: string; line2: string; balance: number; fits: boolean } {
  const words = text.split(" ");
  let bestSplit = 1;
  let bestBalance = 0;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    const w1 = measure(l1, size);
    const w2 = measure(l2, size);
    const balance = Math.min(w1, w2) / Math.max(w1, w2);
    if (balance > bestBalance) {
      bestBalance = balance;
      bestSplit = i;
    }
  }
  const line1 = words.slice(0, bestSplit).join(" ");
  const line2 = words.slice(bestSplit).join(" ");
  const fits = measure(line1, size) <= maxW && measure(line2, size) <= maxW;
  return { line1, line2, balance: bestBalance, fits };
}

export function wrapToFit(text: string, measure: MeasureFn, size: number, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && measure(test, size) > maxW) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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
export function fitAdaptiveText(text: string, measure: MeasureFn, opts: FitOptions): FitResult {
  const { maxW, fullSize } = opts;
  const minSizeRatio = opts.minSizeRatio ?? 0.55;
  const absMinSizeRatio = opts.absMinSizeRatio ?? 0.35;
  const balanceThreshold = opts.balanceThreshold ?? 0.6;
  const lineGapMult = opts.lineGapMult ?? 1.25;

  const minSize = fullSize * minSizeRatio;
  let scaledSize = fullSize;
  while (measure(text, scaledSize) > maxW && scaledSize > minSize) {
    scaledSize -= 0.5;
  }
  const scaleFactor = scaledSize / fullSize;

  const { line1, line2, balance, fits } = bestTwoLineSplit(text, measure, fullSize, maxW);

  let lines: string[];
  let size: number;
  if (scaleFactor >= 0.9) {
    lines = [text];
    size = scaledSize;
  } else if (fits && balance >= balanceThreshold) {
    lines = [line1, line2];
    size = fullSize;
  } else {
    size = scaledSize;
    lines = wrapToFit(text, measure, size, maxW);
    const absMinSize = fullSize * absMinSizeRatio;
    while (lines.some((l) => measure(l, size) > maxW) && size > absMinSize) {
      size -= 0.5;
      lines = wrapToFit(text, measure, size, maxW);
    }
  }

  if (opts.maxBlockHeight !== undefined) {
    const blockH = size * (1 + (lines.length - 1) * lineGapMult);
    if (blockH > opts.maxBlockHeight) {
      size = size * (opts.maxBlockHeight / blockH);
    }
  }

  return { lines, size };
}

export interface OverrideFitOptions {
  maxW: number;
  fullSize: number;
  minSizeRatio?: number;
}

/** Manual multi-line text (split on "\n"), shrunk only as far as needed to fit each line. */
export function fitOverrideText(text: string, measure: MeasureFn, opts: OverrideFitOptions): FitResult {
  const minSizeRatio = opts.minSizeRatio ?? 0.45;
  let size = opts.fullSize;
  const minSize = size * minSizeRatio;
  const lines = text.split("\n").filter(Boolean);

  while (lines.some((l) => measure(l, size) > opts.maxW) && size > minSize) {
    size -= 0.5;
  }

  return { lines, size };
}
