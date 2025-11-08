import { Injectable, computed, signal } from '@angular/core';
import { QnaHistoryEntry, QnaError } from '@vectorseek/data-access';

export interface QnaState {
  currentQuestion: string;
  currentAnswer: {
    text: string;
    citations: Array<{
      id: string;
      documentId: string;
      documentName: string;
      chunkText: string;
      score: number;
      metadata?: Record<string, unknown>;
    }>;
    modelUsed?: string;
    provider?: string;
    tokensUsed?: {
      input: number;
      output: number;
    };
  } | null;
  history: QnaHistoryEntry[];
  loading: boolean;
  error: QnaError | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const initialState: QnaState = {
  currentQuestion: '',
  currentAnswer: null,
  history: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  }
};

/**
 * Store para gerenciar estado do módulo Q&A usando Angular Signals
 * Conforme especificação E2-A1
 */
@Injectable({ providedIn: 'root' })
export class QnaStore {
  // Estado privado (writable signals)
  private readonly state = signal<QnaState>(initialState);

  // Selectores públicos (read-only computed signals)
  readonly currentQuestion = computed(() => this.state().currentQuestion);
  readonly currentAnswer = computed(() => this.state().currentAnswer);
  readonly history = computed(() => this.state().history);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly pagination = computed(() => this.state().pagination);

  // Computed values
  readonly hasHistory = computed(() => this.state().history.length > 0);
  readonly hasError = computed(() => this.state().error !== null);
  readonly isFirstPage = computed(() => this.state().pagination.page === 1);
  readonly isLastPage = computed(() => {
    const { page, totalPages } = this.state().pagination;
    return page >= totalPages;
  });

  // Actions
  setCurrentQuestion(question: string): void {
    this.state.update((state) => ({
      ...state,
      currentQuestion: question,
      error: null
    }));
  }

  setCurrentAnswer(answer: QnaState['currentAnswer']): void {
    this.state.update((state) => ({
      ...state,
      currentAnswer: answer,
      error: null
    }));
  }

  setLoading(loading: boolean): void {
    this.state.update((state) => ({
      ...state,
      loading
    }));
  }

  setError(error: QnaError | null): void {
    this.state.update((state) => ({
      ...state,
      error,
      loading: false
    }));
  }

  setHistory(history: QnaHistoryEntry[]): void {
    this.state.update((state) => ({
      ...state,
      history,
      error: null
    }));
  }

  setPagination(pagination: QnaState['pagination']): void {
    this.state.update((state) => ({
      ...state,
      pagination
    }));
  }

  addToHistory(entry: QnaHistoryEntry): void {
    this.state.update((state) => ({
      ...state,
      history: [entry, ...state.history]
    }));
  }

  clearCurrentQuestion(): void {
    this.state.update((state) => ({
      ...state,
      currentQuestion: '',
      currentAnswer: null
    }));
  }

  clearError(): void {
    this.state.update((state) => ({
      ...state,
      error: null
    }));
  }

  reset(): void {
    this.state.set(initialState);
  }

  // Cancelamento de requisições
  private abortController: AbortController | null = null;

  getAbortSignal(): AbortSignal {
    this.abortController = new AbortController();
    return this.abortController.signal;
  }

  cancelPendingRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.setLoading(false);
    }
  }
}
