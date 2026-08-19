import { matchesConditions } from '../../../../../core/forms/field-conditions';
import { autocompleteCode } from '../../../../../core/models/autocomplete-option.model';
import type {
  FieldCondition,
  FormFieldConfig,
  FormFieldOption,
} from '../../../../../core/models/form-field.model';
import {
  DEFAULT_INDUSTRY_CODE,
  EMPLOYMENT_STATUS_OPTIONS,
  FTE_OCCUPATION_OPTIONS,
  FTE_STATUS,
  LIMITED_COMPANY_OPTION,
  SEARCHABLE_STATUSES,
  SELF_DESCRIBING_STATUSES,
  isSelfDescribingStatus,
} from '../lookups/employment';
import { asString } from './common';

/**
 * Whose occupation is being described, and under what circumstances.
 *
 * The proposer, an additional driver and a joint proposer all answer the same
 * questions, so they share one definition rather than three that drift apart. Only
 * the surrounding conditions differ.
 */
export interface OccupationFieldsOptions {
  /**
   * Offer "Limited Company" as a status. Van policies may be held by a business;
   * an additional driver is always a person, so this stays off for them.
   */
  readonly includeLimitedCompany?: boolean;
  /** Also ask whether this person has a second job. */
  readonly includeSecondJob?: boolean;
  /**
   * Conditions that must hold before any of these questions apply, such as the
   * joint proposer having been declared. Combined with each field's own condition.
   */
  readonly gate?: readonly FieldCondition[];
}

/** Field names one person's occupation answers occupy, for a given job. */
interface JobFieldNames {
  readonly status: string;
  readonly fteOccupation: string;
  readonly occupation: string;
  readonly industry: string;
  readonly occupationCode: string;
  readonly industryCode: string;
}

const MAIN_JOB: JobFieldNames = {
  status: 'employmentStatus',
  fteOccupation: 'occupationFte',
  occupation: 'occupation',
  industry: 'industry',
  occupationCode: 'occupationCode',
  industryCode: 'industryCode',
};

const SECOND_JOB: JobFieldNames = {
  status: 'ptEmploymentStatus',
  fteOccupation: 'ptOccupationFte',
  occupation: 'ptOccupation',
  industry: 'ptIndustry',
  occupationCode: 'ptOccupationCode',
  industryCode: 'ptIndustryCode',
};

/** Name of the question that opens the second-job block. */
export const SECOND_JOB_FIELD = 'hasParttime';

/**
 * Every field needed to capture one person's occupation.
 *
 * The customer answers in whichever way suits their status — a search, a dropdown
 * of student roles, or nothing at all if the status speaks for itself — and the two
 * codes the insurer wants are derived from those answers rather than stored
 * alongside them. That is what makes a change of status safe: the codes are
 * recomputed, so a retired customer who used to be a plumber cannot be quoted as
 * one.
 */
export function createOccupationFields(
  options: OccupationFieldsOptions = {},
): readonly FormFieldConfig[] {
  const gate = options.gate ?? [];
  const statusOptions = options.includeLimitedCompany
    ? [...EMPLOYMENT_STATUS_OPTIONS, LIMITED_COMPANY_OPTION]
    : EMPLOYMENT_STATUS_OPTIONS;

  const fields = [...jobFields(MAIN_JOB, statusOptions, gate, '')];

  if (options.includeSecondJob) {
    const secondJobGate: readonly FieldCondition[] = [
      ...gate,
      { field: SECOND_JOB_FIELD, operator: 'equals', value: 'yes' },
    ];

    fields.push(
      {
        type: 'radio',
        label: 'Do you have a second occupation?',
        name: SECOND_JOB_FIELD,
        validators: [{ type: 'required', message: 'Please tell us about any second occupation.' }],
        options: [
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ],
        metadata: { radioLayout: 'row' },
        // Only worth asking once we know what the main job is.
        visibleWhen: [...gate, { field: MAIN_JOB.status, operator: 'truthy' }],
      },
      ...jobFields(SECOND_JOB, statusOptions, secondJobGate, 'Second job '),
    );
  }

  return fields;
}

