export const MOTOR_MODULE_CODES = ['PC', 'GV', 'TX', 'BD'] as const;

export type MotorModuleCode = (typeof MOTOR_MODULE_CODES)[number];

export function asMotorModuleCode(moduleCode: string): MotorModuleCode {
  const normalized = moduleCode.toUpperCase();
  return (MOTOR_MODULE_CODES as readonly string[]).includes(normalized) ? (normalized as MotorModuleCode) : 'PC';
}
