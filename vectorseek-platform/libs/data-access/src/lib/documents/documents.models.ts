/**
 * Modelos e interfaces para o módulo de Documentos
 * Alinhado ao contrato descrito em E8-T1/E8-T2 (Pydantic schemas)
 */

// === Tipos de domínio ===

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentMetadata {
  title?: string;
  description?: string;
}

export interface Document {
  id: string;
  filename: string;
  size: number;
  status: DocumentStatus;
  workspaceId?: string;
  workspaceName?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  indexedAt?: Date;
  contentPreview?: string;
  embeddingCount: number;
  chunkCount?: number;
  processingTimeSeconds?: number;
  title?: string;
  description?: string;
  fingerprint?: string;
  error?: string;
  metadata?: DocumentMetadata;
}

export type DocumentDetail = Document;

export interface DocumentsListRequest {
  limit?: number;
  offset?: number;
  workspaceId?: string;
  status?: DocumentStatus;
  search?: string;
}

export interface DocumentsListResult {
  data: Document[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentReprocessResult {
  documentId: string;
  taskId: string;
  status: string;
}

export interface DocumentDeleteResult {
  id: string;
  deletedAt: Date;
}

export interface DocumentUploadResponse {
  documentId: string;
  filename: string;
  size: number;
  status: string;
  createdAt: Date;
}

// === Tipos de erro ===

export type DocumentsAction = 'list' | 'detail' | 'reprocess' | 'delete' | 'upload';

export interface DocumentsError {
  status: number;
  code: string;
  summary: string;
  description?: string;
}

export interface DocumentsApiErrorPayload {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface DocumentsApiEnvelope<T> {
  data: T;
  error?: DocumentsApiErrorPayload;
}

// === Tipos auxiliares para o contrato da API (snake_case) ===

export interface DocumentApiResponse {
  id: string;
  filename: string;
  size: number;
  status: DocumentStatus;
  workspace_id?: string | null;
  workspace_name?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  indexed_at?: string | null;
  content_preview?: string | null;
  embedding_count?: number | null;
  chunk_count?: number | null;
  processing_time_seconds?: number | null;
  metadata?: {
    title?: string | null;
    description?: string | null;
  } | null;
  fingerprint?: string | null;
  error?: string | null;
}

export interface DocumentsListApiResponse {
  data: DocumentApiResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface LegacyDocumentApiResponse {
  id: string;
  title?: string | null;
  filename?: string | null;
  size?: number | null;
  status?: DocumentStatus | string | null;
  workspaceId?: string | null;
  workspaceName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  processedAt?: string | null;
  indexedAt?: string | null;
  contentPreview?: string | null;
  embeddingCount?: number | null;
  chunkCount?: number | null;
  processingTimeSeconds?: number | null;
  metadata?: DocumentMetadata | null;
  fingerprint?: string | null;
  error?: string | null;
}

export interface LegacyDocumentsListResponse {
  documents: LegacyDocumentApiResponse[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export type DocumentDetailApiResponse = DocumentApiResponse;

export type LegacyDocumentDetailResponse =
  | LegacyDocumentApiResponse
  | {
      document?: LegacyDocumentApiResponse;
    };

export interface DocumentReprocessApiResponse {
  document_id: string;
  task_id: string;
  status: string;
}

export interface DocumentDeleteApiResponse {
  id: string;
  deleted_at: string;
}

export interface DocumentUploadApiResponse {
  document_id: string;
  filename: string;
  size: number;
  status: string;
  created_at: string;
}
