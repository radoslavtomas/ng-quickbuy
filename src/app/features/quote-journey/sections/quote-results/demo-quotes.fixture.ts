export interface DemoQuote {
  insurer: string;
  plan: string;
  monthlyPremium: number;
  annualPremium: number;
  excess: number;
}

export const DEMO_QUOTES: readonly DemoQuote[] = [
  {
    insurer: 'AXA Demo',
    plan: 'Comprehensive Plus',
    monthlyPremium: 68.42,
    annualPremium: 786.34,
    excess: 250,
  },
  {
    insurer: 'Aviva Demo',
    plan: 'Comprehensive',
    monthlyPremium: 72.18,
    annualPremium: 829.12,
    excess: 200,
  },
  {
    insurer: 'Allianz Demo',
    plan: 'TPFT',
    monthlyPremium: 59.75,
    annualPremium: 687.1,
    excess: 300,
  },
];

