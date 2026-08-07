import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import { OccupationSearchService } from './occupation-search.service';

describe('OccupationSearchService', () => {
  let service: OccupationSearchService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'https://test-api.example.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    service = TestBed.inject(OccupationSearchService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  describe('searchOccupations', () => {
    it('sends keyword as a query parameter and maps response', () => {
      const mockResponse = {
        occupations: [
          { code: '394', description: 'Applications Programmer' },
          { code: 'C57', description: 'Computer Programmer' },
        ],
      };

      service.searchOccupations('prog').subscribe(results => {
        expect(results).toEqual(mockResponse.occupations);
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/occupations/get/bysearch?keyword=prog`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('returns empty array when response has no occupations', () => {
      service.searchOccupations('xyz').subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/occupations/get/bysearch?keyword=xyz`,
      );
      req.flush({});
    });
  });

  describe('searchIndustries', () => {
    it('sends keyword as a query parameter and maps response', () => {
      const mockResponse = {
        employers: [
          { code: '181', description: 'Computers' },
          { code: '904', description: 'Information Technology' },
        ],
      };

      service.searchIndustries('comp').subscribe(results => {
        expect(results).toEqual(mockResponse.employers);
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/employers/get/bysearch?keyword=comp`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('returns empty array when response has no employers', () => {
      service.searchIndustries('xyz').subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/employers/get/bysearch?keyword=xyz`,
      );
      req.flush({});
    });
  });

  describe('getOccupationByCode', () => {
    it('sends code as a query parameter and returns description', () => {
      service.getOccupationByCode('R09').subscribe(description => {
        expect(description).toBe('Retired');
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/occupations/get/bycode?code=R09`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({ description: 'Retired' });
    });

    it('returns empty string when description is missing', () => {
      service.getOccupationByCode('XXX').subscribe(description => {
        expect(description).toBe('');
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/occupations/get/bycode?code=XXX`,
      );
      req.flush({});
    });
  });

  describe('getIndustryByCode', () => {
    it('sends code as a query parameter and returns description', () => {
      service.getIndustryByCode('186').subscribe(description => {
        expect(description).toBe('Not Applicable');
      });

      const req = httpTesting.expectOne(
        `${baseUrl}/api/occupation/employers/get/bycode?code=186`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({ description: 'Not Applicable' });
    });
  });
});
