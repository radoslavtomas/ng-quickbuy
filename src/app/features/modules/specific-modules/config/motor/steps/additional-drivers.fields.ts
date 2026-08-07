import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import { adultOnlyValidator, validDateValidator } from '../../../../../../core/validators/form-validators';

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: 'Employee or staff', value: 'E' },
  { label: 'Self-employed', value: 'SE' },
  { label: 'Retired', value: 'R' },
  { label: 'Director', value: 'D' },
  { label: 'Proprietor or partner', value: 'P' },
  { label: 'Unemployed', value: 'U' },
  { label: 'House person', value: 'H' },
  { label: 'Full-time education', value: 'FTE' },
  { label: 'Government', value: 'G' },
  { label: 'Other', value: 'O' },
] as const;

const FTE_OCCUPATION_OPTIONS = [
  { label: 'Mature Student - Living Away', value: 'S51' },
  { label: 'Mature Student Living At Home', value: 'S50' },
  { label: 'Medical Student - Living Away', value: 'S49' },
  { label: 'Medical Student Living At Home', value: 'S48' },
  { label: 'Post Grad Student Living Away', value: '19D' },
  { label: 'Post Grad Student Living Home', value: '18D' },
  { label: 'School Student', value: '74C' },
  { label: 'Student - Living At Home', value: 'S44' },
  { label: 'Student - Living Away', value: 'S45' },
  { label: 'Student Counsellor', value: '85A' },
  { label: 'Student Nurse - Living At Home', value: 'S52' },
  { label: 'Student Nurse - Living Away', value: 'S53' },
  { label: 'Student Teacher - Living Away', value: 'S47' },
  { label: 'Student Teacher Living At Home', value: 'S46' },
  { label: 'Undergrad Student Living Away', value: '49D' },
  { label: 'Undergrad Student Living Home', value: '48D' },
] as const;

export const MOTOR_ADDITIONAL_DRIVERS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Any additional drivers?',
    name: 'hasAdditionalDrivers',
    validators: [{ type: 'required' }],
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
  {
    type: 'select',
    label: 'Main driver no-claims bonus',
    name: 'noClaimsBonusYears',
    validators: [{ type: 'required' }],
    options: [
      { label: '0 years', value: '0' },
      { label: '1 year', value: '1' },
      { label: '2 years', value: '2' },
      { label: '3 years', value: '3' },
      { label: '4 years', value: '4' },
      { label: '5+ years', value: '5_plus' },
    ],
  },
];

/**
 * Questions asked of each additional driver.
 *
 * The same field names the proposer uses, because the wire format files them under a
 * slot rather than renaming them: `forenames` becomes `driver-2-name-forenames` for
 * the second driver and `proposer-name-forenames` for the customer.
 */
export const MOTOR_ADDITIONAL_DRIVER_ITEM_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'First name',
    name: 'forenames',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'off', placeholder: 'Jordan' },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'surname',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'off', placeholder: 'Taylor' },
  },
  {
    type: 'date',
    label: 'Date of birth',
    name: 'dateOfBirth',
    validators: [
      { type: 'required' },
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
      {
        type: 'custom',
        name: 'adultOnly',
        message: 'A driver must be at least 18 years old.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    metadata: { autocomplete: 'off' },
  },
  {
    type: 'select',
    label: 'Employment status',
    name: 'employmentStatus',
    validators: [{ type: 'required' }],
    options: [...EMPLOYMENT_STATUS_OPTIONS],
    metadata: {
      autoValues: {
        R: { occupationCode: 'R09', industryCode: '947' },
        U: { occupationCode: 'U03', industryCode: '186' },
        H: { occupationCode: 'H09', industryCode: '186' },
        FTE: { industryCode: '186', occupationCode: '' },
      },
    },
  },
  {
    type: 'select',
    label: 'Occupation',
    name: 'occupationSelect',
    validators: [{ type: 'required' }],
    options: [...FTE_OCCUPATION_OPTIONS],
    visibleWhen: [{ field: 'employmentStatus', operator: 'equals', value: 'FTE' }],
    enabledWhen: [{ field: 'employmentStatus', operator: 'equals', value: 'FTE' }],
  },
  {
    type: 'autocomplete',
    label: 'Occupation',
    name: 'occupationDescription',
    validators: [{ type: 'required' }],
    visibleWhen: [{ field: 'employmentStatus', operator: 'in', value: ['E', 'SE', 'D', 'P', 'G', 'O'] }],
    enabledWhen: [{ field: 'employmentStatus', operator: 'in', value: ['E', 'SE', 'D', 'P', 'G', 'O'] }],
    metadata: {
      autocompleteConfig: { endpoint: 'occupation', codeField: 'occupationCode', descriptionField: 'occupationDescription' },
    },
  },
  {
    type: 'autocomplete',
    label: 'Industry',
    name: 'industryDescription',
    validators: [{ type: 'required' }],
    visibleWhen: [{ field: 'employmentStatus', operator: 'in', value: ['E', 'SE', 'D', 'P', 'G', 'O'] }],
    enabledWhen: [{ field: 'employmentStatus', operator: 'in', value: ['E', 'SE', 'D', 'P', 'G', 'O'] }],
    metadata: {
      autocompleteConfig: { endpoint: 'industry', codeField: 'industryCode', descriptionField: 'industryDescription' },
    },
  },
  {
    type: 'text',
    label: 'Occupation code',
    name: 'occupationCode',
    visibleWhen: [{ field: 'occupationCode', operator: 'equals', value: '__never__' }],
  },
  {
    type: 'text',
    label: 'Industry code',
    name: 'industryCode',
    visibleWhen: [{ field: 'industryCode', operator: 'equals', value: '__never__' }],
  },
];

