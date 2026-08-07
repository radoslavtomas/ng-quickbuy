import type { FormFieldOption } from '../../../../../core/models/form-field.model';

/**
 * Employment statuses offered to every person on a policy.
 *
 * Single source of truth: the proposer, an additional driver and a joint proposer
 * are asked the same question, and a copy that drifts is how one of them ends up
 * unable to describe their job.
 */
export const EMPLOYMENT_STATUS_OPTIONS: readonly FormFieldOption[] = [
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
];

/**
 * Offered on van policies only, where the policyholder may be a business.
 *
 * A limited company is not a person, so this is only ever offered to a proposer,
 * never to an additional driver.
 */
export const LIMITED_COMPANY_OPTION: FormFieldOption = {
  label: 'Limited Company',
  value: 'L',
};

/** Status where the occupation is chosen from a fixed list of student roles. */
export const FTE_STATUS = 'FTE';

/** Industry the insurer expects when no real industry applies. */
export const DEFAULT_INDUSTRY_CODE = '186';

/**
 * Statuses that answer the occupation question by themselves.
 *
 * A retired customer has no occupation to search for, so asking would be a
 * question with no useful answer; the insurer's codes for the status say it all.
 */
export const SELF_DESCRIBING_STATUSES: Readonly<
  Record<string, { readonly occupationCode: string; readonly industryCode: string }>
> = {
  R: { occupationCode: 'R09', industryCode: '947' },
  U: { occupationCode: 'U03', industryCode: DEFAULT_INDUSTRY_CODE },
  H: { occupationCode: 'H09', industryCode: DEFAULT_INDUSTRY_CODE },
};

/** Statuses where the customer searches for their occupation and industry. */
export const SEARCHABLE_STATUSES: readonly string[] = ['E', 'SE', 'D', 'P', 'G', 'O', 'L'];

export const FTE_OCCUPATION_OPTIONS: readonly FormFieldOption[] = [
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
];

/** True when the status is one the insurer's codes already describe. */
export function isSelfDescribingStatus(status: string): boolean {
  return Object.prototype.hasOwnProperty.call(SELF_DESCRIBING_STATUSES, status);
}
