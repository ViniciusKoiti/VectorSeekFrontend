import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { QnaService } from './qna.service';
import { QNA_API_ENDPOINTS } from './qna.api';
import {
  AskQuestionRequest,
  AskQuestionResponse,
  QnaHistoryResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse
} from './qna.models';

describe('QnaService', () => {
  let service: QnaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), QnaService]
    });

    service = TestBed.inject(QnaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('ask', () => {
    it('deve fazer uma pergunta e retornar a resposta', () => {
      const request: AskQuestionRequest = {
        question: 'Como funciona o sistema?',
        filters: {}
      };

      const mockResponse: AskQuestionResponse = {
        questionId: '123',
        answer: {
          text: 'O sistema funciona...',
          citations: [
            {
              id: 'c1',
              documentId: 'd1',
              documentName: 'doc1.pdf',
              chunkText: 'texto...',
              score: 0.9
            }
          ]
        }
      };

      service.ask(request).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(QNA_API_ENDPOINTS.ask());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ data: mockResponse });
    });

    it('deve tratar erro 429 (rate limit)', () => {
      const request: AskQuestionRequest = {
        question: 'Teste'
      };

      service.ask(request).subscribe({
        next: () => fail('deveria ter falhado'),
        error: (error) => {
          expect(error.status).toBe(429);
          expect(error.code).toBeDefined();
          expect(error.summary).toContain('Limite de perguntas');
        }
      });

      const req = httpMock.expectOne(QNA_API_ENDPOINTS.ask());
      req.flush({ error: { message: 'Rate limit exceeded' } }, { status: 429, statusText: 'Too Many Requests' });
    });
  });

  describe('getHistory', () => {
    it('deve buscar histórico com paginação', () => {
      const mockHistory: QnaHistoryResponse = {
        entries: [
          {
            id: '1',
            question: {
              id: 'q1',
              text: 'Pergunta teste',
              timestamp: '2025-01-01T00:00:00Z'
            },
            answer: {
              text: 'Resposta teste',
              citations: []
            },
            timestamp: '2025-01-01T00:00:00Z'
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      };

      service.getHistory({ page: 1, pageSize: 10 }).subscribe((response) => {
        expect(response).toEqual(mockHistory);
      });

      const req = httpMock.expectOne(
        (request) => request.url === QNA_API_ENDPOINTS.history() && request.params.has('page')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('10');
      req.flush({ data: mockHistory });
    });
  });

  describe('submitFeedback', () => {
    it('deve enviar feedback com sucesso', () => {
      const request: SubmitFeedbackRequest = {
        questionId: '123',
        rating: 5,
        comment: 'Ótima resposta!'
      };

      const mockResponse: SubmitFeedbackResponse = {
        success: true,
        message: 'Feedback enviado com sucesso'
      };

      service.submitFeedback(request).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(QNA_API_ENDPOINTS.feedback());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ data: mockResponse });
    });
  });
});
