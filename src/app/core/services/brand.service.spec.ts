import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AA_NORMAL_TEXT, contrastRatio } from '../utils/contrast-color';
import { BrandService } from './brand.service';

describe('BrandService accents', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
  });

  /**
   * Components paint white on these and read them as text on white, so this is the
   * guarantee they rely on. Asserted here rather than only on the utility, because
   * it is `BrandService` they actually inject.
   */
  it('offers brand colours that carry white text at AA', () => {
    const brandService = TestBed.inject(BrandService);

    for (const accent of [brandService.accent, brandService.accentAlt]) {
      const ratio = contrastRatio('#ffffff', accent);

      expect(ratio, `${accent} scores ${ratio?.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        AA_NORMAL_TEXT,
      );
    }
  });

  it('leaves a brand colour that already passes exactly as configured', () => {
    const brandService = TestBed.inject(BrandService);

    // The resolved brand on localhost is whichever DEFAULT_BRAND_ID names, so this
    // asserts the property rather than a literal: only a failing colour changes.
    const wasFailing =
      (contrastRatio('#ffffff', brandService.config.primaryColor) ?? 0) < AA_NORMAL_TEXT;

    expect(brandService.accent === brandService.config.primaryColor).toBe(!wasFailing);
  });
});
