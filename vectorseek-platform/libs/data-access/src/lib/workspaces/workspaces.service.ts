import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  Workspace,
  WorkspaceAction,
  WorkspaceApiEnvelope,
  WorkspaceApiResponse,
  WorkspaceError,
  WorkspaceInput,
  WorkspacesListResponse
} from './workspaces.models';
import { WORKSPACES_API_ENDPOINTS } from './workspaces.api';

const WORKSPACE_ERROR_MESSAGES: Record<WorkspaceAction, { summary: string; description: string }> = {
  list: {
    summary: 'Não foi possível carregar os workspaces',
    description: 'Tente novamente em instantes ou recarregue a página.'
  },
  create: {
    summary: 'Não foi possível criar o workspace',
    description: 'Verifique os dados informados e tente novamente.'
  },
  update: {
    summary: 'Não foi possível atualizar o workspace',
    description: 'Tente novamente em instantes ou contacte o suporte.'
  },
  delete: {
    summary: 'Não foi possível deletar o workspace',
    description: 'Verifique se você possui permissão para essa ação.'
  }
};

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private readonly http = inject(HttpClient);

  listWorkspaces(): Observable<Workspace[]> {
    return this.http
      .get<WorkspacesListResponse | WorkspaceApiEnvelope<WorkspacesListResponse>>(WORKSPACES_API_ENDPOINTS.list())
      .pipe(
        map((response) => this.unwrapEnvelope(response).workspaces ?? []),
        map((workspaces) => workspaces.map((item) => this.mapWorkspace(item))),
        catchError((error) => this.handleError('list', error))
      );
  }

  createWorkspace(payload: WorkspaceInput): Observable<Workspace> {
    return this.http
      .post<WorkspaceApiEnvelope<WorkspaceApiResponse> | WorkspaceApiResponse>(
        WORKSPACES_API_ENDPOINTS.create(),
        payload
      )
      .pipe(
        map((response) => this.mapWorkspace(this.unwrapEnvelope(response))),
        catchError((error) => this.handleError('create', error))
      );
  }

  updateWorkspace(id: string, payload: WorkspaceInput): Observable<Workspace> {
    return this.http
      .put<WorkspaceApiEnvelope<WorkspaceApiResponse> | WorkspaceApiResponse>(
        WORKSPACES_API_ENDPOINTS.update(id),
        payload
      )
      .pipe(
        map((response) => this.mapWorkspace(this.unwrapEnvelope(response))),
        catchError((error) => this.handleError('update', error))
      );
  }

  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete(WORKSPACES_API_ENDPOINTS.delete(id)).pipe(
      map(() => void 0),
      catchError((error) => this.handleError('delete', error))
    );
  }

  private mapWorkspace(response: WorkspaceApiResponse): Workspace {
    return {
      id: response.id,
      name: response.name,
      description: response.description ?? null,
      ownerId: response.owner_id ?? null,
      createdAt: this.toDate(response.created_at),
      updatedAt: this.toDate(response.updated_at)
    };
  }

  private unwrapEnvelope<T>(response: T | WorkspaceApiEnvelope<T>): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as WorkspaceApiEnvelope<T>).data;
    }
    return response as T;
  }

  private handleError(action: WorkspaceAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: WorkspaceAction, error: unknown): WorkspaceError {
    if (!(error instanceof HttpErrorResponse)) {
      const fallback = WORKSPACE_ERROR_MESSAGES[action];
      return {
        status: 0,
        code: 'unexpected_error',
        summary: fallback.summary,
        description: fallback.description
      };
    }

    const fallback = WORKSPACE_ERROR_MESSAGES[action];
    const status = error.status ?? 0;
    const payloadError = (error.error as WorkspaceApiEnvelope<unknown> | undefined)?.error;

    return {
      status,
      code: payloadError?.code ?? `http_${status || 0}`,
      summary: fallback.summary,
      description: payloadError?.message ?? error.message ?? fallback.description
    };
  }

  private toDate(value?: string | null): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
