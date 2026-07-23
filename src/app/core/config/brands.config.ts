import type { BrandConfig } from '../models/brand.model';

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  qld: {
    id: 'qld',
    fullName: 'Quoteline Direct',
    primaryColor: '#624097',
    secondaryColor: '#942765',
    logoPath: 'img/logos/qld/logo_header.png',
    mainPhone: '0161 874 7710',
    modules: [
      { code: 'PC', description: 'Car Insurance', icon: 'fa-car' },
      { code: 'GV', description: 'Van Insurance', icon: 'fa-truck' },
      { code: 'BD', description: 'Breakdown Insurance', icon: 'fa-wrench' },
      { code: 'TX', description: 'Taxi Insurance', icon: 'fa-taxi' },
      { code: 'HC', description: 'House Insurance', icon: 'fa-home' },
      { code: 'HH', description: 'Holiday Home Insurance', icon: 'fa-umbrella-beach' },
      { code: 'LL', description: 'Landlord Insurance', icon: 'fa-building' },
    ],
    footer: {
      text: 'Quoteline Direct is a trading name of Arthur J. Gallagher Insurance Brokers Limited, which is authorised and regulated by the Financial Conduct Authority. Registered Office: Spectrum Building, 7th Floor, 55 Blythswood Street, Glasgow, G2 7AT. Registered in Scotland. Company Number: SC108909',
      links: [
        { label: 'Privacy Notice', url: '/privacy-notice' },
        { label: 'Cookie Policy', url: '/cookie-policy' },
        { label: 'Legal and Regulatory Information', url: '/legal' },
        { label: 'Terms of Business', url: '/terms-of-business' },
      ],
    },
  },
  chq: {
    id: 'chq',
    fullName: 'ChoiceQuote',
    primaryColor: '#07419d',
    secondaryColor: '#8cc63e',
    logoPath: 'img/logos/chq/logo_header.png',
    mainPhone: '0161 929 2837',
    modules: [
      { code: 'TX', description: 'Taxi Insurance', icon: 'fa-taxi' },
    ],
    footer: {
      text: 'ChoiceQuote is a trading name of Arthur J. Gallagher Insurance Brokers Limited, which is authorised and regulated by the Financial Conduct Authority. Registered Office: Spectrum Building, 7th Floor, 55 Blythswood Street, Glasgow, G2. Online sales and quotation service is currently only available to UK mainland customers. Calls may be recorded for training and monitoring purposes.',
      links: [
        { label: 'Contact Us', url: '/contact' },
        { label: 'Cookie Notice', url: '/cookie-notice' },
        { label: 'Privacy Policy', url: '/privacy-policy' },
        { label: 'Terms of Use', url: '/terms-of-use' },
      ],
    },
  },
  ajg: {
    id: 'ajg',
    fullName: 'Arthur J. Gallagher',
    primaryColor: '#6FACDE',
    secondaryColor: '#4e87c6',
    logoPath: 'img/logos/ajg/logo_header.png',
    mainPhone: '0161 874 7710',
    modules: [
      { code: 'GV', description: 'Van Insurance', icon: 'fa-truck' },
      { code: 'TX', description: 'Taxi Insurance', icon: 'fa-taxi' },
      { code: 'HC', description: 'House Insurance', icon: 'fa-home' },
    ],
    footer: {
      text: 'Arthur J. Gallagher Insurance Brokers Limited is authorised and regulated by the Financial Conduct Authority. Registered Office: Spectrum Building, 55, Blythswood Street, Glasgow, G2 7AT. Registered in Scotland. Company Number: SC108909',
      links: [
        { label: 'Contact Us', url: '/contact' },
        { label: 'Cookie Notice', url: '/cookie-notice' },
        { label: 'Privacy Policy', url: '/privacy-policy' },
        { label: 'Terms of Use', url: '/terms-of-use' },
      ],
    },
  },
};
