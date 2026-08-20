import { BRAND_CONFIGS } from '../config/brands.config';
import { contrastColor, contrastRatio, parseColor, relativeLuminance } from './contrast-color';

/** WCAG AA for normal-size text. */
const AA_NORMAL_TEXT = 4.5;

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

  it('puts light text on a dark brand colour and dark text on a light one', () => {
    expect(contrastColor('#07419d')).toBe('#ffffff');
    // The old assumption: white here scores 2.2:1 and fails AA.
    expect(contrastColor('#6facde')).toBe('#0f172a');
  });

  it('falls back to white rather than nothing when the colour cannot be read', () => {
    expect(contrastColor('var(--somebody-elses-token)')).toBe('#ffffff');
  });

  it('keeps every brand colour readable at AA', () => {
    for (const brand of Object.values(BRAND_CONFIGS)) {
      for (const background of [brand.primaryColor, brand.secondaryColor]) {
        const ratio = contrastRatio(contrastColor(background), background);

        expect(
          ratio,
          `${brand.id} ${background} scores ${ratio?.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  });
});
