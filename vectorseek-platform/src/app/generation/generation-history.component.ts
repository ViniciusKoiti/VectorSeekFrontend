import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { GenerationService } from '@vectorseek-platform/data-access';
import {
  GenerationHistoryItem,
  ListHistoryRequest
} from '@vectorseek-platform/data-access';

/**
 * Componente de histórico de gerações (E3-A3)
 *
 * Features:
 * - Lista tarefas completas/ativas com atualizações periódicas
 * - Filtros por período de data e provedor
 * - Ordenação por colunas (título, status, provedor, custo, data)
 * - Re-execução de tarefas com parâmetros pré-preenchidos
 * - Exportação para PDF/CSV para auditoria
 */
@Component({
  selector: 'app-generation-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule
  ],
  template: `
    <div class="history-container">
      <header class="history-header">
        <h1>Histórico de Gerações</h1>
        <p class="subtitle">Visualize e gerencie suas gerações anteriores</p>
      </header>

      <!-- Filters Section -->
      <section class="filters-section" aria-label="Filtros de histórico">
        <div class="filters-grid">
          <!-- Date Range Filter -->
          <mat-form-field appearance="outline">
            <mat-label>Data Inicial</mat-label>
            <input
              matInput
              [matDatepicker]="startDatePicker"
              [(ngModel)]="startDate"
              (dateChange)="onFilterChange()"
              placeholder="DD/MM/AAAA"
            />
            <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #startDatePicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Data Final</mat-label>
            <input
              matInput
              [matDatepicker]="endDatePicker"
              [(ngModel)]="endDate"
              (dateChange)="onFilterChange()"
              placeholder="DD/MM/AAAA"
            />
            <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #endDatePicker></mat-datepicker>
          </mat-form-field>

          <!-- Provider Filter -->
          <mat-form-field appearance="outline">
            <mat-label>Provedor</mat-label>
            <mat-select [(ngModel)]="selectedProvider" (selectionChange)="onFilterChange()">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option value="openai">OpenAI</mat-option>
              <mat-option value="anthropic">Anthropic</mat-option>
              <mat-option value="google">Google</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Status Filter -->
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="selectedStatus" (selectionChange)="onFilterChange()">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option value="completed">Concluído</mat-option>
              <mat-option value="failed">Falhou</mat-option>
              <mat-option value="active">Ativo</mat-option>
              <mat-option value="cancelled">Cancelado</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Action Buttons -->
        <div class="filter-actions">
          <button mat-stroked-button (click)="clearFilters()">
            <mat-icon>clear</mat-icon>
            Limpar Filtros
          </button>
          <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
        </div>

        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportHistory('pdf')">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>Exportar como PDF</span>
          </button>
          <button mat-menu-item (click)="exportHistory('csv')">
            <mat-icon>table_chart</mat-icon>
            <span>Exportar como CSV</span>
          </button>
        </mat-menu>
      </section>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Carregando histórico...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-container">
        <mat-icon color="warn">error</mat-icon>
        <h3>{{ error()?.summary }}</h3>
        <p>{{ error()?.description }}</p>
        <button mat-raised-button color="primary" (click)="loadHistory()">
          <mat-icon>refresh</mat-icon>
          Tentar Novamente
        </button>
      </div>

      <!-- Table Section -->
      <section *ngIf="!loading() && !error()" class="table-section">
        <mat-table
          [dataSource]="historyItems()"
          matSort
          (matSortChange)="onSortChange($event)"
          class="history-table"
        >
          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Título</mat-header-cell>
            <mat-cell *matCellDef="let item">
              <div class="title-cell">
                <strong>{{ item.title }}</strong>
                <small>{{ item.templateName }}</small>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Status</mat-header-cell>
            <mat-cell *matCellDef="let item">
              <mat-chip [class]="'status-chip-' + item.status">
                {{ getStatusLabel(item.status) }}
              </mat-chip>
            </mat-cell>
          </ng-container>

          <!-- Provider Column -->
          <ng-container matColumnDef="provider">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Provedor</mat-header-cell>
            <mat-cell *matCellDef="let item">
              <div class="provider-cell">
                {{ item.provider }}
                <small *ngIf="item.model">{{ item.model }}</small>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Cost Column -->
          <ng-container matColumnDef="estimatedCost">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Custo Est.</mat-header-cell>
            <mat-cell *matCellDef="let item">
              <span *ngIf="item.estimatedCost">{{ formatCost(item.estimatedCost) }}</span>
              <span *ngIf="!item.estimatedCost" class="text-muted">N/A</span>
            </mat-cell>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="completedAt">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Concluído Em</mat-header-cell>
            <mat-cell *matCellDef="let item">
              <span *ngIf="item.completedAt">{{ formatDate(item.completedAt) }}</span>
              <span *ngIf="!item.completedAt" class="text-muted">Em andamento</span>
            </mat-cell>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef>Ações</mat-header-cell>
            <mat-cell *matCellDef="let item">
              <button
                mat-icon-button
                [matTooltip]="'Re-executar geração'"
                (click)="reExecuteTask(item)"
                [disabled]="!item.formData"
              >
                <mat-icon>replay</mat-icon>
              </button>
              <button
                mat-icon-button
                [matTooltip]="'Ver detalhes'"
                (click)="viewDetails(item)"
              >
                <mat-icon>visibility</mat-icon>
              </button>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns"></mat-row>
        </mat-table>

        <!-- Empty State -->
        <div *ngIf="historyItems().length === 0" class="empty-state">
          <mat-icon>history</mat-icon>
          <h3>Nenhum histórico encontrado</h3>
          <p>Você ainda não gerou nenhum documento ou os filtros não retornaram resultados.</p>
          <button mat-raised-button color="primary" routerLink="/app/generation">
            <mat-icon>add</mat-icon>
            Criar Nova Geração
          </button>
        </div>

        <!-- Paginator -->
        <mat-paginator
          *ngIf="historyItems().length > 0"
          [length]="totalItems()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [pageIndex]="currentPage()"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      </section>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .history-header {
      margin-bottom: 2rem;
    }

    .history-header h1 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 500;
    }

    .subtitle {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 1rem;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .filter-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .error-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
    }

    .table-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .history-table {
      width: 100%;
    }

    .title-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .title-cell small {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
    }

    .provider-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .provider-cell small {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.75rem;
    }

    .status-chip-completed {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .status-chip-failed {
      background-color: #f44336 !important;
      color: white !important;
    }

    .status-chip-active {
      background-color: #2196f3 !important;
      color: white !important;
    }

    .status-chip-cancelled {
      background-color: #9e9e9e !important;
      color: white !important;
    }

    .text-muted {
      color: rgba(0, 0, 0, 0.38);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.38);
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0 0 2rem;
      color: rgba(0, 0, 0, 0.6);
      max-width: 500px;
    }
  `]
})
export class GenerationHistoryComponent implements OnInit {
  private readonly generationService = inject(GenerationService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  readonly loading = signal<boolean>(false);
  readonly error = signal<any>(null);
  readonly historyItems = signal<GenerationHistoryItem[]>([]);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(25);

  // Filter signals
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedProvider: string | null = null;
  selectedStatus: 'completed' | 'failed' | 'active' | 'cancelled' | null = null;

  // Sort state
  sortBy: 'completedAt' | 'startedAt' | 'title' | 'estimatedCost' = 'completedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  displayedColumns: string[] = [
    'title',
    'status',
    'provider',
    'estimatedCost',
    'completedAt',
    'actions'
  ];

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    const request: ListHistoryRequest = {
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      provider: this.selectedProvider || undefined,
      status: this.selectedStatus || undefined,
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.generationService.listHistory(request).subscribe({
      next: (response) => {
        this.historyItems.set(response.items);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadHistory();
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedProvider = null;
    this.selectedStatus = null;
    this.onFilterChange();
  }

  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy = sort.active as any;
      this.sortOrder = sort.direction as 'asc' | 'desc';
      this.loadHistory();
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadHistory();
  }

  reExecuteTask(item: GenerationHistoryItem): void {
    if (!item.formData) {
      this.snackBar.open('Não foi possível recuperar os dados originais desta geração.', 'Fechar', {
        duration: 3000
      });
      return;
    }

    // Navigate to wizard with pre-filled data
    this.router.navigate(['/app/generation'], {
      state: { formData: item.formData }
    });
  }

  viewDetails(item: GenerationHistoryItem): void {
    // Navigate to details view or show modal
    this.router.navigate(['/app/generation/details', item.id]);
  }

  exportHistory(format: 'pdf' | 'csv'): void {
    this.snackBar.open(`Exportando histórico como ${format.toUpperCase()}...`, '', {
      duration: 2000
    });

    this.generationService
      .exportHistory({
        format,
        startDate: this.startDate?.toISOString(),
        endDate: this.endDate?.toISOString(),
        provider: this.selectedProvider || undefined,
        status: this.selectedStatus || undefined
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `historico-geracoes-${Date.now()}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.snackBar.open('Histórico exportado com sucesso!', 'Fechar', {
            duration: 3000
          });
        },
        error: (err) => {
          this.snackBar.open(
            err.summary || 'Não foi possível exportar o histórico.',
            'Fechar',
            { duration: 5000 }
          );
        }
      });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      completed: 'Concluído',
      failed: 'Falhou',
      active: 'Ativo',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  }

  formatCost(cost: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(cost);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
