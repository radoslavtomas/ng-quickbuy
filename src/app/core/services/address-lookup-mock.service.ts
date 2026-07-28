import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface AddressLookupRequest {
  postcode: string;
  numberOrNameForSearch: string;
}

export interface AddressLookupResponse {
  parameters: {
    numberorname_forsearch: string;
    numberorname: string;
    postcode: string;
  };
  address: {
    addressline1: string;
    addressline2: string;
    addressline3: string;
    addressline4: string;
    numberorname: string;
    postcode: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  price_paid: {
    cdl_code: string;
    county: string;
    date_of_transfer: string;
    district: string;
    duq_702_code: string;
    duration: string;
    locality: string;
    old: string;
    paon: string;
    postcode: string;
    ppd_category: string;
    price: number;
    property_type: string;
    record_status: string;
    saon: string;
    street: string;
    town_or_city: string;
  };
}

export interface AddressLookupMatch {
  postcode: string;
  addressLine1: string;
  houseNameNumber: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
}

@Injectable({ providedIn: 'root' })
export class AddressLookupMockService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://quickbuyv3-dev.quotelinedirect.co.uk/api/miscellaneous/address/get/bypostcode';

  lookupByPostcode(request: AddressLookupRequest): Observable<AddressLookupResponse> {
    const postcode = this.normalizePostcode(request.postcode);
    const numberOrName = request.numberOrNameForSearch.trim();

    if (!postcode || !numberOrName) {
      return throwError(() => new Error('Please enter house number/name and postcode to search.'));
    }

    const params = new HttpParams().set('numberorname', numberOrName).set('postcode', postcode);

    return this.http.get<AddressLookupResponse>(this.endpoint, { params });
  }

  mapToFormValue(response: AddressLookupResponse): AddressLookupMatch {
    const addressLine1 = (response.address.addressline1 || response.price_paid.street || '').trim();
    const addressLine2 = (response.address.addressline2 || '').trim();
    const addressLine3 = (response.address.addressline3 || '').trim();
    const addressLine4 = (response.address.addressline4 || '').trim();

    return {
      postcode: this.normalizePostcode(response.address.postcode),
      addressLine1,
      houseNameNumber: (response.address.numberorname || response.parameters.numberorname || '').trim(),
      addressLine2,
      addressLine3,
      addressLine4,
    };
  }

  private normalizePostcode(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  }
}
