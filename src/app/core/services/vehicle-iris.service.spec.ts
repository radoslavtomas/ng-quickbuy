import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import type { IrisSearchResponse } from '../models/vehicle-search.model';
import { VehicleIrisService } from './vehicle-iris.service';

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
