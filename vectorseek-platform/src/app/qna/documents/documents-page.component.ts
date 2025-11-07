import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService, Document, DocumentStatus } from '@vectorseek/data-access';

/**
 * Página de gestão de documentos vetorados
 * Conforme especificação E2-A3 (versão simplificada)
 */
@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="documents-page">
      <div class="documents-container">
        <div class="documents-header">
          <h1>Documentos Vetorados</h1>
          <p class="subtitle">Gerencie os documentos indexados na base de conhecimento</p>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select id="status-filter" [(ngModel)]="statusFilter" (change)="onFilterChange()">
              <option value="">Todos</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="error">Erro</option>
              <option value="pending">Pendente</option>
            </select>
          </div>

          <div class="filter-actions">
            <button (click)="onRefresh()" class="btn btn-secondary">
              🔄 Atualizar
            </button>
            <button (click)="onExportCSV()" class="btn btn-secondary" [disabled]="documents().length === 0">
              📥 Exportar CSV
            </button>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-panel">
            <div class="spinner"></div>
            <p>Carregando documentos...</p>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="error-panel">
            <span class="error-icon">⚠️</span>
            <div class="error-content">
              <strong>{{ error()?.summary }}</strong>
              @if (error()?.description) {
                <p>{{ error()?.description }}</p>
              }
            </div>
          </div>
        }

        <!-- Documents Table -->
        @if (!loading() && !error() && documents().length > 0) {
          <div class="table-container">
            <table class="documents-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Status</th>
                  <th>Tamanho</th>
                  <th>Workspace</th>
                  <th>Data de Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documents(); track doc.id) {
                  <tr>
                    <td class="doc-title">{{ doc.title }}</td>
                    <td>
                      <span class="status-badge" [attr.data-status]="doc.status">
                        {{ getStatusLabel(doc.status) }}
                      </span>
                    </td>
                    <td>{{ formatSize(doc.size) }}</td>
                    <td>{{ doc.workspaceName || '-' }}</td>
                    <td>{{ formatDate(doc.createdAt) }}</td>
                    <td class="actions-cell">
                      <button (click)="onViewDetails(doc)" class="btn-icon" title="Ver detalhes">
                        👁️
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (pagination().totalPages > 1) {
            <div class="pagination">
              <button
                (click)="onPreviousPage()"
                [disabled]="pagination().page === 1"
                class="btn btn-secondary"
              >
                ← Anterior
              </button>
              <span class="pagination-info">
                Página {{ pagination().page }} de {{ pagination().totalPages }}
                ({{ pagination().total }} documentos)
              </span>
              <button
                (click)="onNextPage()"
                [disabled]="pagination().page >= pagination().totalPages"
                class="btn btn-secondary"
              >
                Próxima →
              </button>
            </div>
          }
        }

        <!-- Empty State -->
        @if (!loading() && !error() && documents().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <h3>Nenhum documento encontrado</h3>
            <p>Nenhum documento foi indexado ainda ou não corresponde aos filtros aplicados</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .documents-page {
        min-height: 100vh;
        background: #f5f5f5;
        padding: 2rem;
      }

      .documents-container {
        max-width: 1400px;
        margin: 0 auto;
      }

      .documents-header {
        margin-bottom: 2rem;
      }

      .documents-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        color: #1a1a1a;
      }

      .subtitle {
        margin: 0;
        color: #666;
        font-size: 1rem;
      }

      .filters-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .filter-group label {
        font-weight: 500;
        color: #333;
      }

      .filter-group select {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .filter-actions {
        display: flex;
        gap: 0.75rem;
      }

      .table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .documents-table {
        width: 100%;
        border-collapse: collapse;
      }

      .documents-table thead {
        background: #f5f5f5;
      }

      .documents-table th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #e0e0e0;
      }

      .documents-table td {
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
      }

      .documents-table tbody tr:hover {
        background: #fafafa;
      }

      .doc-title {
        font-weight: 500;
        color: #1a1a1a;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .status-badge[data-status='completed'] {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .status-badge[data-status='processing'] {
        background: #fff3e0;
        color: #ef6c00;
      }

      .status-badge[data-status='error'] {
        background: #ffebee;
        color: #c62828;
      }

      .status-badge[data-status='pending'] {
        background: #e3f2fd;
        color: #1976d2;
      }

      .actions-cell {
        width: 100px;
      }

      .btn-icon {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .btn-icon:hover {
        background: #f5f5f5;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #f5f5f5;
        color: #666;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e0e0e0;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .pagination-info {
        color: #666;
        font-size: 0.9rem;
      }

      .loading-panel,
      .error-panel,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(74, 144, 226, 0.2);
        border-top-color: #4a90e2;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-panel p,
      .error-panel p,
      .empty-state p {
        margin: 1rem 0 0 0;
        color: #666;
      }

      .error-panel {
        flex-direction: row;
        gap: 1rem;
        background: #fff3f3;
        border: 1px solid #ffcdd2;
        color: #c62828;
      }

      .error-icon {
        font-size: 2rem;
      }

      .error-content {
        flex: 1;
      }

      .error-content strong {
        display: block;
        margin-bottom: 0.5rem;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }
    `
  ]
})
export class DocumentsPageComponent implements OnInit {
  private readonly documentsService = inject(DocumentsService);

  documents = signal<Document[]>([]);
  loading = signal(false);
  error = signal<{ summary: string; description?: string } | null>(null);
  pagination = signal({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  statusFilter: DocumentStatus | '' = '';

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(page: number = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentsService
      .listDocuments({
        page,
        pageSize: 20,
        status: this.statusFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      .subscribe({
        next: (response) => {
          // Map to Document format
          const docs: Document[] = response.documents.map((doc) => ({
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            indexedAt: doc.indexedAt ? new Date(doc.indexedAt) : undefined
          }));

          this.documents.set(docs);
          this.pagination.set(response.pagination);
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
    console.log('View details for document:', doc.id);
    // TODO: Implement detail modal or navigation
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
      error: 'Erro',
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
}
