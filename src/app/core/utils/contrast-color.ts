/**
 * Keeps brand colours readable without changing what they are used for.
 *
 * Brand colours are configuration and vary in lightness — `#6FACDE` is nowhere
 * near `#07419d` — so white on a filled marker is a guess, not a guarantee: it
 * scores 2.2:1 on AJG's blue and fails AA outright. Swapping to dark text where
 * that happens is one fix, but it makes one brand look unlike the others for a
 * reason no customer can see. Instead these helpers keep the roles fixed — white
 * on the fill, the brand colour on the page — and darken (or lighten) the brand
 * colour by the least amount that reaches the required ratio. A brand that
 * already passes is returned untouched, so this is invisible for `qld` and `chq`.
 */

/** WCAG AA for normal-size text. Also clears the 3:1 minimum for graphics. */
export const AA_NORMAL_TEXT = 4.5;

/** Steps of bisection: 1/4096 of the range, far finer than 8-bit channels resolve. */
const BISECTION_STEPS = 12;

/** `#rgb`, `#rrggbb` or `rgb()`/`rgba()`, which is what brand config may hold. */
export function parseColor(color: string): readonly [number, number, number] | null {
  const value = color.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value);
  if (hex) {
    const digits = hex[1];
    const expanded =
      digits.length === 3
        ? digits
            .split('')
            .map((digit) => digit + digit)
            .join('')
        : digits;

    return [
      Number.parseInt(expanded.slice(0, 2), 16),
      Number.parseInt(expanded.slice(2, 4), 16),
      Number.parseInt(expanded.slice(4, 6), 16),
    ];
  }

  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(value);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  return null;
}

/** WCAG relative luminance, 0 for black and 1 for white. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseColor(color);
  if (!rgb) {
    return null;
  }

  const [r, g, b] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, from 1:1 to 21:1. */
export function contrastRatio(foreground: string, background: string): number | null {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  if (first === null || second === null) {
    return null;
  }

  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

function toHex(rgb: readonly [number, number, number]): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

/** Moves every channel `amount` of the way towards `pole` (0 for black, 255 for white). */
function mixTowards(
  rgb: readonly [number, number, number],
  pole: number,
  amount: number,
): readonly [number, number, number] {
  return [
    rgb[0] + (pole - rgb[0]) * amount,
    rgb[1] + (pole - rgb[1]) * amount,
    rgb[2] + (pole - rgb[2]) * amount,
  ];
}

/**
 * `color`, darkened or lightened as little as needed to be legible on `surface`.
 *
 * Hue is preserved: only the distance to black or white changes, so the result
 * still reads as the brand. A colour that already meets `targetRatio`, or one that
 * cannot be parsed, is handed back unchanged — a malformed brand value should look
 * wrong in review, not silently become a different colour.
 */
export function readableAgainst(
  color: string,
  surface = '#ffffff',
  targetRatio = AA_NORMAL_TEXT,
): string {
  const rgb = parseColor(color);
  const surfaceLuminance = relativeLuminance(surface);
  if (!rgb || surfaceLuminance === null) {
    return color;
  }

  const meetsTarget = (candidate: string) =>
    (contrastRatio(candidate, surface) ?? 0) >= targetRatio;
  if (meetsTarget(color)) {
    return color;
  }

  // Away from the surface: towards black on a light one, towards white on a dark one.
  const pole = surfaceLuminance > 0.5 ? 0 : 255;

  // The pole itself is the most extreme option, and the fallback if even it falls
  // short — which only a mid-grey surface can cause, and no darkening would fix.
  let best = toHex(mixTowards(rgb, pole, 1));
  let low = 0;
  let high = 1;

  for (let step = 0; step < BISECTION_STEPS; step++) {
    const amount = (low + high) / 2;
    const candidate = toHex(mixTowards(rgb, pole, amount));

    if (meetsTarget(candidate)) {
      best = candidate;
      high = amount;
    } else {
      low = amount;
    }
  }

  return best;
}
