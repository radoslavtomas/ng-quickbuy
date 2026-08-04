import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api.config';
import { AddressLookupResponse, AddressLookupService } from './address-lookup.service';

const TEST_API_BASE_URL = 'https://api.test.local';

describe('AddressLookupService', () => {
  let service: AddressLookupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: TEST_API_BASE_URL }],
    });

    service = TestBed.inject(AddressLookupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('builds the endpoint from the configured API base URL', () => {
    service.lookupByPostcode({ postcode: 'M16 0PQ', numberOrNameForSearch: '17' }).subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/miscellaneous/address/get/bypostcode`,
    );

    request.flush(buildLookupResponse());
  });

  it('sends lookup request with normalized postcode and query params', () => {
    const mockResponse = buildLookupResponse();
    let result: AddressLookupResponse | undefined;

    service.lookupByPostcode({ postcode: ' m16   0pq ', numberOrNameForSearch: ' 17 ' }).subscribe((res) => {
      result = res;
    });

    const request = httpMock.expectOne((req) => req.url.includes('/api/miscellaneous/address/get/bypostcode'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('numberorname')).toBe('17');
    expect(request.request.params.get('postcode')).toBe('M16 0PQ');

    request.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('throws a user-friendly error when postcode is missing', () => {
    let thrown: Error | undefined;

    service.lookupByPostcode({ postcode: ' ', numberOrNameForSearch: '17' }).subscribe({
      next: () => {
        throw new Error('Expected lookupByPostcode to throw for empty postcode.');
      },
      error: (err) => {
        thrown = err as Error;
      },
    });

    expect(thrown?.message).toBe('Please enter house number/name and postcode to search.');
  });

  it('maps API response to form value shape with fallback street mapping', () => {
    const response = buildLookupResponse({
      address: {
        addressline1: '',
        addressline2: 'Apartment 4',
        addressline3: 'District',
        addressline4: 'Manchester',
        numberorname: 'The Oaks',
        postcode: 'm16 0pq',
      },
      price_paid: {
        cdl_code: 'A',
        county: 'Greater Manchester',
        date_of_transfer: '2020-01-01',
        district: 'Trafford',
        duq_702_code: 'X',
        duration: 'freehold',
        locality: 'Old Trafford',
        old: '',
        paon: '',
        postcode: 'M16 0PQ',
        ppd_category: 'A',
        price: 250000,
        property_type: 'D',
        record_status: 'A',
        saon: '',
        street: 'Talbot Road',
        town_or_city: 'Manchester',
      },
    });

    expect(service.mapToFormValue(response)).toEqual({
      postcode: 'M16 0PQ',
      addressLine1: 'Talbot Road',
      houseNameNumber: 'The Oaks',
      addressLine2: 'Apartment 4',
      addressLine3: 'District',
      addressLine4: 'Manchester',
    });
  });
});

function buildLookupResponse(overrides?: Partial<AddressLookupResponse>): AddressLookupResponse {
  const base: AddressLookupResponse = {
    parameters: {
      numberorname_forsearch: '17',
      numberorname: '17',
      postcode: 'M16 0PQ',
    },
    address: {
      addressline1: 'Talbot Road',
      addressline2: '',
      addressline3: '',
      addressline4: 'Manchester',
      numberorname: '17',
      postcode: 'M16 0PQ',
    },
    location: {
      latitude: 53.46,
      longitude: -2.29,
    },
    price_paid: {
      cdl_code: 'A',
      county: 'Greater Manchester',
      date_of_transfer: '2020-01-01',
      district: 'Trafford',
      duq_702_code: 'X',
      duration: 'freehold',
      locality: 'Old Trafford',
      old: '',
      paon: '',
      postcode: 'M16 0PQ',
      ppd_category: 'A',
      price: 250000,
      property_type: 'D',
      record_status: 'A',
      saon: '',
      street: 'Talbot Road',
      town_or_city: 'Manchester',
    },
  };

  return {
    ...base,
    ...overrides,
    parameters: { ...base.parameters, ...(overrides?.parameters ?? {}) },
    address: { ...base.address, ...(overrides?.address ?? {}) },
    location: { ...base.location, ...(overrides?.location ?? {}) },
    price_paid: { ...base.price_paid, ...(overrides?.price_paid ?? {}) },
  };
}