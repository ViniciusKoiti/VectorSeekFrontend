export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkspaceInput {
  name: string;
  description?: string | null;
}

export interface WorkspaceApiResponse {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WorkspacesListResponse {
  workspaces: WorkspaceApiResponse[];
}

export interface WorkspaceApiEnvelope<T> {
  data: T;
  error?: WorkspaceApiErrorPayload;
}

export interface WorkspaceApiErrorPayload {
  code?: string;
  message?: string;
}

export type WorkspaceAction = 'list' | 'create' | 'update' | 'delete';

export interface WorkspaceError {
  status: number;
  code: string;
  summary: string;
  description?: string;
}
