import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  DocumentsService,
  Document,
  DocumentStatus,
  DocumentsError,
  WorkspacesService,
  Workspace
} from '@vectorseek/data-access';
import { Subject, takeUntil } from 'rxjs';
import { DocumentsDialogService } from './services/documents-dialog.service';

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
  private static readonly WORKSPACE_STORAGE_KEY = 'vectorseek.selectedWorkspaceId';
  private readonly documentsService = inject(DocumentsService);
  private readonly workspacesService = inject(WorkspacesService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogService = inject(DocumentsDialogService);
  private readonly destroy$ = new Subject<void>();

  documents = signal<Document[]>([]);
  loading = signal(false);
  error = signal<DocumentsError | null>(null);
  workspaces = signal<Workspace[]>([]);
  workspacesLoading = signal(false);
  workspaceError = signal<string | null>(null);
  pagination = signal({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  statusFilter: DocumentStatus | '' = '';
  selectedWorkspaceId = '';
  private actionStatus = signal<Record<string, 'reprocess' | 'delete' | undefined>>({});

  ngOnInit(): void {
    this.restoreWorkspacePreference();
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

    const limit = this.pagination().limit;

    this.documentsService
      .listDocuments({
        limit,
        offset: (page - 1) * limit,
        status: this.statusFilter || undefined,
        workspaceId: this.selectedWorkspaceId || undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const resolvedLimit = response.limit || limit;
          const totalPages = resolvedLimit > 0 ? Math.ceil(response.total / resolvedLimit) : 1;
          this.documents.set(response.data);
          this.pagination.set({
            total: response.total,
            page,
            limit: resolvedLimit,
            totalPages: Math.max(1, totalPages)
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

  onWorkspaceChange(): void {
    this.saveWorkspacePreference();
    this.loadDocuments(1);
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
    this.dialogService
      .openUploadDialog()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loadDocuments(1);
        }
      });
  }

  onReprocessDocument(doc: Document): void {
    this.dialogService
      .confirmReprocess(doc)
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }
        this.executeReprocess(doc.id);
      });
  }

  onDeleteDocument(doc: Document): void {
    this.dialogService
      .confirmDelete(doc)
      .pipe(takeUntil(this.destroy$))
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
      doc.title ?? doc.filename,
      doc.status,
      doc.size.toString(),
      doc.workspaceName || '',
      doc.createdAt.toISOString(),
      doc.fingerprint ?? ''
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

  private loadWorkspaces(): void {
    this.workspacesLoading.set(true);
    this.workspaceError.set(null);

    this.workspacesService
      .listWorkspaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspaces) => {
          this.workspaces.set(workspaces);
          this.workspacesLoading.set(false);
        },
        error: () => {
          this.workspaceError.set('Não foi possível carregar os workspaces.');
          this.workspacesLoading.set(false);
        }
      });
  }

  private saveWorkspacePreference(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }
    if (this.selectedWorkspaceId) {
      storage.setItem(DocumentsPageComponent.WORKSPACE_STORAGE_KEY, this.selectedWorkspaceId);
    } else {
      storage.removeItem(DocumentsPageComponent.WORKSPACE_STORAGE_KEY);
    }
  }

  private restoreWorkspacePreference(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }
    const saved = storage.getItem(DocumentsPageComponent.WORKSPACE_STORAGE_KEY);
    if (saved) {
      this.selectedWorkspaceId = saved;
    }
  }

  private getStorage(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      return null;
    }
  }
}
