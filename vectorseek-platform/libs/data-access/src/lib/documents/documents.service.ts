import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  Document,
  DocumentsAction,
  DocumentsApiEnvelope,
  DocumentsApiErrorPayload,
  DocumentsError,
  DocumentsListRequest,
  DocumentsListResponse,
  DocumentDetailResponse,
  Workspace,
  WorkspacesListResponse
} from './documents.models';
import { DOCUMENTS_API_ENDPOINTS } from './documents.api';

interface DocumentsErrorMessageConfig {
  summary: string;
  description: string;
}

const ACTION_ERROR_MESSAGES: Record<
  DocumentsAction,
  { default: DocumentsErrorMessageConfig } & Partial<Record<number, DocumentsErrorMessageConfig>>
> = {
  list: {
    default: {
      summary: 'Não foi possível carregar os documentos',
      description: 'Tente novamente em instantes ou recarregue a página.'
    }
  },
  detail: {
    default: {
      summary: 'Não foi possível carregar detalhes do documento',
      description: 'O documento pode não existir ou você não tem permissão para acessá-lo.'
    },
    404: {
      summary: 'Documento não encontrado',
      description: 'O documento solicitado não existe ou foi removido.'
    }
  },
  reprocess: {
    default: {
      summary: 'Não foi possível reprocessar o documento',
      description: 'Tente novamente mais tarde.'
    }
  },
  delete: {
    default: {
      summary: 'Não foi possível deletar o documento',
      description: 'Verifique suas permissões e tente novamente.'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);

  /**
   * Listar documentos com filtros e paginação
   */
  listDocuments(request?: DocumentsListRequest): Observable<DocumentsListResponse> {
    let params = new HttpParams();

    if (request?.page !== undefined) {
      params = params.set('page', request.page.toString());
    }
    if (request?.pageSize !== undefined) {
      params = params.set('pageSize', request.pageSize.toString());
    }
    if (request?.status) {
      params = params.set('status', request.status);
    }
    if (request?.workspaceId) {
      params = params.set('workspaceId', request.workspaceId);
    }
    if (request?.dateRange) {
      params = params.set('dateStart', request.dateRange.start);
      params = params.set('dateEnd', request.dateRange.end);
    }
    if (request?.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request?.sortOrder) {
      params = params.set('sortOrder', request.sortOrder);
    }

    return this.http
      .get<DocumentsApiEnvelope<DocumentsListResponse>>(DOCUMENTS_API_ENDPOINTS.list(), { params })
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('list', error))
      );
  }

  /**
   * Buscar detalhes de um documento
   */
  getDocumentDetail(id: string): Observable<DocumentDetailResponse> {
    return this.http
      .get<DocumentsApiEnvelope<DocumentDetailResponse>>(DOCUMENTS_API_ENDPOINTS.detail(id))
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('detail', error))
      );
  }

  /**
   * Reprocessar um documento
   */
  reprocessDocument(id: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<DocumentsApiEnvelope<{ success: boolean; message: string }>>(
        DOCUMENTS_API_ENDPOINTS.reprocess(id),
        {}
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('reprocess', error))
      );
  }

  /**
   * Deletar um documento
   */
  deleteDocument(id: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<DocumentsApiEnvelope<{ success: boolean; message: string }>>(
        DOCUMENTS_API_ENDPOINTS.delete(id)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('delete', error))
      );
  }

  /**
   * Listar workspaces disponíveis
   */
  listWorkspaces(): Observable<Workspace[]> {
    return this.http
      .get<DocumentsApiEnvelope<WorkspacesListResponse>>(DOCUMENTS_API_ENDPOINTS.workspaces())
      .pipe(
        map((response) => response.data.workspaces),
        catchError((error) => this.handleError('list', error))
      );
  }

  private handleError(action: DocumentsAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: DocumentsAction, error: unknown): DocumentsError {
    if (!(error instanceof HttpErrorResponse)) {
      const fallback = ACTION_ERROR_MESSAGES[action].default;
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
      ACTION_ERROR_MESSAGES[action][status] ?? ACTION_ERROR_MESSAGES[action].default;

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
      error?: DocumentsApiErrorPayload;
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
