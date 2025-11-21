import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  ListHistoryRequest,
  ListHistoryResponse,
  GetHistoryDetailResponse,
  RegenerateResponse,
  GenerationHistoryAction,
  GenerationHistoryError,
  GenerationApiEnvelope,
  GenerationApiErrorPayload
} from './generation.models';
import { GENERATION_API_ENDPOINTS } from './generation.api';

interface GenerationHistoryErrorMessageConfig {
  summary: string;
  description: string;
}

const HISTORY_ACTION_ERROR_MESSAGES: Record<
  GenerationHistoryAction,
  { default: GenerationHistoryErrorMessageConfig } & Partial<Record<number, GenerationHistoryErrorMessageConfig>>
> = {
  listHistory: {
    default: {
      summary: 'Não foi possível carregar o histórico',
      description: 'Tente recarregar a página ou aguarde alguns instantes.'
    },
    403: {
      summary: 'Acesso negado',
      description: 'Você não tem permissão para visualizar este histórico.'
    },
    500: {
      summary: 'Erro no servidor',
      description: 'Ocorreu um erro ao buscar o histórico. Tente novamente mais tarde.'
    }
  },
  getHistoryDetail: {
    default: {
      summary: 'Não foi possível carregar os detalhes',
      description: 'Tente novamente em instantes.'
    },
    404: {
      summary: 'Geração não encontrada',
      description: 'O item do histórico solicitado não foi encontrado ou foi removido.'
    },
    403: {
      summary: 'Acesso negado',
      description: 'Você não tem permissão para visualizar este item.'
    }
  },
  regenerate: {
    default: {
      summary: 'Não foi possível regenerar',
      description: 'Tente novamente ou entre em contato com o suporte.'
    },
    404: {
      summary: 'Geração original não encontrada',
      description: 'O item do histórico não foi encontrado para regeneração.'
    },
    429: {
      summary: 'Limite de gerações excedido',
      description: 'Aguarde alguns instantes antes de iniciar novas gerações.'
    },
    503: {
      summary: 'Serviço temporariamente indisponível',
      description: 'O serviço de geração está em manutenção. Tente novamente em breve.'
    }
  }
};

/**
 * Service para gerenciar o histórico de gerações de documentos (E8-T7)
 */
@Injectable({ providedIn: 'root' })
export class GenerationHistoryService {
  private readonly http = inject(HttpClient);

  /**
   * Listar histórico de gerações com filtros opcionais
   */
  listHistory(request?: ListHistoryRequest): Observable<ListHistoryResponse> {
    let params = new HttpParams();

    if (request?.workspaceId) {
      params = params.set('workspaceId', request.workspaceId);
    }
    if (request?.status) {
      params = params.set('status', request.status);
    }
    if (request?.startDate) {
      params = params.set('startDate', request.startDate);
    }
    if (request?.endDate) {
      params = params.set('endDate', request.endDate);
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
        catchError((error) => this.handleError('listHistory', error))
      );
  }

  /**
   * Obter detalhes de um item específico do histórico
   */
  getHistoryDetail(id: string): Observable<GetHistoryDetailResponse> {
    return this.http
      .get<GenerationApiEnvelope<GetHistoryDetailResponse>>(
        GENERATION_API_ENDPOINTS.getHistoryDetail(id)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('getHistoryDetail', error))
      );
  }

  /**
   * Regenerar documento a partir de um item do histórico
   */
  regenerate(historyId: string): Observable<RegenerateResponse> {
    return this.http
      .post<GenerationApiEnvelope<RegenerateResponse>>(
        GENERATION_API_ENDPOINTS.regenerate(historyId),
        {}
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('regenerate', error))
      );
  }

  private handleError(action: GenerationHistoryAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: GenerationHistoryAction, error: unknown): GenerationHistoryError {
    if (!(error instanceof HttpErrorResponse)) {
      const fallback = HISTORY_ACTION_ERROR_MESSAGES[action].default;
      return {
        status: 0,
        code: 'unexpected_error',
        summary: fallback.summary,
        description: fallback.description
      };
    }

    const status = error.status ?? 0;
    const payload = this.extractApiErrorPayload(error.error);
    const messageConfig =
      HISTORY_ACTION_ERROR_MESSAGES[action][status] ?? HISTORY_ACTION_ERROR_MESSAGES[action].default;

    return {
      status,
      code: payload.code ?? `http_${status || 0}`,
      summary: messageConfig.summary,
      description: payload.message ?? messageConfig.description
    };
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
