import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS_API_ENDPOINTS } from './analytics.api';
import { AnalyticsOverviewResponse } from './analytics.models';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOverview', () => {
    it('should fetch analytics overview without date filter', (done) => {
      const mockResponse: AnalyticsOverviewResponse = {
        total_documents: 42,
        uploads_per_week: [
          { week_start: '2025-01-01', upload_count: 10 },
          { week_start: '2025-01-08', upload_count: 15 },
        ],
        workspace_usage: [
          {
            workspace_id: 'ws-1',
            workspace_name: 'Engineering',
            document_count: 25,
            query_count: 100,
          },
        ],
        top_templates: [
          { template_name: 'Summary', usage_count: 30 },
          { template_name: 'Report', usage_count: 12 },
        ],
      };

      service.getOverview().subscribe({
        next: (overview) => {
          expect(overview.totalDocuments).toBe(42);
          expect(overview.uploadsPerWeek.length).toBe(2);
          expect(overview.workspaceUsage.length).toBe(1);
          expect(overview.topTemplates.length).toBe(2);
          expect(overview.topTemplates[0].template_name).toBe('Summary');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch analytics overview with 7 days filter', (done) => {
      const mockResponse: AnalyticsOverviewResponse = {
        total_documents: 10,
        uploads_per_week: [{ week_start: '2025-01-13', upload_count: 10 }],
        workspace_usage: [],
        top_templates: [],
      };

      service.getOverview(7).subscribe({
        next: (overview) => {
          expect(overview.totalDocuments).toBe(10);
          expect(overview.uploadsPerWeek.length).toBe(1);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview(7));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toContain('?days=7');
      req.flush(mockResponse);
    });

    it('should fetch analytics overview with 30 days filter', (done) => {
      const mockResponse: AnalyticsOverviewResponse = {
        total_documents: 30,
        uploads_per_week: [],
        workspace_usage: [],
        top_templates: [],
      };

      service.getOverview(30).subscribe({
        next: (overview) => {
          expect(overview.totalDocuments).toBe(30);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview(30));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toContain('?days=30');
      req.flush(mockResponse);
    });

    it('should fetch analytics overview with 90 days filter', (done) => {
      const mockResponse: AnalyticsOverviewResponse = {
        total_documents: 90,
        uploads_per_week: [],
        workspace_usage: [],
        top_templates: [],
      };

      service.getOverview(90).subscribe({
        next: (overview) => {
          expect(overview.totalDocuments).toBe(90);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview(90));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toContain('?days=90');
      req.flush(mockResponse);
    });

    it('should handle empty arrays in response', (done) => {
      const mockResponse: AnalyticsOverviewResponse = {
        total_documents: 0,
        uploads_per_week: [],
        workspace_usage: [],
        top_templates: [],
      };

      service.getOverview().subscribe({
        next: (overview) => {
          expect(overview.totalDocuments).toBe(0);
          expect(overview.uploadsPerWeek).toEqual([]);
          expect(overview.workspaceUsage).toEqual([]);
          expect(overview.topTemplates).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.flush(mockResponse);
    });

    it('should normalize 401 unauthorized errors', (done) => {
      service.getOverview().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.code).toBe('api_error');
          expect(error.summary).toBe('analytics.error.unauthorized_summary');
          expect(error.description).toBe(
            'analytics.error.unauthorized_description'
          );
          done();
        },
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.flush(
        { error: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should normalize 403 forbidden errors', (done) => {
      service.getOverview().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.code).toBe('api_error');
          expect(error.summary).toBe('analytics.error.forbidden_summary');
          done();
        },
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should normalize 429 rate limit errors', (done) => {
      service.getOverview().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(429);
          expect(error.summary).toBe('analytics.error.rate_limit_summary');
          done();
        },
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.flush(
        { error: 'Too Many Requests' },
        { status: 429, statusText: 'Too Many Requests' }
      );
    });

    it('should normalize 503 service unavailable errors', (done) => {
      service.getOverview().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(503);
          expect(error.summary).toBe(
            'analytics.error.service_unavailable_summary'
          );
          done();
        },
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.flush(
        { error: 'Service Unavailable' },
        { status: 503, statusText: 'Service Unavailable' }
      );
    });

    it('should handle unexpected errors', (done) => {
      service.getOverview().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(0);
          expect(error.code).toBe('unexpected_error');
          expect(error.summary).toBe('analytics.error.unexpected_summary');
          done();
        },
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.error(new ProgressEvent('error'));
    });

    it('should use default error message for unknown status codes', (done) => {
      service.getOverview().subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.summary).toBe('analytics.error.generic_summary');
          expect(error.description).toBe('analytics.error.generic_description');
          done();
        },
      });

      const req = httpMock.expectOne(ANALYTICS_API_ENDPOINTS.overview());
      req.flush(
        { error: 'Internal Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });
});
