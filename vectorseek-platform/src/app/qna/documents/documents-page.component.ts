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
  templateUrl: './documents-page.component.html',
  styleUrls: ['./documents-page.component.css']
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
