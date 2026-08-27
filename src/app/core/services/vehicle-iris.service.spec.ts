import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import type { IrisMatch, IrisSearchResponse } from '../models/vehicle-search.model';
import {
  VehicleIrisService,
  matchesForYear,
  toDescendingYearOptions,
  toEditionOption,
  toSortedNameOptions,
} from './vehicle-iris.service';

const TEST_API_BASE_URL = 'https://api.test.local';

describe('VehicleIrisService', () => {
  let service: VehicleIrisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: TEST_API_BASE_URL }],
    });

    service = TestBed.inject(VehicleIrisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends the makes request with the IRIS module', () => {
    service.getMakes('GV').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/iris/get/makes`,
    );
    expect(request.request.params.get('module')).toBe('GV');

    request.flush({ Make: [] });
  });

  it('sends the models request with module and make', () => {
    service.getModels('PC', 'FORD').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/iris/get/models`,
    );
    expect(request.request.params.get('module')).toBe('PC');
    expect(request.request.params.get('make')).toBe('FORD');

    request.flush({ Model: [] });
  });

  it('sends the search request with module, make and model', () => {
    service.search('PC', 'FORD', 'ESCORT').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/iris/get/search`,
    );
    expect(request.request.params.get('module')).toBe('PC');
    expect(request.request.params.get('make')).toBe('FORD');
    expect(request.request.params.get('model')).toBe('ESCORT');

    request.flush({ years: [] });
  });

  it('reads matches from the GVMatch key for the GV catalogue', () => {
    const response: IrisSearchResponse = {
      GVMatch: [{ '@attributes': buildAttributes() }],
      years: [2015],
    };

    expect(service.matchesOf('GV', response)).toEqual(response.GVMatch);
  });

  it('reads matches from the PCMatch key for the PC catalogue', () => {
    const response: IrisSearchResponse = {
      PCMatch: [{ '@attributes': buildAttributes() }],
      years: [2015],
    };

    expect(service.matchesOf('PC', response)).toEqual(response.PCMatch);
  });

  it('returns an empty list when the expected match key is absent', () => {
    expect(service.matchesOf('GV', { years: [] })).toEqual([]);
  });

  it('shares one request across repeated searches for the same module/make/model', () => {
    let firstResult: IrisSearchResponse | undefined;
    let secondResult: IrisSearchResponse | undefined;

    service.searchCached('PC', 'FORD', 'ESCORT').subscribe((response) => (firstResult = response));
    service.searchCached('PC', 'FORD', 'ESCORT').subscribe((response) => (secondResult = response));

    // Two subscribers, but exactly one request: expectOne throws if there were two.
    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/iris/get/search`,
    );
    request.flush({ years: [2015] });

    expect(firstResult).toEqual({ years: [2015] });
    expect(secondResult).toEqual({ years: [2015] });
  });

  it('requests separately for a different module, make or model', () => {
    service.searchCached('PC', 'FORD', 'ESCORT').subscribe();
    service.searchCached('PC', 'FORD', 'FIESTA').subscribe();

    const requests = httpMock.match(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/iris/get/search`,
    );
    expect(requests).toHaveLength(2);
    requests.forEach((request) => request.flush({ years: [] }));
  });
});

describe('toSortedNameOptions', () => {
  it('sorts names alphabetically into label/value option pairs', () => {
    expect(toSortedNameOptions(['FORD', 'AUDI', 'BMW'])).toEqual([
      { label: 'AUDI', value: 'AUDI' },
      { label: 'BMW', value: 'BMW' },
      { label: 'FORD', value: 'FORD' },
    ]);
  });
});

describe('toDescendingYearOptions', () => {
  it('sorts years newest first', () => {
    expect(toDescendingYearOptions([1998, 2015, 2001])).toEqual([
      { label: '2015', value: '2015' },
      { label: '2001', value: '2001' },
      { label: '1998', value: '1998' },
    ]);
  });
});

describe('toEditionOption', () => {
  it('labels an edition from make, model, type, engine size and fuel', () => {
    const match: IrisMatch = { '@attributes': buildAttributes() };

    expect(toEditionOption(match)).toEqual({
      label: 'FORD ESCORT 60 1.4 - Van - 1392cc - Petrol',
      value: '90300269',
    });
  });

  it('falls back to the raw code for an unrecognised fuel type', () => {
    const match: IrisMatch = { '@attributes': { ...buildAttributes(), Fuel: 'X' } };

    expect(toEditionOption(match).label).toContain('X');
  });
});

describe('matchesForYear', () => {
  it('keeps only matches whose production years span the given year', () => {
    const inRange: IrisMatch = { '@attributes': buildAttributes() };
    const outOfRange: IrisMatch = {
      '@attributes': { ...buildAttributes(), From: '2000', To: '2005', ABI_code: 'OTHER' },
    };

    expect(matchesForYear([inRange, outOfRange], 1991)).toEqual([inRange]);
  });
});

function buildAttributes() {
  return {
    Make: 'FORD',
    Model: 'ESCORT 60 1.4',
    Engine_CC: '1392',
    From: '1990',
    To: '1992',
    Type: 'Van',
    Weight: '1800',
    Fuel: 'P',
    ABI_code: '90300269',
  };
}
