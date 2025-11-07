import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  GetProgressResponse,
  ListTemplatesRequest,
  ListTemplatesResponse,
  CancelGenerationResponse,
  GenerationAction,
  GenerationApiEnvelope,
  GenerationApiErrorPayload,
  GenerationError,
  ListHistoryRequest,
  ListHistoryResponse,
  ExportHistoryRequest
} from './generation.models';
import { GENERATION_API_ENDPOINTS } from './generation.api';

interface GenerationErrorMessageConfig {
  summary: string;
  description: string;
}

const ACTION_ERROR_MESSAGES: Record<
  GenerationAction,
  { default: GenerationErrorMessageConfig } & Partial<Record<number, GenerationErrorMessageConfig>>
> = {
  generate: {
    default: {
      summary: 'Não foi possível iniciar a geração',
      description: 'Tente novamente em instantes ou entre em contato com o suporte.'
    },
    429: {
      summary: 'Limite de gerações excedido',
      description: 'Aguarde alguns instantes antes de iniciar novas gerações.'
    },
    503: {
      summary: 'Serviço temporariamente indisponível',
      description: 'O serviço de geração está em manutenção. Tente novamente em breve.'
    }
  },
  progress: {
    default: {
      summary: 'Não foi possível consultar o progresso',
      description: 'Tente recarregar a página ou aguarde alguns instantes.'
    },
    404: {
      summary: 'Tarefa não encontrada ou expirada',
      description: 'A tarefa de geração não foi encontrada. Ela pode ter expirado.'
    }
  },
  templates: {
    default: {
      summary: 'Não foi possível carregar os templates',
      description: 'Tente recarregar a página ou aguarde alguns instantes.'
    }
  },
  cancel: {
    default: {
      summary: 'Não foi possível cancelar a geração',
      description: 'Tente novamente ou aguarde a conclusão da tarefa.'
    }
  },
  history: {
    default: {
      summary: 'Não foi possível carregar o histórico',
      description: 'Tente recarregar a página ou aguarde alguns instantes.'
    }
  },
  export: {
    default: {
      summary: 'Não foi possível exportar o histórico',
      description: 'Tente novamente ou entre em contato com o suporte.'
    },
    413: {
      summary: 'Volume de dados muito grande',
      description: 'Reduza o período da exportação ou aplique filtros adicionais.'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class GenerationService {
  private readonly http = inject(HttpClient);

  /**
   * Iniciar geração de documento
   */
  generateDocument(payload: GenerateDocumentRequest): Observable<GenerateDocumentResponse> {
    return this.http
      .post<GenerationApiEnvelope<GenerateDocumentResponse>>(
        GENERATION_API_ENDPOINTS.generateDocument(),
        payload
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('generate', error))
      );
  }

  /**
   * Consultar progresso de geração
   */
  getProgress(taskId: string): Observable<GetProgressResponse> {
    return this.http
      .get<GenerationApiEnvelope<GetProgressResponse>>(
        GENERATION_API_ENDPOINTS.getProgress(taskId)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('progress', error))
      );
  }

  /**
   * Listar templates disponíveis
   */
  listTemplates(request?: ListTemplatesRequest): Observable<ListTemplatesResponse> {
    let params = new HttpParams();

    if (request?.category) {
      params = params.set('category', request.category);
    }
    if (request?.search) {
      params = params.set('search', request.search);
    }

    return this.http
      .get<GenerationApiEnvelope<ListTemplatesResponse>>(
        GENERATION_API_ENDPOINTS.listTemplates(),
        { params }
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('templates', error))
      );
  }

  /**
   * Cancelar geração em andamento
   */
  cancelGeneration(taskId: string): Observable<CancelGenerationResponse> {
    return this.http
      .post<GenerationApiEnvelope<CancelGenerationResponse>>(
        GENERATION_API_ENDPOINTS.cancelGeneration(taskId),
        {}
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('cancel', error))
      );
  }

  /**
   * Listar histórico de gerações (E3-A3)
   */
  listHistory(request?: ListHistoryRequest): Observable<ListHistoryResponse> {
    let params = new HttpParams();

    if (request?.startDate) {
      params = params.set('startDate', request.startDate);
    }
    if (request?.endDate) {
      params = params.set('endDate', request.endDate);
    }
    if (request?.provider) {
      params = params.set('provider', request.provider);
    }
    if (request?.status) {
      params = params.set('status', request.status);
    }
    if (request?.page !== undefined) {
      params = params.set('page', request.page.toString());
    }
    if (request?.limit !== undefined) {
      params = params.set('limit', request.limit.toString());
    }
    if (request?.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request?.sortOrder) {
      params = params.set('sortOrder', request.sortOrder);
    }

    return this.http
      .get<GenerationApiEnvelope<ListHistoryResponse>>(
        GENERATION_API_ENDPOINTS.listHistory(),
        { params }
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('history', error))
      );
  }

  /**
   * Exportar histórico (E3-A3)
   */
  exportHistory(request: ExportHistoryRequest): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('format', request.format);

    if (request.startDate) {
      params = params.set('startDate', request.startDate);
    }
    if (request.endDate) {
      params = params.set('endDate', request.endDate);
    }
    if (request.provider) {
      params = params.set('provider', request.provider);
    }
    if (request.status) {
      params = params.set('status', request.status);
    }

    return this.http
      .get(GENERATION_API_ENDPOINTS.exportHistory(), {
        params,
        responseType: 'blob',
        observe: 'response'
      })
      .pipe(
        map((response) => {
          if (!response.body) {
            throw new Error('Empty response body');
          }
          return response.body;
        }),
        catchError((error) => this.handleError('export', error))
      );
  }

  private handleError(action: GenerationAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: GenerationAction, error: unknown): GenerationError {
    if (!(error instanceof HttpErrorResponse)) {
      const fallback = ACTION_ERROR_MESSAGES[action].default;
      return {
        status: 0,
        code: 'unexpected_error',
        summary: fallback.summary,
        description: fallback.description
      };
    }

    const retryAfterSeconds = this.extractRetryAfterSeconds(error.headers);
    const status = error.status ?? 0;
    const payload = this.extractApiErrorPayload(error.error);
    const messageConfig =
      ACTION_ERROR_MESSAGES[action][status] ?? ACTION_ERROR_MESSAGES[action].default;

    return {
      status,
      code: payload.code ?? `http_${status || 0}`,
      summary: messageConfig.summary,
      description: payload.message ?? messageConfig.description,
      retryAfterSeconds: retryAfterSeconds ?? undefined
    };
  }

  private extractRetryAfterSeconds(headers: HttpHeaders | null | undefined): number | null {
    if (!headers) {
      return null;
    }

    const value = headers.get('Retry-After');
    if (!value) {
      return null;
    }

    const parsedSeconds = Number(value);
    if (!Number.isNaN(parsedSeconds)) {
      return parsedSeconds;
    }

    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      const diffMs = parsedDate - Date.now();
      return diffMs > 0 ? Math.round(diffMs / 1000) : 0;
    }

    return null;
  }

  private extractApiErrorPayload(payload: unknown): {
    code?: string;
    message?: string;
  } {
    if (!payload) {
      return {};
    }

    if (typeof payload === 'string') {
      return { message: payload };
    }

    if (typeof payload !== 'object') {
      return {};
    }

    const maybeEnvelope = payload as {
      error?: GenerationApiErrorPayload;
      message?: string;
      code?: string;
    };
    const nested = maybeEnvelope.error ?? maybeEnvelope;

    const code =
      typeof nested.code === 'string'
        ? nested.code
        : typeof (nested as { error?: string }).error === 'string'
          ? (nested as { error?: string }).error
          : typeof maybeEnvelope.code === 'string'
            ? maybeEnvelope.code
            : undefined;

    const message =
      typeof nested.message === 'string'
        ? nested.message
        : typeof maybeEnvelope.message === 'string'
          ? maybeEnvelope.message
          : undefined;

    return {
      code,
      message
    };
  }
}
