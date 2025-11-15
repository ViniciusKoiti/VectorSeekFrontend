import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Document,
  DocumentStatus,
  DocumentDetailResponse,
  DocumentsError,
  DocumentsService
} from '@vectorseek/data-access';
import { Subject, takeUntil } from 'rxjs';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';

type DocumentDetailViewModel = Document;

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.css']
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  private readonly documentsService = inject(DocumentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  readonly document = signal<DocumentDetailViewModel | null>(null);
  readonly loading = signal(false);
  readonly error = signal<DocumentsError | null>(null);
  readonly actionInProgress = signal<'reprocess' | 'delete' | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.error.set({
          status: 400,
          code: 'invalid_id',
          summary: 'Documento inválido',
          description: 'O identificador informado não é válido.'
        });
        return;
      }

      this.loadDocumentDetail(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/app/documents']);
  }

  onReprocess(): void {
    const doc = this.document();
    if (!doc) {
      return;
    }

    this.dialog
      .open(DeleteConfirmationModalComponent, {
        width: '420px',
        data: {
          title: 'Reprocessar documento',
          message: `Deseja reprocessar "${this.getDocumentTitle(doc)}"?`,
          confirmLabel: 'Reprocessar'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.executeReprocess(doc.id);
      });
  }

  onDelete(): void {
    const doc = this.document();
    if (!doc) return;

    this.dialog
      .open(DeleteConfirmationModalComponent, {
        width: '420px',
        data: {
          title: 'Deletar documento',
          message: `Tem certeza que deseja deletar "${this.getDocumentTitle(doc)}"?`,
          description: 'Esta ação é irreversível e removerá todos os dados processados.',
          confirmLabel: 'Deletar',
          danger: true
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.executeDelete(doc.id);
      });
  }

  getStatusLabel(status: DocumentStatus): string {
    const labels: Record<DocumentStatus, string> = {
      processing: 'Processando',
      completed: 'Concluído',
      failed: 'Erro',
      pending: 'Pendente'
    };
    return labels[status] || status;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  getProcessingTime(): string | null {
    const doc = this.document();
    if (!doc) return null;

    const seconds =
      doc.processingTimeSeconds ??
      (doc.processedAt
        ? Math.max(0, Math.floor((doc.processedAt.getTime() - doc.createdAt.getTime()) / 1000))
        : null);

    if (!seconds) return null;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }

  private loadDocumentDetail(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentsService
      .getDocumentDetail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const detail = this.normalizeDocument(response);
          this.document.set(detail);
          this.loading.set(false);
        },
        error: (err: DocumentsError) => {
          this.error.set(err);
          this.loading.set(false);
        }
      });
  }

  private executeReprocess(id: string): void {
    this.actionInProgress.set('reprocess');

    this.documentsService
      .reprocessDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Documento enviado para reprocessamento', 'Fechar', {
            duration: 3000
          });
          this.updateDocumentStatus(id, 'processing');
          this.actionInProgress.set(null);
        },
        error: (err: DocumentsError) => {
          this.actionInProgress.set(null);
          this.snackBar.open(err.summary, 'Fechar', { duration: 4000 });
        }
      });
  }

  private executeDelete(id: string): void {
    this.actionInProgress.set('delete');

    this.documentsService
      .deleteDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Documento deletado com sucesso', 'Fechar', {
            duration: 3000
          });
          this.actionInProgress.set(null);
          this.router.navigate(['/app/documents']);
        },
        error: (err: DocumentsError) => {
          this.actionInProgress.set(null);
          this.snackBar.open(err.summary, 'Fechar', { duration: 4000 });
        }
      });
  }

  private updateDocumentStatus(id: string, status: DocumentStatus): void {
    this.document.update((current) => {
      if (!current || current.id !== id) {
        return current;
      }
      return {
        ...current,
        status
      };
    });
  }

  private normalizeDocument(response: DocumentDetailResponse): DocumentDetailViewModel {
    const detail = response.document ?? {};

    const createdAt = this.toDate(detail.createdAt);
    const updatedAt = this.toDate(detail.updatedAt);
    const processedAt = this.toDate(detail.processedAt);

    const chunkCount =
      (detail.chunkCount ?? detail.embeddingCount ?? (detail as { totalChunks?: number }).totalChunks) ??
      undefined;

    return {
      id: detail.id ?? '',
      filename: detail.filename ?? detail.title ?? 'Documento',
      title: detail.title ?? undefined,
      size: detail.size ?? 0,
      status: (detail.status as DocumentStatus) ?? 'pending',
      workspaceId: detail.workspaceId ?? undefined,
      workspaceName:
        detail.workspaceName ??
        (detail as { workspace?: { name?: string | null } }).workspace?.name ??
        undefined,
      createdAt: createdAt ?? new Date(),
      updatedAt: updatedAt ?? new Date(),
      processedAt: processedAt,
      indexedAt: this.toDate(detail.indexedAt),
      contentPreview: detail.contentPreview ?? undefined,
      embeddingCount: detail.embeddingCount ?? chunkCount ?? 0,
      chunkCount: chunkCount,
      processingTimeSeconds: detail.processingTimeSeconds ?? undefined,
      error: detail.error ?? undefined,
      fingerprint: (detail as { fingerprint?: string | null }).fingerprint ?? undefined
    } as DocumentDetailViewModel;
  }

  private toDate(value?: string | Date | null): Date | undefined {
    if (!value) return undefined;
    return value instanceof Date ? value : new Date(value);
  }

  private getDocumentTitle(doc: DocumentDetailViewModel): string {
    return doc.title ?? doc.filename ?? 'Documento';
  }
}
