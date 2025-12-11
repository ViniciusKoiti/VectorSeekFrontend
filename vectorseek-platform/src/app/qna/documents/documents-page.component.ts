import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocumentsService, Document, DocumentStatus, DocumentsError, Workspace } from '@vectorseek/data-access';
import { DeleteConfirmationModalComponent } from './components/delete-confirmation-modal/delete-confirmation-modal.component';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { Subject, takeUntil } from 'rxjs';

/**
 * Página de gestão de documentos vetorados
 * Conforme especificação E2-A3 (versão simplificada)
 */
@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './documents-page.component.html',
  styleUrls: ['./documents-page.component.css']
})
export class DocumentsPageComponent implements OnInit, OnDestroy {
  private readonly documentsService = inject(DocumentsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  documents = signal<Document[]>([]);
  loading = signal(false);
  error = signal<DocumentsError | null>(null);
  pagination = signal({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  statusFilter: DocumentStatus | '' = '';
  workspaces = signal<Workspace[]>([]);
  selectedWorkspaceId: string = '';
  isLoadingWorkspaces = signal(false);
  workspaceError = signal<string | null>(null);
  private actionStatus = signal<Record<string, 'reprocess' | 'delete' | undefined>>({});

  ngOnInit(): void {
    this.loadWorkspacePreference();
    this.loadWorkspaces();
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocuments(page: number = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentsService
      .listDocuments({
        offset: (page - 1) * 20,
        limit: 20,
        status: this.statusFilter || undefined,
        workspaceId: this.selectedWorkspaceId || undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const docs: Document[] = response.data.map((doc) => ({
            id: doc.id,
            title: doc.title ?? undefined,
            filename: doc.filename,
            size: doc.size,
            status: doc.status,
            workspaceId: doc.workspaceId ?? undefined,
            workspaceName: doc.workspaceName ?? undefined,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            processedAt: doc.processedAt ? new Date(doc.processedAt) : undefined,
            indexedAt: doc.indexedAt ? new Date(doc.indexedAt) : undefined,
            contentPreview: doc.contentPreview ?? undefined,
            embeddingCount: doc.embeddingCount ?? 0,
            chunkCount: doc.chunkCount ?? undefined,
            processingTimeSeconds: doc.processingTimeSeconds ?? undefined,
            fingerprint: doc.fingerprint ?? undefined,
            error: doc.error ?? undefined
          }));

          this.documents.set(docs);

          // Calculate pagination from flat response fields
          const page = Math.floor(response.offset / response.limit) + 1;
          const totalPages = Math.ceil(response.total / response.limit);

          this.pagination.set({
            total: response.total,
            page: Math.floor(response.offset / response.limit) + 1,
            pageSize: response.limit,
            totalPages: Math.ceil(response.total / response.limit)
          });
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error);
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.loadDocuments(1);
  }

  onRefresh(): void {
    this.loadDocuments(this.pagination().page);
  }

  onPreviousPage(): void {
    const currentPage = this.pagination().page;
    if (currentPage > 1) {
      this.loadDocuments(currentPage - 1);
    }
  }

  onNextPage(): void {
    const currentPage = this.pagination().page;
    const totalPages = this.pagination().totalPages;
    if (currentPage < totalPages) {
      this.loadDocuments(currentPage + 1);
    }
  }

  onViewDetails(doc: Document): void {
    this.router.navigate(['/app/documents', doc.id]);
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(DocumentUploadComponent, {
      width: '520px',
      disableClose: true,
      data: {
        workspaceId: this.selectedWorkspaceId,
        workspaces: this.workspaces()
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loadDocuments(1);
        }
      });
  }

  onReprocessDocument(doc: Document): void {
    this.dialog
      .open(DeleteConfirmationModalComponent, {
        width: '420px',
        data: {
          title: 'Reprocessar documento',
          message: `Deseja reprocessar "${doc.title ?? doc.filename}"?`,
          confirmLabel: 'Reprocessar'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }
        this.executeReprocess(doc.id);
      });
  }

  onDeleteDocument(doc: Document): void {
    this.dialog
      .open(DeleteConfirmationModalComponent, {
        width: '420px',
        data: {
          title: 'Deletar documento',
          message: `Tem certeza que deseja deletar "${doc.title ?? doc.filename}"?`,
          description: 'Esta ação não pode ser desfeita. Todos os chunks serão removidos.',
          confirmLabel: 'Deletar',
          danger: true
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }
        this.executeDelete(doc.id);
      });
  }

  isActionLoading(documentId: string, action: 'reprocess' | 'delete'): boolean {
    return this.actionStatus()[documentId] === action;
  }

  onExportCSV(): void {
    const docs = this.documents();
    if (docs.length === 0) return;

    const headers = ['Título', 'Status', 'Tamanho (bytes)', 'Workspace', 'Data de Criação', 'Fingerprint'];
    const rows = docs.map((doc) => [
      doc.title,
      doc.status,
      doc.size.toString(),
      doc.workspaceName || '',
      doc.createdAt.toISOString(),
      doc.fingerprint
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `documentos_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  formatSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  loadWorkspaces(): void {
    this.isLoadingWorkspaces.set(true);
    this.workspaceError.set(null);

    this.documentsService
      .listWorkspaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspaces) => {
          this.workspaces.set(workspaces);
          this.isLoadingWorkspaces.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar workspaces:', error);
          this.workspaceError.set(error.summary ?? 'Não foi possível carregar workspaces.');
          this.isLoadingWorkspaces.set(false);
          // Fallback: continuar sem workspaces
        }
      });
  }

  onWorkspaceChange(): void {
    this.loadDocuments(1);
    this.saveWorkspacePreference();
  }

  private saveWorkspacePreference(): void {
    localStorage.setItem('selectedWorkspaceId', this.selectedWorkspaceId || '');
  }

  private loadWorkspacePreference(): void {
    const saved = localStorage.getItem('selectedWorkspaceId');
    if (saved !== null) {
      this.selectedWorkspaceId = saved;
    }
  }

  private executeReprocess(id: string): void {
    this.setActionStatus(id, 'reprocess');

    this.documentsService
      .reprocessDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Documento enviado para reprocessamento', 'Fechar', {
            duration: 3000
          });
          this.updateDocumentStatus(id, 'processing');
          this.setActionStatus(id);
        },
        error: (err: DocumentsError) => {
          this.setActionStatus(id);
          this.snackBar.open(err.summary, 'Fechar', { duration: 4000 });
        }
      });
  }

  private executeDelete(id: string): void {
    this.setActionStatus(id, 'delete');

    this.documentsService
      .deleteDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Documento deletado com sucesso', 'Fechar', {
            duration: 3000
          });
          this.setActionStatus(id);
          this.loadDocuments(this.pagination().page);
        },
        error: (err: DocumentsError) => {
          this.setActionStatus(id);
          this.snackBar.open(err.summary, 'Fechar', { duration: 4000 });
        }
      });
  }

  private updateDocumentStatus(id: string, status: DocumentStatus): void {
    this.documents.update((docs) => {
      return docs.map((doc) => (doc.id === id ? { ...doc, status } : doc));
    });
  }

  private setActionStatus(id: string, status?: 'reprocess' | 'delete'): void {
    this.actionStatus.update((current) => ({
      ...current,
      [id]: status
    }));
  }
}
