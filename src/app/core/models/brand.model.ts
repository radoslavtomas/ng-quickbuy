export type BrandId = 'qld' | 'chq' | 'ajg';
export type ModuleJourneyType = 'motor' | 'property';

export interface BrandModule {
  code: string;
  description: string;
  icon: string; // Font Awesome icon class, e.g. 'fa-home'
  journeyType: ModuleJourneyType;
}

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
  modules: BrandModule[];
  footer: BrandFooter;
}
