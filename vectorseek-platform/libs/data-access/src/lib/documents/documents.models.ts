/**
 * Modelos e interfaces para o módulo de Documentos
 * Conforme especificação E2-A3
 */

// === Tipos de domínio ===

export type DocumentStatus = 'processing' | 'completed' | 'error' | 'pending';

export interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
  workspaceId?: string;
  workspaceName?: string;
  size: number; // in bytes
  fingerprint: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  indexedAt?: Date;
  errorMessage?: string;
}

// === Request/Response DTOs ===

export interface DocumentsListRequest {
  page?: number;
  pageSize?: number;
  status?: DocumentStatus;
  workspaceId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentsListResponse {
  documents: Array<{
    id: string;
    title: string;
    status: DocumentStatus;
    workspaceId?: string;
    workspaceName?: string;
    size: number;
    fingerprint: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    indexedAt?: string;
    errorMessage?: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface DocumentDetailResponse {
  id: string;
  title: string;
  status: DocumentStatus;
  workspaceId?: string;
  workspaceName?: string;
  size: number;
  fingerprint: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  indexedAt?: string;
  errorMessage?: string;
  chunks?: number;
  processingTime?: number;
}

// === Tipos de erro ===

export type DocumentsAction = 'list' | 'detail' | 'reprocess' | 'delete';

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
}

// === Workspace ===

export interface Workspace {
  id: string;
  name: string;
}

export interface WorkspacesListResponse {
  workspaces: Array<{
    id: string;
    name: string;
  }>;
}
