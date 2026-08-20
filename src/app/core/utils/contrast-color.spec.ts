import { BRAND_CONFIGS } from '../config/brands.config';
import {
  AA_NORMAL_TEXT,
  contrastRatio,
  parseColor,
  readableAgainst,
  relativeLuminance,
} from './contrast-color';

describe('contrast colour', () => {
  it('parses the colour notations brand configuration may use', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255]);
    expect(parseColor('#07419D')).toEqual([7, 65, 157]);
    expect(parseColor('rgb(111, 172, 222)')).toEqual([111, 172, 222]);
    expect(parseColor('not-a-colour')).toBeNull();
  });

  it('measures luminance against the known ends of the scale', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('reports the familiar contrast extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('leaves a colour alone when it already passes', () => {
    // ChoiceQuote navy against white is 11:1 with nothing to fix.
    expect(readableAgainst('#07419d')).toBe('#07419d');
  });

  it('darkens a colour that is too pale for a white surface', () => {
    // The old assumption: white on AJG blue scores 2.2:1 and fails AA.
    const adjusted = readableAgainst('#6facde');

    expect(adjusted).not.toBe('#6facde');
    expect(contrastRatio(adjusted, '#ffffff')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    // Still the same blue: blue stays the dominant channel, red the weakest.
    const [r, g, b] = parseColor(adjusted) ?? [0, 0, 0];
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
  });

  it('lightens rather than darkens when the surface is dark', () => {
    const adjusted = readableAgainst('#07419d', '#0f172a');

    expect(relativeLuminance(adjusted)).toBeGreaterThan(relativeLuminance('#07419d') ?? 0);
    expect(contrastRatio(adjusted, '#0f172a')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('hands back a colour it cannot read, rather than inventing one', () => {
    expect(readableAgainst('var(--somebody-elses-token)')).toBe('var(--somebody-elses-token)');
  });

  it('lets white sit on every brand colour once adjusted', () => {
    for (const brand of Object.values(BRAND_CONFIGS)) {
      for (const color of [brand.primaryColor, brand.secondaryColor]) {
        const fill = readableAgainst(color);
        const ratio = contrastRatio('#ffffff', fill);

        expect(
          ratio,
          `${brand.id} ${color} -> ${fill} scores ${ratio?.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  });
});
