import { HttpClient, HttpErrorResponse, HttpParams, HttpEvent, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  Document,
  DocumentApiResponse,
  DocumentDeleteApiResponse,
  DocumentDeleteResult,
  DocumentMetadata,
  DocumentDetail,
  DocumentDetailApiResponse,
  DocumentReprocessApiResponse,
  DocumentReprocessResult,
  DocumentStatus,
  DocumentUploadApiResponse,
  DocumentUploadResponse,
  DocumentsAction,
  DocumentsApiEnvelope,
  DocumentsApiErrorPayload,
  DocumentsError,
  DocumentsListApiResponse,
  DocumentsListRequest,
  DocumentsListResult,
  LegacyDocumentApiResponse,
  LegacyDocumentDetailResponse,
  LegacyDocumentsListResponse
} from './documents.models';
import { DOCUMENTS_API_ENDPOINTS } from './documents.api';
import {
  Workspace,
  WorkspaceApiResponse,
  WorkspacesListResponse
} from '../workspaces/workspaces.models';

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
  },
  upload: {
    default: {
      summary: 'Falha ao enviar o documento',
      description: 'Verifique o arquivo selecionado e tente novamente.'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);

  listDocuments(request?: DocumentsListRequest): Observable<DocumentsListResult> {
    const params = this.buildListParams(request);

    return this.http
      .get<DocumentsListApiResponse | DocumentsApiEnvelope<LegacyDocumentsListResponse> | LegacyDocumentsListResponse>(
        DOCUMENTS_API_ENDPOINTS.list(),
        { params }
      )
      .pipe(
        map((response) => this.normalizeListResponse(response)),
        catchError((error) => this.handleError('list', error))
      );
  }

  getDocumentDetail(id: string): Observable<DocumentDetail> {
    return this.http
      .get<DocumentDetailApiResponse | LegacyDocumentDetailResponse | DocumentsApiEnvelope<DocumentDetailApiResponse>>(
        DOCUMENTS_API_ENDPOINTS.detail(id)
      )
      .pipe(
        map((response) => this.normalizeDetailResponse(response)),
        catchError((error) => this.handleError('detail', error))
      );
  }

  reprocessDocument(id: string, force = false): Observable<DocumentReprocessResult> {
    return this.http
      .post<DocumentReprocessApiResponse>(DOCUMENTS_API_ENDPOINTS.reprocess(id), { force })
      .pipe(
        map((response) => ({
          documentId: response.document_id,
          taskId: response.task_id,
          status: response.status
        })),
        catchError((error) => this.handleError('reprocess', error))
      );
  }

  deleteDocument(id: string): Observable<DocumentDeleteResult> {
    return this.http
      .delete<DocumentDeleteApiResponse>(DOCUMENTS_API_ENDPOINTS.delete(id))
      .pipe(
        map((response) => ({
          id: response.id,
          deletedAt: this.toDate(response.deleted_at) ?? new Date()
        })),
        catchError((error) => this.handleError('delete', error))
      );
  }

  uploadDocument(payload: {
    file: File;
    workspaceId?: string;
    title?: string;
  }): Observable<HttpEvent<DocumentUploadResponse>> {
    const formData = new FormData();
    formData.append('file', payload.file);

    if (payload.workspaceId) {
      formData.append('workspace_id', payload.workspaceId);
    }

    if (payload.title) {
      formData.append('title', payload.title);
    }

    return this.http
      .post<DocumentUploadApiResponse>(DOCUMENTS_API_ENDPOINTS.upload(), formData, {
        reportProgress: true,
        observe: 'events',
        responseType: 'json'
      })
      .pipe(
        map((event): HttpEvent<DocumentUploadResponse> => this.mapUploadEvent(event)),
        catchError((error) => this.handleError('upload', error))
      );
  }

  listWorkspaces(): Observable<Workspace[]> {
    return this.http
      .get<WorkspacesListResponse | DocumentsApiEnvelope<WorkspacesListResponse>>(DOCUMENTS_API_ENDPOINTS.workspaces())
      .pipe(
        map((response) =>
          (this.unwrapEnvelope<WorkspacesListResponse>(response).workspaces ?? []).map((workspace) =>
            this.mapWorkspaceResponse(workspace)
          )
        ),
        catchError((error) => this.handleError('list', error))
      );
  }

  private buildListParams(request?: DocumentsListRequest): HttpParams {
    let params = new HttpParams();

    if (request?.limit !== undefined) {
      params = params.set('limit', request.limit.toString());
    }
    if (request?.offset !== undefined) {
      params = params.set('offset', request.offset.toString());
    }
    if (request?.status) {
      params = params.set('status', request.status);
    }
    if (request?.workspaceId) {
      params = params.set('workspace_id', request.workspaceId);
    }
    if (request?.search) {
      params = params.set('search', request.search);
    }

    return params;
  }

  private normalizeListResponse(response: unknown): DocumentsListResult {
    const payload = this.unwrapEnvelope<DocumentsListApiResponse | LegacyDocumentsListResponse>(response);

    if (this.isDocumentsListApiResponse(payload)) {
      return {
        data: payload.data.map((doc) => this.mapDocumentResponse(doc)),
        total: payload.total,
        limit: payload.limit,
        offset: payload.offset
      };
    }

    if (this.isLegacyListResponse(payload)) {
      const { pagination } = payload;
      const offset = (pagination.page - 1) * pagination.pageSize;
      return {
        data: payload.documents.map((doc) => this.mapDocumentResponse(doc)),
        total: pagination.total,
        limit: pagination.pageSize,
        offset
      };
    }

    throw new Error('Invalid response payload for documents list');
  }

  private normalizeDetailResponse(response: unknown): DocumentDetail {
    const payload = this.unwrapEnvelope<DocumentDetailApiResponse | LegacyDocumentDetailResponse>(response);

    if (this.isDocumentApiResponse(payload)) {
      return this.mapDocumentResponse(payload);
    }

    if (this.isLegacyDocument(payload)) {
      return this.mapDocumentResponse(payload);
    }

    if (payload && typeof payload === 'object' && 'document' in payload) {
      const nested = (payload as { document?: LegacyDocumentApiResponse }).document;
      if (nested) {
        return this.mapDocumentResponse(nested);
      }
    }

    throw new Error('Invalid response payload for document detail');
  }

  private mapUploadEvent(event: HttpEvent<DocumentUploadApiResponse>): HttpEvent<DocumentUploadResponse> {
    if (event instanceof HttpResponse) {
      return event.clone({ body: this.mapUploadResponse(event.body ?? undefined) });
    }
    return event as HttpEvent<DocumentUploadResponse>;
  }

  private mapDocumentResponse(dto: DocumentApiResponse | LegacyDocumentApiResponse): Document {
    if (this.isLegacyDocument(dto)) {
      return this.mapLegacyDocument(dto);
    }

    const metadata = dto.metadata ? {
      title: dto.metadata.title ?? undefined,
      description: dto.metadata.description ?? undefined
    } : undefined;

    return {
      id: dto.id,
      filename: dto.filename,
      size: dto.size,
      status: this.normalizeStatus(dto.status),
      workspaceId: dto.workspace_id ?? undefined,
      workspaceName: dto.workspace_name ?? undefined,
      createdAt: this.toDate(dto.created_at) ?? new Date(),
      updatedAt: this.toDate(dto.updated_at) ?? new Date(),
      processedAt: this.toDate(dto.processed_at),
      indexedAt: this.toDate(dto.indexed_at),
      contentPreview: dto.content_preview ?? undefined,
      embeddingCount: dto.embedding_count ?? 0,
      chunkCount: dto.chunk_count ?? undefined,
      processingTimeSeconds: dto.processing_time_seconds ?? undefined,
      title: metadata?.title ?? undefined,
      description: metadata?.description ?? undefined,
      fingerprint: dto.fingerprint ?? undefined,
      error: dto.error ?? undefined,
      metadata
    };
  }

  private mapLegacyDocument(dto: LegacyDocumentApiResponse): Document {
    const metadataSource =
      dto.metadata || dto.title
        ? {
            title: dto.metadata?.title ?? dto.title ?? undefined,
            description: dto.metadata?.description ?? undefined
          }
        : undefined;
    const metadata = this.normalizeMetadata(metadataSource);

    return {
      id: dto.id,
      filename: dto.filename ?? dto.title ?? 'Documento',
      size: dto.size ?? 0,
      status: this.normalizeStatus(dto.status ?? undefined),
      workspaceId: dto.workspaceId ?? undefined,
      workspaceName: dto.workspaceName ?? undefined,
      createdAt: this.toDate(dto.createdAt) ?? new Date(),
      updatedAt: this.toDate(dto.updatedAt) ?? new Date(),
      processedAt: this.toDate(dto.processedAt),
      indexedAt: this.toDate(dto.indexedAt),
      contentPreview: dto.contentPreview ?? undefined,
      embeddingCount: dto.embeddingCount ?? 0,
      chunkCount: dto.chunkCount ?? undefined,
      processingTimeSeconds: dto.processingTimeSeconds ?? undefined,
      title: dto.title ?? metadata?.title,
      description: metadata?.description,
      fingerprint: dto.fingerprint ?? undefined,
      error: dto.error ?? undefined,
      metadata
    };
  }

  private mapWorkspaceResponse(workspace: WorkspaceApiResponse): Workspace {
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? undefined,
      ownerId: workspace.owner_id ?? undefined,
      createdAt: this.toDate(workspace.created_at),
      updatedAt: this.toDate(workspace.updated_at)
    };
  }

  private normalizeMetadata(
    metadata?: { title?: string | null; description?: string | null } | DocumentMetadata | null
  ): DocumentMetadata | undefined {
    if (!metadata) {
      return undefined;
    }

    const title = metadata.title ?? undefined;
    const description = metadata.description ?? undefined;

    if (title === undefined && description === undefined) {
      return undefined;
    }

    return { title, description };
  }

  private unwrapEnvelope<T>(response: unknown): T {
    if (
      response &&
      typeof response === 'object' &&
      'data' in response &&
      !('total' in response) &&
      !('limit' in response) &&
      !('offset' in response)
    ) {
      const envelope = response as DocumentsApiEnvelope<T>;
      return envelope.data;
    }

    return response as T;
  }

  private isDocumentsListApiResponse(payload: unknown): payload is DocumentsListApiResponse {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as DocumentsListApiResponse;
    return (
      Array.isArray(candidate.data) &&
      typeof candidate.total === 'number' &&
      typeof candidate.limit === 'number' &&
      typeof candidate.offset === 'number'
    );
  }

  private isLegacyListResponse(payload: unknown): payload is LegacyDocumentsListResponse {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as LegacyDocumentsListResponse;
    return Array.isArray(candidate.documents) && !!candidate.pagination;
  }

  private isDocumentApiResponse(payload: unknown): payload is DocumentApiResponse {
    return !!payload && typeof payload === 'object' && 'created_at' in payload;
  }

  private isLegacyDocument(payload: unknown): payload is LegacyDocumentApiResponse {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const candidate = payload as Record<string, unknown>;
    return !('created_at' in candidate) && ('createdAt' in candidate || 'title' in candidate);
  }

  private normalizeStatus(value?: DocumentStatus | string | null): DocumentStatus {
    switch ((value ?? 'pending').toString().toLowerCase()) {
      case 'processing':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private toDate(value?: string | Date | null): Date | undefined {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private mapUploadResponse(response: DocumentUploadApiResponse | null | undefined): DocumentUploadResponse {
    return {
      documentId: response?.document_id ?? '',
      filename: response?.filename ?? '',
      size: response?.size ?? 0,
      status: response?.status ?? 'processing',
      createdAt: this.toDate(response?.created_at) ?? new Date()
    };
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
