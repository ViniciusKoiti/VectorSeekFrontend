/**
 * Modelos e interfaces para o módulo de Geração de Conteúdo
 * Conforme especificação E3-A1 e E3-A2
 */

// === Tipos de domínio ===

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: TemplateVariable[];
  previewExample?: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;
  description?: string;
  options?: string[];
  defaultValue?: string | number;
}

export interface GenerationFormData {
  title: string;
  briefing: string;
  templateId: string;
  customVariables: Record<string, string | number>;
  modelOverride?: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'text';
  templateUsed: string;
  metadata?: {
    modelUsed?: string;
    provider?: string;
    tokensUsed?: {
      input: number;
      output: number;
    };
    generatedAt: string;
  };
}

export interface GenerationProgress {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: 'context' | 'rendering' | 'completed';
  percentage: number;
  message: string;
  eta?: number; // segundos estimados
  result?: GeneratedDocument;
  error?: string;
}

// === Request/Response DTOs ===

export interface GenerateDocumentRequest {
  title: string;
  briefing: string;
  templateId: string;
  customVariables?: Record<string, string | number>;
  modelOverride?: string;
}

export interface GenerateDocumentResponse {
  taskId: string;
  status: 'queued' | 'processing';
  message: string;
}

export interface GetProgressRequest {
  taskId: string;
}

export interface GetProgressResponse {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: 'context' | 'rendering' | 'completed';
  percentage: number;
  message: string;
  eta?: number;
  result?: {
    id: string;
    title: string;
    content: string;
    format: 'markdown' | 'html' | 'text';
    templateUsed: string;
    metadata?: {
      modelUsed?: string;
      provider?: string;
      tokensUsed?: {
        input: number;
        output: number;
      };
      generatedAt: string;
    };
  };
  error?: string;
}

export interface ListTemplatesRequest {
  category?: string;
  search?: string;
}

export interface ListTemplatesResponse {
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    variables: Array<{
      name: string;
      label: string;
      type: 'text' | 'textarea' | 'select' | 'number';
      required: boolean;
      description?: string;
      options?: string[];
      defaultValue?: string | number;
    }>;
    previewExample?: string;
  }>;
}

export interface CancelGenerationRequest {
  taskId: string;
}

export interface CancelGenerationResponse {
  success: boolean;
  message: string;
}

// === Tipos de erro ===

export type GenerationAction = 'generate' | 'progress' | 'templates' | 'cancel';

export interface GenerationError {
  status: number;
  code: string;
  summary: string;
  description?: string;
  retryAfterSeconds?: number;
}

export interface GenerationApiErrorPayload {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface GenerationApiEnvelope<T> {
  data: T;
}
