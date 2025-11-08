import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  AskQuestionRequest,
  AskQuestionResponse,
  QnaAction,
  QnaApiEnvelope,
  QnaApiErrorPayload,
  QnaError,
  QnaHistoryRequest,
  QnaHistoryResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse
} from './qna.models';
import { QNA_API_ENDPOINTS } from './qna.api';

interface QnaErrorMessageConfig {
  summary: string;
  description: string;
}

const ACTION_ERROR_MESSAGES: Record<
  QnaAction,
  { default: QnaErrorMessageConfig } & Partial<Record<number, QnaErrorMessageConfig>>
> = {
  ask: {
    default: {
      summary: 'Não foi possível processar sua pergunta',
      description: 'Tente novamente em instantes ou entre em contato com o suporte.'
    },
    429: {
      summary: 'Limite de perguntas excedido',
      description: 'Aguarde alguns instantes antes de fazer novas perguntas.'
    },
    503: {
      summary: 'Serviço temporariamente indisponível',
      description: 'O serviço de perguntas está em manutenção. Tente novamente em breve.'
    }
  },
  history: {
    default: {
      summary: 'Não foi possível carregar o histórico',
      description: 'Tente recarregar a página ou aguarde alguns instantes.'
    }
  },
  feedback: {
    default: {
      summary: 'Não foi possível enviar o feedback',
      description: 'Seu feedback é importante. Tente novamente mais tarde.'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class QnaService {
  private readonly http = inject(HttpClient);

  /**
   * Fazer uma pergunta ao sistema Q&A
   */
  ask(payload: AskQuestionRequest): Observable<AskQuestionResponse> {
    return this.http
      .post<QnaApiEnvelope<AskQuestionResponse>>(QNA_API_ENDPOINTS.ask(), payload)
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('ask', error))
      );
  }

  /**
   * Buscar histórico de perguntas e respostas
   */
  getHistory(request?: QnaHistoryRequest): Observable<QnaHistoryResponse> {
    let params = new HttpParams();

    if (request?.page !== undefined) {
      params = params.set('page', request.page.toString());
    }
    if (request?.pageSize !== undefined) {
      params = params.set('pageSize', request.pageSize.toString());
    }
    if (request?.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request?.sortOrder) {
      params = params.set('sortOrder', request.sortOrder);
    }

    return this.http
      .get<QnaApiEnvelope<QnaHistoryResponse>>(QNA_API_ENDPOINTS.history(), { params })
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('history', error))
      );
  }

  /**
   * Enviar feedback sobre uma resposta
   */
  submitFeedback(payload: SubmitFeedbackRequest): Observable<SubmitFeedbackResponse> {
    return this.http
      .post<QnaApiEnvelope<SubmitFeedbackResponse>>(QNA_API_ENDPOINTS.feedback(), payload)
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('feedback', error))
      );
  }

  private handleError(action: QnaAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: QnaAction, error: unknown): QnaError {
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
      error?: QnaApiErrorPayload;
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
