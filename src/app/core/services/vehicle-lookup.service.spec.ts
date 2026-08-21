import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import type { VehicleByAbicodeVehicle, VehicleByVrmVehicle } from '../models/vehicle-search.model';
import {
  VEHICLE_NOT_FOUND_FALLBACK_MESSAGE,
  VehicleLookupService,
  buildDvlaDelayWarning,
  dataErrorMessage,
  transportErrorMessage,
} from './vehicle-lookup.service';

const TEST_API_BASE_URL = 'https://api.test.local';

describe('VehicleLookupService', () => {
  let service: VehicleLookupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: TEST_API_BASE_URL }],
    });

    service = TestBed.inject(VehicleLookupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends the VRM lookup with module and registration query params', () => {
    service.getByVrm('PC', 'AB12CDE').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/get/byvrm`,
    );
    expect(request.request.params.get('module')).toBe('PC');
    expect(request.request.params.get('registration')).toBe('AB12CDE');

    request.flush({ vehicles: [] });
  });

  it('sends the ABI code lookup with module and abicode query params', () => {
    service.getByAbicode('GV', '04135717').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${TEST_API_BASE_URL}/api/vehicle/get/byabicode`,
    );
    expect(request.request.params.get('module')).toBe('GV');
    expect(request.request.params.get('abicode')).toBe('04135717');

    request.flush({});
  });

  it('normalizes a VRM match, keeping raw codes rather than descriptions', () => {
    const vehicle: VehicleByVrmVehicle = {
      registration: 'PX17SUA',
      abicode: '04135717',
      manufacturer: 'AUDI',
      model: 'Q7 S LINE QUATTRO TDI 272',
      cc: 2967,
      years: '2015-2018',
      year: 2017,
      fuel: 'D',
      transmission: 'A',
      body: 'E',
      body_desc: 'Estate',
      registered: '13/03/2017',
      doors: 5,
    };

    expect(service.normalizeFromVrm(vehicle)).toEqual({
      regnumber: 'PX17SUA',
      make: 'AUDI',
      model: 'Q7 S LINE QUATTRO TDI 272',
      year: 2017,
      fuel: 'D',
      engine: 2967,
      transmission: 'A',
      abicode: '04135717',
    });
  });

  it('normalizes an ABI code match, carrying the context that resolved it', () => {
    const vehicle: VehicleByAbicodeVehicle = {
      manufacturer: 'Audi',
      model: 'Q7 S Line Quattr272 TDI ES',
      cc: 2967,
      years: '2015-2018',
      fuel: 'D',
      fuel_desc: 'Diesel',
      body: 'E',
      body_desc: 'Estate',
      weight: 0.5,
      transmission: 'A',
      transmission_desc: 'Automatic',
      doors: '5',
      matched_in: 'PC',
    };

    expect(
      service.normalizeFromAbicode(vehicle, {
        regnumber: 'PX17SUA',
        year: 2017,
        abicode: '04135717',
      }),
    ).toEqual({
      regnumber: 'PX17SUA',
      make: 'Audi',
      model: 'Q7 S Line Quattr272 TDI ES',
      year: 2017,
      fuel: 'D',
      engine: 2967,
      transmission: 'A',
      abicode: '04135717',
      weight: 0.5,
    });
  });
});

describe('dataErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(dataErrorMessage(undefined)).toBeNull();
  });

  it('returns a string error as-is', () => {
    expect(dataErrorMessage('Something went wrong')).toBe('Something went wrong');
  });

  it('reads the message from an error object, falling back when it has none', () => {
    expect(dataErrorMessage({ message: 'No match' })).toBe('No match');
    expect(dataErrorMessage({})).toBe(VEHICLE_NOT_FOUND_FALLBACK_MESSAGE);
  });
});

describe('transportErrorMessage', () => {
  it('falls back to the default message for a plain unknown error', () => {
    expect(transportErrorMessage('nope')).toBe(VEHICLE_NOT_FOUND_FALLBACK_MESSAGE);
  });

  it('reads the message from a real Error', () => {
    expect(transportErrorMessage(new Error('boom'))).toBe('boom');
  });
});

describe('buildDvlaDelayWarning', () => {
  it('interpolates the registration into the DVLA-delay explanation', () => {
    const warning = buildDvlaDelayWarning('AB12CDE');

    expect(warning).toContain('<strong>"AB12CDE"</strong>');
    expect(warning).toContain('Don\u2019t worry, brand new vehicles aren\u2019t added');
  });
});
