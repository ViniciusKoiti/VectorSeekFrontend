import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { GenerationHistoryService } from './generation-history.service';
import { GENERATION_API_ENDPOINTS } from './generation.api';

describe('GenerationHistoryService', () => {
  let service: GenerationHistoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GenerationHistoryService
      ]
    });

    service = TestBed.inject(GenerationHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listHistory', () => {
    it('should fetch generation history successfully', () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: 'history-1',
              taskId: 'task-123',
              templateId: 'template-1',
              templateName: 'Blog Post',
              workspaceId: 'workspace-1',
              workspaceName: 'My Workspace',
              title: 'Test Document',
              status: 'completed' as const,
              duration: 45,
              createdAt: '2025-01-01T10:00:00Z',
              completedAt: '2025-01-01T10:00:45Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 20,
          hasMore: false
        }
      };

      service.listHistory().subscribe((response) => {
        expect(response.items.length).toBe(1);
        expect(response.items[0].id).toBe('history-1');
        expect(response.items[0].status).toBe('completed');
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.listHistory());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should apply filters when listing history', () => {
      const filters = {
        workspaceId: 'workspace-1',
        status: 'completed' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        page: 2,
        limit: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      };

      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 2,
          limit: 10,
          hasMore: false
        }
      };

      service.listHistory(filters).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url === GENERATION_API_ENDPOINTS.listHistory();
      });

      expect(req.request.params.get('workspaceId')).toBe('workspace-1');
      expect(req.request.params.get('status')).toBe('completed');
      expect(req.request.params.get('startDate')).toBe('2025-01-01T00:00:00Z');
      expect(req.request.params.get('endDate')).toBe('2025-01-31T23:59:59Z');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.get('sortBy')).toBe('createdAt');
      expect(req.request.params.get('sortOrder')).toBe('desc');

      req.flush(mockResponse);
    });

    it('should handle errors when listing history', () => {
      const errorResponse = {
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        }
      };

      service.listHistory().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.code).toBe('FORBIDDEN');
          expect(error.summary).toContain('Acesso negado');
        }
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.listHistory());
      req.flush(errorResponse, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getHistoryDetail', () => {
    it('should fetch history detail successfully', () => {
      const historyId = 'history-1';
      const mockResponse = {
        data: {
          item: {
            id: 'history-1',
            taskId: 'task-123',
            templateId: 'template-1',
            templateName: 'Blog Post',
            workspaceId: 'workspace-1',
            workspaceName: 'My Workspace',
            title: 'Test Document',
            status: 'completed' as const,
            duration: 45,
            createdAt: '2025-01-01T10:00:00Z',
            completedAt: '2025-01-01T10:00:45Z',
            briefing: 'Test briefing',
            customVariables: { topic: 'AI' },
            result: {
              id: 'doc-1',
              title: 'Test Document',
              content: 'Generated content',
              format: 'markdown' as const,
              templateUsed: 'template-1',
              metadata: {
                generatedAt: '2025-01-01T10:00:45Z'
              }
            }
          }
        }
      };

      service.getHistoryDetail(historyId).subscribe((response) => {
        expect(response.item.id).toBe('history-1');
        expect(response.item.briefing).toBe('Test briefing');
        expect(response.item.result).toBeDefined();
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.getHistoryDetail(historyId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 error when history item not found', () => {
      const historyId = 'non-existent';
      const errorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'History item not found'
        }
      };

      service.getHistoryDetail(historyId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.summary).toContain('não encontrada');
        }
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.getHistoryDetail(historyId));
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('regenerate', () => {
    it('should regenerate from history successfully', () => {
      const historyId = 'history-1';
      const mockResponse = {
        data: {
          taskId: 'task-456',
          status: 'queued' as const,
          message: 'Regeneration started'
        }
      };

      service.regenerate(historyId).subscribe((response) => {
        expect(response.taskId).toBe('task-456');
        expect(response.status).toBe('queued');
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.regenerate(historyId));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle rate limit error (429)', () => {
      const historyId = 'history-1';
      const errorResponse = {
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many requests'
        }
      };

      service.regenerate(historyId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(429);
          expect(error.summary).toContain('Limite de gerações excedido');
        }
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.regenerate(historyId));
      req.flush(errorResponse, { status: 429, statusText: 'Too Many Requests' });
    });

    it('should handle service unavailable error (503)', () => {
      const historyId = 'history-1';

      service.regenerate(historyId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(503);
          expect(error.summary).toContain('temporariamente indisponível');
        }
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.regenerate(historyId));
      req.flush({}, { status: 503, statusText: 'Service Unavailable' });
    });
  });
});
