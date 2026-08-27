import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import type { IrisMakesResponse, IrisModelsResponse, IrisSearchResponse } from '../models/vehicle-search.model';
import { DynamicOptionsSourceService } from './dynamic-options-source.service';
import { VehicleIrisService } from './vehicle-iris.service';

type VehicleIrisStub = Pick<VehicleIrisService, 'getMakes' | 'getModels' | 'searchCached' | 'matchesOf'>;

describe('DynamicOptionsSourceService', () => {
  let service: DynamicOptionsSourceService;
  let vehicleIris: VehicleIrisStub;

  beforeEach(() => {
    vehicleIris = {
      getMakes: () => of<IrisMakesResponse>({ Make: ['FORD', 'AUDI'] }),
      getModels: () => of<IrisModelsResponse>({ Model: ['ESCORT'] }),
      searchCached: () =>
        of<IrisSearchResponse>({
          years: [2015, 2018],
          PCMatch: [
            {
              '@attributes': {
                Make: 'FORD',
                Model: 'ESCORT',
                Engine_CC: '1400',
                From: '2014',
                To: '2019',
                Type: 'Hatch',
                Weight: '1200',
                Fuel: 'P',
                ABI_code: 'ABI-1',
              },
            },
          ],
        }),
      matchesOf: (_irisModule: unknown, response: IrisSearchResponse) => response.PCMatch ?? [],
    };

    TestBed.configureTestingModule({
      providers: [{ provide: VehicleIrisService, useValue: vehicleIris }],
    });

    service = TestBed.inject(DynamicOptionsSourceService);
  });

  it('loads sorted make options for the configured catalogue', async () => {
    const options = await firstValueFrom(
      service
        .forEndpoint('iris-make')
        .loadOptions({ dependsOn: {}, context: { irisModule: 'PC' } }),
    );

    expect(options).toEqual([
      { label: 'AUDI', value: 'AUDI' },
      { label: 'FORD', value: 'FORD' },
    ]);
  });

  it('loads models for the chosen make', async () => {
    const options = await firstValueFrom(
      service
        .forEndpoint('iris-model')
        .loadOptions({ dependsOn: { make: 'FORD' }, context: { irisModule: 'PC' } }),
    );

    expect(options).toEqual([{ label: 'ESCORT', value: 'ESCORT' }]);
  });

  it('returns no model options until a make has been chosen', async () => {
    const options = await firstValueFrom(
      service
        .forEndpoint('iris-model')
        .loadOptions({ dependsOn: { make: '' }, context: { irisModule: 'PC' } }),
    );

    expect(options).toEqual([]);
  });

  it('loads years from the cached search response', async () => {
    const options = await firstValueFrom(
      service.forEndpoint('iris-year').loadOptions({
        dependsOn: { make: 'FORD', model: 'ESCORT' },
        context: { irisModule: 'PC' },
      }),
    );

    expect(options).toEqual([
      { label: '2018', value: '2018' },
      { label: '2015', value: '2015' },
    ]);
  });

  it('loads editions whose production years span the chosen year', async () => {
    const options = await firstValueFrom(
      service.forEndpoint('iris-edition').loadOptions({
        dependsOn: { make: 'FORD', model: 'ESCORT', year: '2016' },
        context: { irisModule: 'PC' },
      }),
    );

    expect(options).toEqual([
      { label: 'FORD ESCORT - Hatch - 1400cc - Petrol', value: 'ABI-1' },
    ]);
  });

  it('returns no editions when the chosen year is outside every match', async () => {
    const options = await firstValueFrom(
      service.forEndpoint('iris-edition').loadOptions({
        dependsOn: { make: 'FORD', model: 'ESCORT', year: '1999' },
        context: { irisModule: 'PC' },
      }),
    );

    expect(options).toEqual([]);
  });
});
