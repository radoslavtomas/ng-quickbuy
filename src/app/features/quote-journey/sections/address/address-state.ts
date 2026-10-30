import { asString } from '../../../../core/utils/string-value';

export interface AddressSearchCriteria {
  postcode: string;
  numberOrName: string;
}

export function hasAddressState(value: {
  addressLine1?: unknown;
  postcode?: unknown;
  houseNameNumber?: unknown;
}): boolean {
  return Boolean(asString(value['addressLine1']) && asString(value['postcode']));
}
