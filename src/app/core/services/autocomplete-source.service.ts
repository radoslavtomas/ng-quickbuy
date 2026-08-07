import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AutocompleteOption } from '../models/autocomplete-option.model';
import type { AutocompleteEndpoint } from '../models/form-field.model';
import { OccupationSearchService } from './occupation-search.service';

/**
 * What a search-driven field needs from a backend.
 *
 * `describe` exists for recall: a stored quote comes back with a code and no
 * wording, and showing a customer `R09` where they expect "Retired" is not an
 * answer they can check.
 */
export interface AutocompleteSource {
  search(keyword: string): Observable<AutocompleteOption[]>;
  describe(code: string): Observable<string>;
}

/**
 * Maps the `endpoint` key in field configuration to a real search backend.
 *
 * This is the only place that knows which service answers which key, so adding a
 * searchable field is a configuration change plus one entry here — the renderer
 * stays unaware of what is being searched.
 *
 * Sources are built once and cached because they are passed as component inputs:
 * a fresh object per change detection would look like a new input every time.
 */
@Injectable({ providedIn: 'root' })
export class AutocompleteSourceService {
  private readonly occupations = inject(OccupationSearchService);

  private readonly sources: Readonly<Record<AutocompleteEndpoint, AutocompleteSource>> = {
    occupation: {
      search: keyword => this.occupations.searchOccupations(keyword),
      describe: code => this.occupations.getOccupationByCode(code),
    },
    industry: {
      search: keyword => this.occupations.searchIndustries(keyword),
      describe: code => this.occupations.getIndustryByCode(code),
    },
  };

  forEndpoint(endpoint: AutocompleteEndpoint): AutocompleteSource {
    return this.sources[endpoint];
  }
}
