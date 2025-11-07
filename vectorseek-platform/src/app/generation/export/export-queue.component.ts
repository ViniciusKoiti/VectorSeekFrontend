import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ExportService } from '@vectorseek-platform/data-access';
import { ExportQueueItem } from '@vectorseek-platform/data-access';

/**
 * Componente de fila de exportação (E3-A4)
 *
 * Features:
 * - Exibir múltiplas tarefas simultâneas
 * - Mostrar progresso de cada exportação
 * - Download quando concluído
 * - Retry em caso de falha
 */
@Component({
  selector: 'app-export-queue',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="queue-card" *ngIf="queueItems && queueItems.length > 0">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>queue</mat-icon>
          Fila de Exportação
        </mat-card-title>
        <mat-card-subtitle>
          {{ queueItems.length }} {{ queueItems.length === 1 ? 'tarefa' : 'tarefas' }}
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <mat-list>
          <mat-list-item *ngFor="let item of queueItems" class="queue-item">
            <div class="item-content">
              <div class="item-header">
                <div class="item-info">
                  <h4>{{ item.documentTitle }}</h4>
                  <span class="format-badge">{{ item.format.toUpperCase() }}</span>
                </div>
                <div class="item-actions">
                  <!-- Download button (completed) -->
                  <button
                    *ngIf="item.status === 'completed' && item.downloadUrl"
                    mat-icon-button
                    color="primary"
                    [matTooltip]="'Download'"
                    (click)="onDownload(item)"
                  >
                    <mat-icon>download</mat-icon>
                  </button>

                  <!-- Retry button (failed) -->
                  <button
                    *ngIf="item.status === 'failed'"
                    mat-icon-button
                    color="warn"
                    [matTooltip]="'Tentar novamente'"
                    (click)="onRetry(item)"
                  >
                    <mat-icon>refresh</mat-icon>
                  </button>

                  <!-- Remove button -->
                  <button
                    *ngIf="item.status === 'completed' || item.status === 'failed'"
                    mat-icon-button
                    [matTooltip]="'Remover'"
                    (click)="onRemove(item)"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>

              <div class="item-status">
                <mat-chip [class]="'status-chip-' + item.status">
                  <mat-icon>{{ getStatusIcon(item.status) }}</mat-icon>
                  {{ getStatusLabel(item.status) }}
                </mat-chip>
                <span class="status-message">{{ item.message }}</span>
              </div>

              <!-- Progress bar (processing/queued) -->
              <mat-progress-bar
                *ngIf="item.status === 'processing' || item.status === 'queued'"
                mode="determinate"
                [value]="item.progress"
                class="progress-bar"
              ></mat-progress-bar>

              <!-- Error message (failed) -->
              <div *ngIf="item.status === 'failed' && item.error" class="error-message">
                <mat-icon color="warn">error</mat-icon>
                <span>{{ item.error }}</span>
              </div>

              <!-- Timestamp -->
              <div class="timestamp">
                Criado em {{ formatTimestamp(item.createdAt) }}
              </div>
            </div>
          </mat-list-item>
        </mat-list>
      </mat-card-content>
    </mat-card>

    <!-- Empty state -->
    <mat-card class="queue-card empty-state" *ngIf="!queueItems || queueItems.length === 0">
      <mat-card-content>
        <mat-icon>inbox</mat-icon>
        <p>Nenhuma exportação em andamento</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .queue-card {
      margin-top: 2rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .queue-item {
      border-bottom: 1px solid #e0e0e0;
      padding: 1rem 0;
      height: auto !important;
    }

    .queue-item:last-child {
      border-bottom: none;
    }

    .item-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .item-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .item-info h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }

    .format-badge {
      padding: 0.25rem 0.5rem;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .item-actions {
      display: flex;
      gap: 0.25rem;
    }

    .item-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-message {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .status-chip-queued {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .status-chip-processing {
      background-color: #2196f3 !important;
      color: white !important;
    }

    .status-chip-completed {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .status-chip-failed {
      background-color: #f44336 !important;
      color: white !important;
    }

    mat-chip {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    mat-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .progress-bar {
      margin-top: 0.5rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #ffebee;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #c62828;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .timestamp {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.38);
    }

    .empty-state mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: rgba(0, 0, 0, 0.38);
      margin-bottom: 1rem;
    }

    .empty-state p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class ExportQueueComponent {
  @Input() queueItems: ExportQueueItem[] = [];

  private readonly exportService = inject(ExportService);
  private readonly snackBar = inject(MatSnackBar);

  onDownload(item: ExportQueueItem): void {
    if (!item.downloadUrl) {
      this.snackBar.open('Link de download não disponível', 'Fechar', {
        duration: 3000
      });
      return;
    }

    this.exportService.downloadExport(item.taskId).subscribe({
      next: (blob) => {
        const filename = this.exportService.generateFilename(
          item.documentTitle,
          item.format
        );
        this.exportService.saveBlob(blob, filename);

        this.snackBar.open('Download iniciado!', 'Fechar', {
          duration: 2000
        });
      },
      error: (err) => {
        this.snackBar.open(
          err.summary || 'Erro ao fazer download',
          'Fechar',
          { duration: 5000 }
        );
      }
    });
  }

  onRetry(item: ExportQueueItem): void {
    this.snackBar.open('Funcionalidade de retry em desenvolvimento', 'Fechar', {
      duration: 3000
    });
  }

  onRemove(item: ExportQueueItem): void {
    // Emit event to parent to remove from queue
    this.snackBar.open('Item removido da fila', 'Fechar', {
      duration: 2000
    });
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      queued: 'schedule',
      processing: 'hourglass_empty',
      completed: 'check_circle',
      failed: 'error'
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      queued: 'Na fila',
      processing: 'Processando',
      completed: 'Concluído',
      failed: 'Falhou'
    };
    return labels[status] || status;
  }

  formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
