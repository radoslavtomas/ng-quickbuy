import { Component, computed, effect, inject, input, signal, viewChildren } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { FormFieldConfig, FormFieldOption } from '../../../../core/models/form-field.model';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import {
  OccupationSearchService,
} from '../../../../core/services/occupation-search.service';
import { SignalFormComponent } from '../../../../shared/components/signal-form/signal-form';
import {
  EMPLOYMENT_STATUS_OPTIONS,
  FTE_OCCUPATION_OPTIONS,
  GV_EXTRA_OPTION,
} from '../../specific-modules/config/lookups/employment';

/** Statuses where occupation and industry are auto-set and hidden. */
const AUTO_SET_STATUSES: Readonly<Record<string, { occupationCode: string; industryCode: string }>> =
  {
    R: { occupationCode: 'R09', industryCode: '947' },
    U: { occupationCode: 'U03', industryCode: '186' },
    H: { occupationCode: 'H09', industryCode: '186' },
  };

/** Statuses that show the autocomplete inputs. */
const SEARCH_STATUS_CODES = ['E', 'SE', 'D', 'P', 'G', 'O', 'L'] as const;
const SEARCH_STATUSES = new Set<string>(SEARCH_STATUS_CODES);

const HIDDEN_FIELD_VALUE = '__never__';

const PARTTIME_QUESTION_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Do you have a second occupation?',
    name: 'hasParttime',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
];

const FULLTIME_FTE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'select',
    label: 'Occupation',
    name: 'occupationCode',
    validators: [{ type: 'required', message: 'Please select your occupation.' }],
    options: FTE_OCCUPATION_OPTIONS,
  },
];

const PARTTIME_FTE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'select',
    label: 'Occupation',
    name: 'ptOccupationCode',
    validators: [{ type: 'required', message: 'Please select your occupation.' }],
    options: FTE_OCCUPATION_OPTIONS,
  },
];

const FULLTIME_SEARCH_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'autocomplete',
    label: 'Occupation',
    name: 'occupationDescription',
    validators: [
      { type: 'required', message: 'Please search and select your occupation.' },
      {
        type: 'custom',
        name: 'selectedOccupation',
        message: 'Please search and select your occupation.',
        validatorFn: selectedAutocompleteCodeValidator('occupationCode'),
      },
    ],
    metadata: {
      autocompleteConfig: {
        endpoint: 'occupation',
        codeField: 'occupationCode',
        descriptionField: 'occupationDescription',
      },
    },
  },
  {
    type: 'autocomplete',
    label: 'Industry',
    name: 'industryDescription',
    validators: [
      { type: 'required', message: 'Please search and select your industry.' },
      {
        type: 'custom',
        name: 'selectedIndustry',
        message: 'Please search and select your industry.',
        validatorFn: selectedAutocompleteCodeValidator('industryCode'),
      },
    ],
    metadata: {
      autocompleteConfig: {
        endpoint: 'industry',
        codeField: 'industryCode',
        descriptionField: 'industryDescription',
      },
    },
  },
  hiddenField('occupationCode', 'Occupation code'),
  hiddenField('industryCode', 'Industry code'),
];

const PARTTIME_SEARCH_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'autocomplete',
    label: 'Occupation',
    name: 'ptOccupationDescription',
    validators: [
      { type: 'required', message: 'Please search and select your occupation.' },
      {
        type: 'custom',
        name: 'selectedPtOccupation',
        message: 'Please search and select your occupation.',
        validatorFn: selectedAutocompleteCodeValidator('ptOccupationCode'),
      },
    ],
    metadata: {
      autocompleteConfig: {
        endpoint: 'occupation',
        codeField: 'ptOccupationCode',
        descriptionField: 'ptOccupationDescription',
      },
    },
  },
  {
    type: 'autocomplete',
    label: 'Industry',
    name: 'ptIndustryDescription',
    validators: [
      { type: 'required', message: 'Please search and select your industry.' },
      {
        type: 'custom',
        name: 'selectedPtIndustry',
        message: 'Please search and select your industry.',
        validatorFn: selectedAutocompleteCodeValidator('ptIndustryCode'),
      },
    ],
    metadata: {
      autocompleteConfig: {
        endpoint: 'industry',
        codeField: 'ptIndustryCode',
        descriptionField: 'ptIndustryDescription',
      },
    },
  },
  hiddenField('ptOccupationCode', 'Occupation code'),
  hiddenField('ptIndustryCode', 'Industry code'),
];

