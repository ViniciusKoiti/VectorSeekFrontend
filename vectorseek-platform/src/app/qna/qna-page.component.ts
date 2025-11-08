import { Component, OnInit, ViewChild, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QnaService, QnaHistoryEntry } from '@vectorseek/data-access';
import { QnaStore } from '@vectorseek/state';
import { QuestionComposerComponent } from './question-composer.component';
import { AnswerPanelComponent, Answer } from './answer-panel.component';
import { FeedbackDialogComponent, FeedbackFormData } from './feedback-dialog.component';

/**
 * Página principal do módulo Q&A
 * Conforme especificações E2-A1 e E2-A4
 */
@Component({
  selector: 'app-qna-page',
  standalone: true,
  imports: [CommonModule, QuestionComposerComponent, AnswerPanelComponent, FeedbackDialogComponent],
  templateUrl: './qna-page.component.html',
  styleUrls: ['./qna-page.component.css']
})
export class QnaPageComponent implements OnInit {
  @ViewChild(QuestionComposerComponent) composer?: QuestionComposerComponent;
  @ViewChild(FeedbackDialogComponent) feedbackDialog?: FeedbackDialogComponent;

  private readonly qnaService = inject(QnaService);
  readonly store = inject(QnaStore);

  // Feedback state
  showFeedbackDialog = signal(false);
  currentQuestionId = signal<string | null>(null);

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
        this.currentQuestionId.set(response.questionId);

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
    this.showFeedbackDialog.set(true);
  }

  onSubmitFeedback(formData: FeedbackFormData): void {
    if (!this.currentQuestionId()) {
      console.error('No question ID available for feedback');
      return;
    }

    if (this.feedbackDialog) {
      this.feedbackDialog.setLoading(true);
      this.feedbackDialog.setError(null);
    }

    this.qnaService.submitFeedback({
      questionId: this.currentQuestionId()!,
      rating: formData.rating,
      comment: formData.comment
    }).subscribe({
      next: () => {
        if (this.feedbackDialog) {
          this.feedbackDialog.setLoading(false);
        }
        this.showFeedbackDialog.set(false);

        // Reload history to update feedback status
        this.loadHistory();
      },
      error: (error) => {
        if (this.feedbackDialog) {
          this.feedbackDialog.setLoading(false);
          this.feedbackDialog.setError(error);
        }
      }
    });
  }

  onCancelFeedback(): void {
    this.showFeedbackDialog.set(false);
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
