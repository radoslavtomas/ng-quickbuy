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
  /** step name -> section id -> field values */
  hydratedSteps: Record<string, Record<string, Record<string, unknown>>>;
  /** Recall keys no section claimed, i.e. journey config and contract have drifted. */
  unresolvedFields: Record<string, unknown>;
}
