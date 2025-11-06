import { Component, OnInit, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QnaService, QnaHistoryEntry } from '@vectorseek/data-access';
import { QnaStore } from '@vectorseek/state';
import { QuestionComposerComponent } from './question-composer.component';
import { AnswerPanelComponent, Answer } from './answer-panel.component';

/**
 * Página principal do módulo Q&A
 * Conforme especificação E2-A1
 */
@Component({
  selector: 'app-qna-page',
  standalone: true,
  imports: [CommonModule, QuestionComposerComponent, AnswerPanelComponent],
  template: `
    <div class="qna-page">
      <div class="qna-container">
        <div class="qna-header">
          <h1>Perguntas e Respostas</h1>
          <p class="subtitle">
            Faça perguntas sobre sua base de conhecimento e receba respostas baseadas em documentos
          </p>
        </div>

        <div class="qna-content">
          <!-- Question Composer -->
          <app-question-composer
            (askQuestion)="onAskQuestion($event)"
            (clearQuestion)="onClearQuestion()"
          />

          <!-- Loading State -->
          @if (store.loading()) {
            <div class="loading-panel">
              <div class="spinner-large"></div>
              <p>Processando sua pergunta...</p>
            </div>
          }

          <!-- Answer Panel -->
          @if (store.currentAnswer() && !store.loading()) {
            <app-answer-panel
              [answer]="store.currentAnswer()"
              (copyAnswer)="onCopyAnswer()"
              (requestFeedback)="onRequestFeedback()"
            />
          }

          <!-- History Section -->
          @if (store.hasHistory()) {
            <div class="history-section">
              <div class="history-header">
                <h2>Histórico</h2>
                <button (click)="onRefreshHistory()" class="btn-icon" title="Atualizar">
                  🔄
                </button>
              </div>

              <div class="history-list">
                @for (entry of store.history(); track entry.id) {
                  <div class="history-item" (click)="onSelectHistoryItem(entry)">
                    <div class="history-question">
                      <strong>{{ entry.question.text }}</strong>
                      <span class="history-timestamp">
                        {{ formatTimestamp(entry.timestamp) }}
                      </span>
                    </div>
                    <div class="history-answer-preview">
                      {{ truncateText(entry.answer.text, 150) }}
                    </div>
                    @if (entry.feedbackRating) {
                      <div class="history-rating">
                        ⭐ {{ entry.feedbackRating }}/5
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (store.pagination().totalPages > 1) {
                <div class="pagination">
                  <button
                    (click)="onPreviousPage()"
                    [disabled]="store.isFirstPage()"
                    class="btn btn-secondary"
                  >
                    ← Anterior
                  </button>
                  <span class="pagination-info">
                    Página {{ store.pagination().page }} de {{ store.pagination().totalPages }}
                  </span>
                  <button
                    (click)="onNextPage()"
                    [disabled]="store.isLastPage()"
                    class="btn btn-secondary"
                  >
                    Próxima →
                  </button>
                </div>
              }
            </div>
          }

          <!-- Empty State -->
          @if (!store.hasHistory() && !store.loading() && !store.currentAnswer()) {
            <div class="empty-state">
              <div class="empty-icon">💬</div>
              <h3>Nenhuma pergunta ainda</h3>
              <p>Faça sua primeira pergunta para começar</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .qna-page {
        min-height: 100vh;
        background: #f5f5f5;
        padding: 2rem;
      }

      .qna-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .qna-header {
        margin-bottom: 2rem;
      }

      .qna-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        color: #1a1a1a;
      }

      .subtitle {
        margin: 0;
        color: #666;
        font-size: 1rem;
      }

      .qna-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .loading-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .spinner-large {
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

      .loading-panel p {
        margin: 1rem 0 0 0;
        color: #666;
      }

      .history-section {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .history-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1a1a1a;
      }

      .btn-icon {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .btn-icon:hover {
        background: #f5f5f5;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .history-item {
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .history-item:hover {
        border-color: #4a90e2;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .history-question {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }

      .history-question strong {
        flex: 1;
        color: #1a1a1a;
      }

      .history-timestamp {
        font-size: 0.875rem;
        color: #999;
        white-space: nowrap;
        margin-left: 1rem;
      }

      .history-answer-preview {
        color: #666;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .history-rating {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #f59e0b;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e0e0e0;
      }

      .pagination-info {
        color: #666;
        font-size: 0.9rem;
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

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .empty-state p {
        margin: 0;
        color: #666;
      }
    `
  ]
})
export class QnaPageComponent implements OnInit {
  @ViewChild(QuestionComposerComponent) composer?: QuestionComposerComponent;