type OccupationValues = Record<string, unknown>;

@Component({
  selector: 'app-occupation-section',
  imports: [SignalFormComponent],
  templateUrl: './occupation-section.component.html',
})
export class OccupationSectionComponent {
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();
  readonly sectionId = input.required<string>();

  private readonly journeyState = inject(JourneyStateService);
  private readonly occupationService = inject(OccupationSearchService);
  private readonly forms = viewChildren(SignalFormComponent);
  private readonly fulltimeDetailVersion = signal(0);
  private readonly parttimeDetailVersion = signal(0);

  readonly fulltimeStatusFields = computed<readonly FormFieldConfig[]>(() => [
    createStatusField(
      'employmentStatus',
      this.moduleCode() === 'GV'
        ? [...EMPLOYMENT_STATUS_OPTIONS, ...GV_EXTRA_OPTION]
        : EMPLOYMENT_STATUS_OPTIONS,
      'Please select your employment status.',
    ),
  ]);

  readonly parttimeStatusFields = computed<readonly FormFieldConfig[]>(() => [
    createStatusField(
      'ptEmploymentStatus',
      this.moduleCode() === 'GV'
        ? [...EMPLOYMENT_STATUS_OPTIONS, ...GV_EXTRA_OPTION]
        : EMPLOYMENT_STATUS_OPTIONS,
      'Please select employment status.',
    ),
  ]);

  readonly fulltimeFteFields = FULLTIME_FTE_FIELDS;
  readonly fulltimeSearchFields = FULLTIME_SEARCH_FIELDS;
  readonly parttimeQuestionFields = PARTTIME_QUESTION_FIELDS;
  readonly parttimeFteFields = PARTTIME_FTE_FIELDS;
  readonly parttimeSearchFields = PARTTIME_SEARCH_FIELDS;

  private readonly storedValues = computed(() =>
    this.journeyState.sectionAnswers(this.moduleCode(), this.stepName(), this.sectionId()),
  );

  readonly employmentStatus = computed(() => asString(this.storedValues()['employmentStatus']));

  readonly mode = computed<'auto' | 'fte' | 'search' | 'none'>(() => {
    const status = this.employmentStatus();
    if (!status) return 'none';
    if (status in AUTO_SET_STATUSES) return 'auto';
    if (status === 'FTE') return 'fte';
    if (SEARCH_STATUSES.has(status)) return 'search';
    return 'none';
  });

  readonly occupationCode = computed(() => asString(this.storedValues()['occupationCode']));
  readonly occupationDescription = computed(
    () => asString(this.storedValues()['occupationDescription']),
  );
  readonly industryCode = computed(() => asString(this.storedValues()['industryCode']));
  readonly industryDescription = computed(
    () => asString(this.storedValues()['industryDescription']),
  );

  // Parttime
  readonly hasParttime = computed(() => asString(this.storedValues()['hasParttime']));
  readonly ptEmploymentStatus = computed(() => asString(this.storedValues()['ptEmploymentStatus']));

  readonly ptMode = computed<'auto' | 'fte' | 'search' | 'none'>(() => {
    const status = this.ptEmploymentStatus();
    if (!status) return 'none';
    if (status in AUTO_SET_STATUSES) return 'auto';
    if (status === 'FTE') return 'fte';
    if (SEARCH_STATUSES.has(status)) return 'search';
    return 'none';
  });

