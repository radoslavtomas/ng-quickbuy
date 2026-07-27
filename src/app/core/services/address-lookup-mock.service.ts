import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

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

const MOCK_LOOKUP_FIXTURES: Readonly<Record<string, Omit<AddressLookupResponse, 'parameters'>>> = {
  'M16 0PQ': {
    address: {
      addressline1: 'Talbot Road',
      addressline2: '',
      addressline3: 'Old Trafford',
      addressline4: 'MANCHESTER',
      numberorname: '17',
      postcode: 'M16 0PQ',
    },
    location: {
      latitude: 53.4632,
      longitude: -2.2913,
    },
    price_paid: {
      cdl_code: 'TnEnd-T',
      county: 'GREATER MANCHESTER',
      date_of_transfer: '2018-10-15 00:00',
      district: 'TRAFFORD',
      duq_702_code: '02',
      duration: 'F',
      locality: 'OLD TRAFFORD',
      old: 'N',
      paon: '17',
      postcode: 'M16 0PQ',
      ppd_category: 'A',
      price: 248000,
      property_type: 'T',
      record_status: 'A',
      saon: '',
      street: 'TALBOT ROAD',
      town_or_city: 'MANCHESTER',
    },
  },
  'M43 7GX': {
    address: {
      addressline1: '1 Greenheys',
      addressline2: 'Droylsden',
      addressline3: 'MANCHESTER',
      addressline4: '',
      numberorname: '1',
      postcode: 'M43 7GX',
    },
    location: {
      latitude: 53.48366,
      longitude: -2.146462,
    },
    price_paid: {
      cdl_code: 'Dtchd',
      county: 'GREATER MANCHESTER',
      date_of_transfer: '2007-02-02 00:00',
      district: 'TAMESIDE',
      duq_702_code: '02',
      duration: 'F',
      locality: 'DROYLSDEN',
      old: 'N',
      paon: '1',
      postcode: 'M43 7GX',
      ppd_category: 'A',
      price: 212000,
      property_type: 'D',
      record_status: 'A',
      saon: '',
      street: 'GREENHEYS',
      town_or_city: 'MANCHESTER',
    },
  },
};

@Injectable({ providedIn: 'root' })
export class AddressLookupMockService {
  lookupByPostcode(request: AddressLookupRequest): Observable<AddressLookupResponse> {
    const postcode = this.normalizePostcode(request.postcode);
    const numberOrName = request.numberOrNameForSearch.trim();

    if (!postcode || !numberOrName) {
      return throwError(() => new Error('Please enter postcode and address line 1 to search.'));
    }

    if (this.isExcludedPostcode(postcode)) {
      return throwError(
        () =>
          new Error(
            'We are unable to provide a quotation for postcodes located in Northern Ireland and the Channel Islands.',
          ),
      );
    }

    const fixture = MOCK_LOOKUP_FIXTURES[postcode] ?? this.buildFallbackFixture(postcode, numberOrName);

    return of({
      parameters: {
        numberorname_forsearch: numberOrName,
        numberorname: fixture.address.numberorname,
        postcode,
      },
      address: fixture.address,
      location: fixture.location,
      price_paid: fixture.price_paid,
    }).pipe(delay(450));
  }

  mapToFormValue(response: AddressLookupResponse): AddressLookupMatch {
    return {
      postcode: this.normalizePostcode(response.address.postcode),
      addressLine1: response.address.addressline1,
      houseNameNumber: response.address.numberorname,
      addressLine2: response.address.addressline2,
      addressLine3: response.address.addressline3,
      addressLine4: response.address.addressline4,
    };
  }

  private normalizePostcode(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  private isExcludedPostcode(postcode: string): boolean {
    return /^BT|^GY|^JE/i.test(postcode);
  }

  private buildFallbackFixture(postcode: string, numberOrName: string): Omit<AddressLookupResponse, 'parameters'> {
    return {
      address: {
        addressline1: numberOrName,
        addressline2: '',
        addressline3: 'MANCHESTER',
        addressline4: '',
        numberorname: numberOrName,
        postcode,
      },
      location: {
        latitude: 53.4808,
        longitude: -2.2426,
      },
      price_paid: {
        cdl_code: 'Unk',
        county: 'GREATER MANCHESTER',
        date_of_transfer: '2020-01-01 00:00',
        district: 'MANCHESTER',
        duq_702_code: '00',
        duration: 'F',
        locality: 'MANCHESTER',
        old: 'N',
        paon: numberOrName,
        postcode,
        ppd_category: 'A',
        price: 250000,
        property_type: 'U',
        record_status: 'A',
        saon: '',
        street: numberOrName.toUpperCase(),
        town_or_city: 'MANCHESTER',
      },
    };
  }
}
