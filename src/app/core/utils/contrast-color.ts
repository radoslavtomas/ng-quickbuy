/**
 * Picks a readable foreground for a brand colour.
 *
 * Brand colours are configuration and vary in lightness — `#6FACDE` is nowhere
 * near `#07419d` — so white text on a filled marker is a guess, not a guarantee.
 * White on `#6FACDE` scores 2.2:1, which fails AA outright. These helpers measure
 * the background and pick the better of the two foregrounds, so adding a brand
 * cannot quietly introduce unreadable text.
 */

/** Near-black rather than pure black, to match the slate palette used elsewhere. */
const DARK_FOREGROUND = '#0f172a';
const LIGHT_FOREGROUND = '#ffffff';

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

/**
 * The foreground to use on top of `background`, whichever of the two reads better.
 *
 * An unparseable colour falls back to white, which is what the app assumed before
 * this existed, so a malformed brand value cannot make text vanish entirely.
 */
export function contrastColor(background: string): string {
  const onDarkText = contrastRatio(DARK_FOREGROUND, background);
  const onLightText = contrastRatio(LIGHT_FOREGROUND, background);

  if (onDarkText === null || onLightText === null) {
    return LIGHT_FOREGROUND;
  }

  return onDarkText > onLightText ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}
