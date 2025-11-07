/**
 * Modelos e interfaces para o módulo Q&A
 * Conforme especificação E2-A1
 */

// === Tipos de domínio ===

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  chunkText: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface Answer {
  text: string;
  citations: Citation[];
  modelUsed?: string;
  provider?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface Question {
  id: string;
  text: string;
  timestamp: Date;
  filters?: QuestionFilters;
}

export interface QuestionFilters {
  workspaceId?: string;
  documentIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface QnaHistoryEntry {
  id: string;
  question: Question;
  answer: Answer;
  timestamp: Date;
  feedbackRating?: number;
  feedbackComment?: string;
}

// === Request/Response DTOs ===

export interface AskQuestionRequest {
  question: string;
  filters?: {
    workspaceId?: string;
    documentIds?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  modelOverride?: string;
}

export interface AskQuestionResponse {
  questionId: string;
  answer: {
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
  };
}

export interface QnaHistoryRequest {
  page?: number;
  pageSize?: number;
  sortBy?: 'timestamp' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface QnaHistoryResponse {
  entries: Array<{
    id: string;
    question: {
      id: string;
      text: string;
      timestamp: string;
      filters?: {
        workspaceId?: string;
        documentIds?: string[];
        dateRange?: {
          start: string;
          end: string;
        };
      };
    };
    answer: {
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
    };
    timestamp: string;
    feedbackRating?: number;
    feedbackComment?: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface SubmitFeedbackRequest {
  questionId: string;
  rating: number;
  comment?: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
}

// === Tipos de erro ===

export type QnaAction = 'ask' | 'history' | 'feedback';

export interface QnaError {
  status: number;
  code: string;
  summary: string;
  description?: string;
  retryAfterSeconds?: number;
}

export interface QnaApiErrorPayload {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface QnaApiEnvelope<T> {
  data: T;
}
