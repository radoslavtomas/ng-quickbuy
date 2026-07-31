export const PROPERTY_MODULE_CODES = ['HC', 'HH', 'LL'] as const;

export type PropertyModuleCode = (typeof PROPERTY_MODULE_CODES)[number];

export function asPropertyModuleCode(moduleCode: string): PropertyModuleCode {
  const normalized = moduleCode.toUpperCase();
  return (PROPERTY_MODULE_CODES as readonly string[]).includes(normalized) ? (normalized as PropertyModuleCode) : 'HC';
}