  readonly ptOccupationCode = computed(() => asString(this.storedValues()['ptOccupationCode']));
  readonly ptOccupationDescription = computed(
    () => asString(this.storedValues()['ptOccupationDescription']),
  );
  readonly ptIndustryCode = computed(() => asString(this.storedValues()['ptIndustryCode']));
  readonly ptIndustryDescription = computed(
    () => asString(this.storedValues()['ptIndustryDescription']),
  );

  /** Whether the fulltime occupation is complete enough to ask about parttime. */
  readonly fulltimeComplete = computed(() => {
    const status = this.employmentStatus();
    if (!status) return false;
    if (status in AUTO_SET_STATUSES) return true;
    if (status === 'FTE') return !!this.occupationCode();
    return !!this.occupationCode() && !!this.industryCode();
  });

  readonly showParttimeQuestion = computed(() => this.fulltimeComplete());
  readonly showParttimeInputs = computed(() => this.hasParttime() === 'yes');

  readonly fulltimeStatusInitialValue = computed(() => ({
    employmentStatus: this.employmentStatus(),
  }));

  readonly fulltimeFteInitialValue = computed(() => ({
    occupationCode: this.occupationCode(),
  }));

  readonly fulltimeSearchInitialValue = computed(() => ({
    occupationCode: this.occupationCode(),
    occupationDescription: this.occupationDescription(),
    industryCode: this.industryCode(),
    industryDescription: this.industryDescription(),
  }));

  readonly parttimeQuestionInitialValue = computed(() => ({
    hasParttime: this.hasParttime(),
  }));

  readonly parttimeStatusInitialValue = computed(() => ({
    ptEmploymentStatus: this.ptEmploymentStatus(),
  }));

  readonly parttimeFteInitialValue = computed(() => ({
    ptOccupationCode: this.ptOccupationCode(),
  }));

  readonly parttimeSearchInitialValue = computed(() => ({
    ptOccupationCode: this.ptOccupationCode(),
    ptOccupationDescription: this.ptOccupationDescription(),
    ptIndustryCode: this.ptIndustryCode(),
    ptIndustryDescription: this.ptIndustryDescription(),
  }));

  readonly fulltimeDetailRenderKeys = computed(() => [this.fulltimeDetailVersion()]);
  readonly parttimeDetailRenderKeys = computed(() => [this.parttimeDetailVersion()]);

  constructor() {
    effect(() => {
      const values = this.storedValues();
      const occCode = asString(values['occupationCode']);
      const occDesc = asString(values['occupationDescription']);
      const indCode = asString(values['industryCode']);
      const indDesc = asString(values['industryDescription']);
      const status = asString(values['employmentStatus']);

      if (occCode && !occDesc && SEARCH_STATUSES.has(status)) {
        void this.hydrateDescription('occupation', occCode);
      }
      if (indCode && !indDesc && SEARCH_STATUSES.has(status)) {
        void this.hydrateDescription('industry', indCode);
      }

      const ptOccCode = asString(values['ptOccupationCode']);
      const ptOccDesc = asString(values['ptOccupationDescription']);
      const ptIndCode = asString(values['ptIndustryCode']);
      const ptIndDesc = asString(values['ptIndustryDescription']);
      const ptStatus = asString(values['ptEmploymentStatus']);

      if (ptOccCode && !ptOccDesc && SEARCH_STATUSES.has(ptStatus)) {
        void this.hydrateDescription('occupation', ptOccCode, 'pt');
      }
      if (ptIndCode && !ptIndDesc && SEARCH_STATUSES.has(ptStatus)) {
        void this.hydrateDescription('industry', ptIndCode, 'pt');
      }
    });
  }

  onFulltimeStatusChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const nextStatus = asString(value['employmentStatus']);

    if (nextStatus === asString(current['employmentStatus'])) {
      return;
    }

