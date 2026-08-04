export type BrandId = 'qld' | 'chq' | 'ajg';

export interface FooterLink {
  label: string;
  url: string;
}

export interface BrandFooter {
  text: string;
  links: FooterLink[];
}

export interface BrandConfig {
  id: BrandId;
  fullName: string;
  primaryColor: string;
  secondaryColor: string;
  logoPath: string;
  mainPhone: string;
  /**
   * Codes from `MODULE_CATALOGUE` this brand is allowed to sell, in display order.
   *
   * A brand contributes only the decision to sell a product; the description, icon
   * and journey come from the catalogue, so they cannot drift between brands.
   */
  moduleCodes: readonly string[];
  footer: BrandFooter;
}
