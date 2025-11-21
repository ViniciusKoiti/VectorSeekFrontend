import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  GenerationHistoryService,
  GenerationHistoryItem,
  GenerationStatus,
  GenerationHistoryError,
  Workspace,
  DocumentsService
} from '@vectorseek/data-access';
import { Subject, takeUntil } from 'rxjs';

/**
 * Página de histórico de gerações de documentos
 * Conforme especificação E8-T7
 */
@Component({
  selector: 'app-generation-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule, MatSnackBarModule, TranslateModule],
  templateUrl: './generation-history-page.component.html',
  styleUrls: ['./generation-history-page.component.css']
})
export class GenerationHistoryPageComponent implements OnInit, OnDestroy {
  private readonly historyService = inject(GenerationHistoryService);
  private readonly documentsService = inject(DocumentsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  historyItems = signal<GenerationHistoryItem[]>([]);
  loading = signal(false);
  error = signal<GenerationHistoryError | null>(null);
  pagination = signal({
    total: 0,
    page: 1,
    limit: 20,
    hasMore: false
  });

  // Filtros
  statusFilter: GenerationStatus | '' = '';
  startDateFilter = '';
  endDateFilter = '';
  workspaces = signal<Workspace[]>([]);
  selectedWorkspaceId = '';
  isLoadingWorkspaces = signal(false);

  // Estado das ações (regenerar)
  private actionStatus = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadWorkspacePreference();
    this.loadWorkspaces();
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory(page: number = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.historyService
      .listHistory({
        page,
        limit: 20,
        status: this.statusFilter || undefined,
        workspaceId: this.selectedWorkspaceId || undefined,
        startDate: this.startDateFilter || undefined,
        endDate: this.endDateFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.historyItems.set(response.items);
          this.pagination.set({
            total: response.total,
            page: response.page,
            limit: response.limit,
            hasMore: response.hasMore
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
    this.loadHistory(1);
  }

  onRefresh(): void {
    this.loadHistory(this.pagination().page);
  }

  onPreviousPage(): void {
    const currentPage = this.pagination().page;
    if (currentPage > 1) {
      this.loadHistory(currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.pagination().hasMore) {
      this.loadHistory(this.pagination().page + 1);
    }
  }

  onViewDetails(item: GenerationHistoryItem): void {
    // TODO: Implementar visualização de detalhes em um dialog ou página separada
    const message = this.translate.instant('generation.history.messages.detailsMessage', { title: item.title });
    const closeLabel = this.translate.instant('generation.history.messages.close');
    this.snackBar.open(message, closeLabel, {
      duration: 3000
    });
  }

  onRegenerate(item: GenerationHistoryItem): void {
    if (this.isActionLoading(item.id)) {
      return;
    }

    this.setActionStatus(item.id, true);

    this.historyService
      .regenerate(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const message = this.translate.instant('generation.history.messages.regenerateSuccess');
          const closeLabel = this.translate.instant('generation.history.messages.close');
          this.snackBar.open(message, closeLabel, {
            duration: 3000
          });
          this.setActionStatus(item.id, false);
          // Opcional: navegar para a página de progresso
          // this.router.navigate(['/app/generation'], { queryParams: { taskId: response.taskId } });
        },
        error: (err: GenerationHistoryError) => {
          this.setActionStatus(item.id, false);
          const errorMessage = err.summary || this.translate.instant('generation.history.messages.regenerateError');
          const closeLabel = this.translate.instant('generation.history.messages.close');
          this.snackBar.open(errorMessage, closeLabel, {
            duration: 4000
          });
        }
      });
  }

  isActionLoading(itemId: string): boolean {
    return this.actionStatus()[itemId] ?? false;
  }

  getStatusLabel(status: GenerationStatus): string {
    const translationKeys: Record<GenerationStatus, string> = {
      queued: 'generation.history.filters.statusQueued',
      processing: 'generation.history.filters.statusProcessing',
      completed: 'generation.history.filters.statusCompleted',
      failed: 'generation.history.filters.statusFailed',
      cancelled: 'generation.history.filters.statusCancelled'
    };
    return this.translate.instant(translationKeys[status] || status);
  }

  getStatusClass(status: GenerationStatus): string {
    return `status-${status}`;
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '-';

    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
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
          this.isLoadingWorkspaces.set(false);
        }
      });
  }

  onWorkspaceChange(): void {
    this.loadHistory(1);
    this.saveWorkspacePreference();
  }

  private saveWorkspacePreference(): void {
    localStorage.setItem('selectedHistoryWorkspaceId', this.selectedWorkspaceId || '');
  }

  private loadWorkspacePreference(): void {
    const saved = localStorage.getItem('selectedHistoryWorkspaceId');
    if (saved !== null) {
      this.selectedWorkspaceId = saved;
    }
  }

  private setActionStatus(id: string, loading: boolean): void {
    this.actionStatus.update((current) => ({
      ...current,
      [id]: loading
    }));
  }

  onExportCSV(): void {
    const items = this.historyItems();
    if (items.length === 0) return;

    const headers = ['Título', 'Template', 'Workspace', 'Status', 'Duração', 'Data de Criação'];
    const rows = items.map((item) => [
      item.title,
      item.templateName,
      item.workspaceName || '-',
      this.getStatusLabel(item.status),
      this.formatDuration(item.duration),
      this.formatDate(item.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `historico_geracoes_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