  private readonly qnaService = inject(QnaService);
  readonly store = inject(QnaStore);

  constructor() {
    // Effect to handle store errors and update composer
    effect(() => {
      const error = this.store.error();
      if (error && this.composer) {
        this.composer.setError(error);
        this.composer.setDisabled(false);
      }
    });

    // Effect to handle loading state
    effect(() => {
      const loading = this.store.loading();
      if (this.composer) {
        this.composer.setDisabled(loading);
      }
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  onAskQuestion(question: string): void {
    this.store.setCurrentQuestion(question);
    this.store.setLoading(true);
    this.store.clearError();

    this.qnaService.ask({ question }).subscribe({
      next: (response) => {
        this.store.setCurrentAnswer(response.answer);
        this.store.setLoading(false);

        // Optionally reload history to include the new question
        this.loadHistory();
      },
      error: (error) => {
        this.store.setError(error);
      }
    });
  }

  onClearQuestion(): void {
    this.store.clearCurrentQuestion();
    this.store.clearError();
  }

  onCopyAnswer(): void {
    // Could track analytics here
    console.log('Answer copied to clipboard');
  }

  onRequestFeedback(): void {
    // TODO: Implement feedback modal (E2-A4)
    console.log('Feedback requested');
  }

  onSelectHistoryItem(entry: QnaHistoryEntry): void {
    this.store.setCurrentQuestion(entry.question.text);
    this.store.setCurrentAnswer(entry.answer);
  }

  onRefreshHistory(): void {
    this.loadHistory();
  }

  onPreviousPage(): void {
    const currentPage = this.store.pagination().page;
    if (currentPage > 1) {
      this.loadHistory(currentPage - 1);
    }
  }

  onNextPage(): void {
    const currentPage = this.store.pagination().page;
    const totalPages = this.store.pagination().totalPages;
    if (currentPage < totalPages) {
      this.loadHistory(currentPage + 1);
    }
  }

  private loadHistory(page: number = 1, pageSize: number = 10): void {
    this.qnaService.getHistory({ page, pageSize, sortBy: 'timestamp', sortOrder: 'desc' }).subscribe({
      next: (response) => {
        // Map response to QnaHistoryEntry format
        const entries: QnaHistoryEntry[] = response.entries.map((entry) => ({
          id: entry.id,
          question: {
            id: entry.question.id,
            text: entry.question.text,
            timestamp: new Date(entry.question.timestamp),
            filters: entry.question.filters
              ? {
                  workspaceId: entry.question.filters.workspaceId,
                  documentIds: entry.question.filters.documentIds,
                  dateRange: entry.question.filters.dateRange
                    ? {
                        start: new Date(entry.question.filters.dateRange.start),
                        end: new Date(entry.question.filters.dateRange.end)
                      }
                    : undefined
                }
              : undefined
          },
          answer: entry.answer,
          timestamp: new Date(entry.timestamp),
          feedbackRating: entry.feedbackRating,
          feedbackComment: entry.feedbackComment
        }));

        this.store.setHistory(entries);
        this.store.setPagination(response.pagination);
      },
      error: (error) => {
        console.error('Error loading history:', error);
      }
    });
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d atrás`;
    } else if (hours > 0) {
      return `${hours}h atrás`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m atrás`;
    }
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
