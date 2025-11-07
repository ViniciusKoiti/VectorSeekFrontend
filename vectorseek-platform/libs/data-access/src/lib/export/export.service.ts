import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, interval, switchMap, takeWhile, catchError, map, throwError } from 'rxjs';

import {
  ExportDocumentRequest,
  ExportDocumentResponse,
  GetExportStatusResponse,
  GenerationApiEnvelope,
  GenerationError
} from '../generation/generation.models';
import { GENERATION_API_ENDPOINTS } from '../generation/generation.api';

/**
 * Serviço de exportação de documentos (E3-A4)
 *
 * Features:
 * - Iniciar exportação em formatos PDF/DOCX
 * - Monitorar progresso via polling
 * - Download seguro com blob
 * - Gerenciar fila de exportações
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly POLL_INTERVAL_MS = 2000; // 2 segundos

  /**
   * Iniciar exportação de documento
   */
  exportDocument(request: ExportDocumentRequest): Observable<ExportDocumentResponse> {
    return this.http
      .post<GenerationApiEnvelope<ExportDocumentResponse>>(
        GENERATION_API_ENDPOINTS.exportDocument(request.format),
        {
          documentId: request.documentId,
          language: request.language,
          workspace: request.workspace,
          options: request.options
        }
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('export', error))
      );
  }

  /**
   * Consultar status de exportação
   */
  getExportStatus(taskId: string): Observable<GetExportStatusResponse> {
    return this.http
      .get<GenerationApiEnvelope<GetExportStatusResponse>>(
        GENERATION_API_ENDPOINTS.getExportStatus(taskId)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError('export_status', error))
      );
  }

  /**
   * Monitorar progresso de exportação com polling
   * Retorna atualizações até que a exportação seja concluída ou falhe
   */
  pollExportStatus(taskId: string): Observable<GetExportStatusResponse> {
    return interval(this.POLL_INTERVAL_MS).pipe(
      switchMap(() => this.getExportStatus(taskId)),
      takeWhile((status) => {
        return status.status === 'queued' || status.status === 'processing';
      }, true) // true = emit final value before completing
    );
  }

  /**
   * Download de documento exportado
   * Retorna blob para download seguro
   */
  downloadExport(taskId: string): Observable<Blob> {
    return this.http
      .get(GENERATION_API_ENDPOINTS.downloadExport(taskId), {
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
        catchError((error) => this.handleError('download', error))
      );
  }

  /**
   * Salvar blob como arquivo
   * Utility para download seguro
   */
  saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Gerar nome de arquivo com timestamp
   */
  generateFilename(title: string, format: string): string {
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().getTime();
    return `${sanitizedTitle}_${timestamp}.${format}`;
  }

  private handleError(action: string, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: string, error: unknown): GenerationError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        status: 0,
        code: 'unexpected_error',
        summary: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar a exportação.'
      };
    }

    const status = error.status ?? 0;
    const errorMessages: Record<string, Record<number, { summary: string; description: string }>> = {
      export: {
        404: {
          summary: 'Documento não encontrado',
          description: 'O documento que você está tentando exportar não foi encontrado.'
        },
        413: {
          summary: 'Documento muito grande',
          description: 'O documento excede o tamanho máximo permitido para exportação.'
        },
        500: {
          summary: 'Erro na exportação',
          description: 'Ocorreu um erro ao processar a exportação. Tente novamente.'
        }
      },
      export_status: {
        404: {
          summary: 'Tarefa não encontrada',
          description: 'A tarefa de exportação não foi encontrada ou expirou.'
        }
      },
      download: {
        404: {
          summary: 'Download não disponível',
          description: 'O arquivo exportado não está disponível ou expirou.'
        },
        410: {
          summary: 'Download expirado',
          description: 'O link de download expirou. Inicie uma nova exportação.'
        }
      }
    };

    const actionMessages = errorMessages[action];
    const message = actionMessages?.[status] || {
      summary: 'Erro na operação',
      description: 'Ocorreu um erro ao processar sua solicitação.'
    };

    return {
      status,
      code: `${action}_error_${status}`,
      summary: message.summary,
      description: message.description
    };
  }
}
