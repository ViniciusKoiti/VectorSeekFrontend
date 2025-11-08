import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { GenerationService } from './generation.service';
import { GENERATION_API_ENDPOINTS } from './generation.api';

describe('GenerationService', () => {
  let service: GenerationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GenerationService
      ]
    });

    service = TestBed.inject(GenerationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateDocument', () => {
    it('should initiate document generation successfully', () => {
      const mockRequest = {
        title: 'Test Document',
        briefing: 'Test briefing',
        templateId: 'template-1'
      };

      const mockResponse = {
        data: {
          taskId: 'task-123',
          status: 'queued' as const,
          message: 'Generation started'
        }
      };

      service.generateDocument(mockRequest).subscribe((response) => {
        expect(response.taskId).toBe('task-123');
        expect(response.status).toBe('queued');
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.generateDocument());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('getProgress', () => {
    it('should fetch generation progress successfully', () => {
      const taskId = 'task-123';
      const mockResponse = {
        data: {
          taskId: 'task-123',
          status: 'processing' as const,
          stage: 'rendering' as const,
          percentage: 50,
          message: 'Generating content...'
        }
      };

      service.getProgress(taskId).subscribe((response) => {
        expect(response.taskId).toBe(taskId);
        expect(response.status).toBe('processing');
        expect(response.percentage).toBe(50);
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.getProgress(taskId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('listTemplates', () => {
    it('should list available templates successfully', () => {
      const mockResponse = {
        data: {
          templates: [
            {
              id: 'template-1',
              name: 'Blog Post',
              description: 'Create a blog post',
              category: 'content',
              variables: []
            }
          ]
        }
      };

      service.listTemplates().subscribe((response) => {
        expect(response.templates.length).toBe(1);
        expect(response.templates[0].id).toBe('template-1');
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.listTemplates());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('cancelGeneration', () => {
    it('should cancel generation successfully', () => {
      const taskId = 'task-123';
      const mockResponse = {
        data: {
          success: true,
          message: 'Generation cancelled'
        }
      };

      service.cancelGeneration(taskId).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(GENERATION_API_ENDPOINTS.cancelGeneration(taskId));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