function jobFields(
  names: JobFieldNames,
  statusOptions: readonly FormFieldOption[],
  gate: readonly FieldCondition[],
  labelPrefix: string,
): readonly FormFieldConfig[] {
  const whenSearchable: readonly FieldCondition[] = [
    ...gate,
    { field: names.status, operator: 'in', value: [...SEARCHABLE_STATUSES] },
  ];

  const whenStudying: readonly FieldCondition[] = [
    ...gate,
    { field: names.status, operator: 'equals', value: FTE_STATUS },
  ];

  const isActive = (values: Readonly<Record<string, unknown>>): boolean =>
    matchesConditions(gate, values);

  return [
    {
      type: 'select',
      label: labelFor(labelPrefix, 'Employment status'),
      name: names.status,
      validators: [{ type: 'required', message: 'Please select an employment status.' }],
      options: statusOptions,
      visibleWhen: gate.length > 0 ? gate : undefined,
    },
    {
      type: 'select',
      label: labelFor(labelPrefix, 'Occupation'),
      name: names.fteOccupation,
      validators: [{ type: 'required', message: 'Please select an occupation.' }],
      options: FTE_OCCUPATION_OPTIONS,
      visibleWhen: whenStudying,
    },
    {
      type: 'autocomplete',
      label: labelFor(labelPrefix, 'Occupation'),
      name: names.occupation,
      validators: [{ type: 'required', message: 'Please search for and choose an occupation.' }],
      visibleWhen: whenSearchable,
      metadata: { autocompleteConfig: { endpoint: 'occupation' } },
    },
    {
      type: 'autocomplete',
      label: labelFor(labelPrefix, 'Industry'),
      name: names.industry,
      validators: [{ type: 'required', message: 'Please search for and choose an industry.' }],
      visibleWhen: whenSearchable,
      metadata: { autocompleteConfig: { endpoint: 'industry' } },
    },
    {
      type: 'derived',
      label: labelFor(labelPrefix, 'Occupation code'),
      name: names.occupationCode,
      derived: {
        from: (values) => (isActive(values) ? occupationCodeFor(names, values) : ''),
        toAnswers: (value, values) => occupationAnswersFor(names, value, values),
      },
    },
    {
      type: 'derived',
      label: labelFor(labelPrefix, 'Industry code'),
      name: names.industryCode,
      derived: {
        from: (values) => (isActive(values) ? industryCodeFor(names, values) : ''),
        toAnswers: (value, values) => industryAnswersFor(names, value, values),
      },
    },
  ];
}

/**
 * Labels the second job's questions distinctly from the first job's.
 *
 * Two fields labelled "Occupation" on one page is a failure of the accessible-name
 * requirement as much as it is a confusing form, so the second set is prefixed and
 * the original wording is folded into the sentence.
 */
function labelFor(prefix: string, text: string): string {
  return prefix ? `${prefix}${text.charAt(0).toLowerCase()}${text.slice(1)}` : text;
}

function occupationCodeFor(
  names: JobFieldNames,
  values: Readonly<Record<string, unknown>>,
): string {
  const status = asString(values[names.status]);

  if (isSelfDescribingStatus(status)) {
    return SELF_DESCRIBING_STATUSES[status].occupationCode;
  }

  if (status === FTE_STATUS) {
    return asString(values[names.fteOccupation]);
  }

  return SEARCHABLE_STATUSES.includes(status) ? autocompleteCode(values[names.occupation]) : '';
}

function industryCodeFor(names: JobFieldNames, values: Readonly<Record<string, unknown>>): string {
  const status = asString(values[names.status]);

  if (isSelfDescribingStatus(status)) {
    return SELF_DESCRIBING_STATUSES[status].industryCode;
  }

  if (status === FTE_STATUS) {
    return DEFAULT_INDUSTRY_CODE;
  }

  return SEARCHABLE_STATUSES.includes(status) ? autocompleteCode(values[names.industry]) : '';
}

/**
 * Turns a recalled occupation code back into the answer that produced it.
 *
 * The description is left empty on purpose: the search control asks the backend
 * what the code means, so recall does not have to.
 */
function occupationAnswersFor(
  names: JobFieldNames,
  value: unknown,
  values: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const code = asString(value);
  const status = asString(values[names.status]);

  if (!code || isSelfDescribingStatus(status)) {
    return {};
  }

  return status === FTE_STATUS
    ? { [names.fteOccupation]: code }
    : { [names.occupation]: { code, description: '' } };
}

function industryAnswersFor(
  names: JobFieldNames,
  value: unknown,
  values: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const code = asString(value);
  const status = asString(values[names.status]);

  if (!code || isSelfDescribingStatus(status) || status === FTE_STATUS) {
    return {};
  }

  return { [names.industry]: { code, description: '' } };
}

/** Internal names the occupation questions occupy, for both jobs. */
export const OCCUPATION_FIELD_NAMES: readonly string[] = [
  ...Object.values(MAIN_JOB),
  SECOND_JOB_FIELD,
  ...Object.values(SECOND_JOB),
];
