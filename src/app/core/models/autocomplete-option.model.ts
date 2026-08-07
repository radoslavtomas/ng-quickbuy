/**
 * A resolved choice from a search-driven field.
 *
 * Both halves are kept together on purpose. The insurer wants the code, the
 * customer recognises the description, and storing them as one value means the two
 * can never drift apart — which is exactly what happened when a code field and a
 * description field were maintained side by side.
 */
export interface AutocompleteOption {
  readonly code: string;
  readonly description: string;
}

/** Narrows an untyped answer to an option, or `null` when it is anything else. */
export function asAutocompleteOption(value: unknown): AutocompleteOption | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<AutocompleteOption>;
  return typeof candidate.code === 'string' && typeof candidate.description === 'string'
    ? { code: candidate.code, description: candidate.description }
    : null;
}

/** The code of an answer captured by a search field, or `''` when unresolved. */
export function autocompleteCode(value: unknown): string {
  return asAutocompleteOption(value)?.code ?? '';
}
