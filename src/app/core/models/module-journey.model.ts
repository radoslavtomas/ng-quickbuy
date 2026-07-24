import type { ModuleJourneyType } from './brand.model';

export interface JourneyStep {
  id: number;
  name: string;
  displayName: string;
  icon: string;
  next: string | null;
  prev: string | null;
}

export interface ModuleJourney {
  type: ModuleJourneyType;
  steps: readonly JourneyStep[];
}