    const update: OccupationValues = { ...current, employmentStatus: nextStatus };
    resetOccupationFields(update);
    applyStatusDefaults(update, nextStatus);
    this.clearParttime(update);
    this.store(update);
  }

  onFulltimeFteChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const code = asString(value['occupationCode']);
    const description = optionLabelFor(FTE_OCCUPATION_OPTIONS, code);

    if (
      code === asString(current['occupationCode']) &&
      description === asString(current['occupationDescription'])
    ) {
      return;
    }

    const update: OccupationValues = {
      ...current,
      occupationCode: code,
      occupationDescription: description,
      industryCode: '186',
      industryDescription: '',
    };
    this.clearParttime(update);
    this.store(update);
  }

  onFulltimeSearchChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const update: OccupationValues = {
      ...current,
      occupationCode: asString(value['occupationCode']),
      occupationDescription: asString(value['occupationDescription']),
      industryCode: asString(value['industryCode']),
      industryDescription: asString(value['industryDescription']),
    };

    if (sameValues(current, update, [
      'occupationCode',
      'occupationDescription',
      'industryCode',
      'industryDescription',
    ])) {
      return;
    }

    this.clearParttime(update);
    this.store(update);
  }

  onParttimeQuestionChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const hasParttime = asString(value['hasParttime']);

    if (hasParttime === asString(current['hasParttime'])) {
      return;
    }

    const update: OccupationValues = { ...current, hasParttime };
    if (hasParttime !== 'yes') {
      this.stripParttimeFields(update);
    }
    this.store(update);
  }

  onParttimeStatusChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const nextStatus = asString(value['ptEmploymentStatus']);

    if (nextStatus === asString(current['ptEmploymentStatus'])) {
      return;
    }

    const update: OccupationValues = { ...current, ptEmploymentStatus: nextStatus };
    resetOccupationFields(update, 'pt');
    applyStatusDefaults(update, nextStatus, 'pt');
    this.store(update);
  }

  onParttimeFteChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const code = asString(value['ptOccupationCode']);
    const description = optionLabelFor(FTE_OCCUPATION_OPTIONS, code);

    if (
      code === asString(current['ptOccupationCode']) &&
      description === asString(current['ptOccupationDescription'])
    ) {
      return;
    }

    this.store({
      ...current,
      ptOccupationCode: code,
      ptOccupationDescription: description,
      ptIndustryCode: '186',
      ptIndustryDescription: '',
    });
  }

  onParttimeSearchChanged(value: Record<string, unknown>): void {
    const current = this.storedValues();
    const update: OccupationValues = {
      ...current,
      ptOccupationCode: asString(value['ptOccupationCode']),
      ptOccupationDescription: asString(value['ptOccupationDescription']),
      ptIndustryCode: asString(value['ptIndustryCode']),
      ptIndustryDescription: asString(value['ptIndustryDescription']),
    };

    if (sameValues(current, update, [
      'ptOccupationCode',
      'ptOccupationDescription',
      'ptIndustryCode',
      'ptIndustryDescription',
    ])) {
      return;
    }

    this.store(update);
  }

  collect(): { valid: boolean; values: Record<string, unknown> } {
    const valid = this.forms().every(form => form.collect().valid);
    return { valid, values: { ...this.storedValues() } };
  }

  private clearParttime(values: OccupationValues): void {
    if (asString(this.storedValues()['hasParttime']) === 'yes') {
      this.stripParttimeFields(values);
      values['hasParttime'] = '';
    }
  }

  private stripParttimeFields(values: OccupationValues): void {
    values['ptEmploymentStatus'] = '';
    values['ptOccupationCode'] = '';
    values['ptOccupationDescription'] = '';
    values['ptIndustryCode'] = '';
    values['ptIndustryDescription'] = '';
  }

  private store(values: OccupationValues): void {
    this.journeyState.setSectionAnswers(
      this.moduleCode(),
      this.stepName(),
      this.sectionId(),
      values,
    );
  }

  private async hydrateDescription(
    type: 'occupation' | 'industry',
    code: string,
    prefix = '',
  ): Promise<void> {
    try {
      const description = await firstValueFrom(
        type === 'occupation'
          ? this.occupationService.getOccupationByCode(code)
          : this.occupationService.getIndustryByCode(code),
      );

      if (description) {
        const current = { ...this.storedValues() };
        const key = prefix
          ? prefix === 'pt'
            ? type === 'occupation'
              ? 'ptOccupationDescription'
              : 'ptIndustryDescription'
            : ''
          : type === 'occupation'
            ? 'occupationDescription'
            : 'industryDescription';

        if (key && codeMatches(current, type, code, prefix)) {
          current[key] = description;
          this.store(current);
          this.bumpDetailVersion(prefix);
        }
      }
    } catch {
      // Fallback: the code is shown as-is; do not block loading.
      console.warn(`Failed to hydrate ${prefix}${type} description for code "${code}"`);
    }
  }

  private bumpDetailVersion(prefix: string): void {
    if (prefix === 'pt') {
      this.parttimeDetailVersion.update(version => version + 1);
      return;
    }

    this.fulltimeDetailVersion.update(version => version + 1);
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function hiddenField(name: string, label: string): FormFieldConfig {
  return {
    type: 'text',
    label,
    name,
    visibleWhen: [{ field: name, operator: 'equals', value: HIDDEN_FIELD_VALUE }],
  };
}

function createStatusField(
  name: string,
  options: readonly FormFieldOption[],
  message: string,
): FormFieldConfig {
  return {
    type: 'select',
    label: 'Employment status',
    name,
    validators: [{ type: 'required', message }],
    options,
  };
}

function optionLabelFor(options: readonly FormFieldOption[], code: string): string {
  return options.find(option => option.value === code)?.label ?? '';
}

function resetOccupationFields(values: OccupationValues, prefix = ''): void {
  values[withPrefix(prefix, 'occupationCode')] = '';
  values[withPrefix(prefix, 'occupationDescription')] = '';
  values[withPrefix(prefix, 'industryCode')] = '';
  values[withPrefix(prefix, 'industryDescription')] = '';
}

function applyStatusDefaults(values: OccupationValues, status: string, prefix = ''): void {
  if (status in AUTO_SET_STATUSES) {
    const auto = AUTO_SET_STATUSES[status];
    values[withPrefix(prefix, 'occupationCode')] = auto.occupationCode;
    values[withPrefix(prefix, 'industryCode')] = auto.industryCode;
    return;
  }

  if (status === 'FTE') {
    values[withPrefix(prefix, 'industryCode')] = '186';
  }
}

function withPrefix(prefix: string, field: string): string {
  return prefix === 'pt' ? `pt${field.charAt(0).toUpperCase()}${field.slice(1)}` : field;
}

function sameValues(
  current: Record<string, unknown>,
  next: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.every(key => asString(current[key]) === asString(next[key]));
}

function codeMatches(
  values: Record<string, unknown>,
  type: 'occupation' | 'industry',
  code: string,
  prefix: string,
): boolean {
  const key = prefix
    ? prefix === 'pt'
      ? type === 'occupation'
        ? 'ptOccupationCode'
        : 'ptIndustryCode'
      : ''
    : type === 'occupation'
      ? 'occupationCode'
      : 'industryCode';

  return key ? asString(values[key]) === code : false;
}

function selectedAutocompleteCodeValidator(codeField: string) {
  return (control: { value: unknown; parent: { get: (name: string) => { value: unknown } | null } | null }) => {
    const description = asString(control.value).trim();
    if (!description) {
      return null;
    }

    return asString(control.parent?.get(codeField)?.value).trim()
      ? null
      : { selectedAutocompleteCode: true };
  };
}
