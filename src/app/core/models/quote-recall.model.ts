export interface QuoteRecallRequest {
  module: string;
  reference?: string;
  postcode?: string;
  dateofbirth?: string;
  surname?: string;
  forename?: string;
  domain?: string;
}

export interface QuoteRecallResponse {
  parameters?: Record<string, string>;
  data?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  notes?: Record<string, string>;
  totals?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RecallHydrationResult {
  hydratedSteps: Record<string, Record<string, unknown>>;
  unresolvedFields: Record<string, unknown>;
}
