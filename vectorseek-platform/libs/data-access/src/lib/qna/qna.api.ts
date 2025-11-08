/**
 * Endpoints da API Q&A
 * Conforme especificação E2-A1
 */

const QNA_BASE_PATH = '/api/qna';

export const QNA_API_ENDPOINTS = {
  /**
   * POST /api/qna/ask - Fazer uma pergunta
   */
  ask: () => `${QNA_BASE_PATH}/ask`,

  /**
   * GET /api/qna/history - Buscar histórico de perguntas
   */
  history: () => `${QNA_BASE_PATH}/history`,

  /**
   * POST /api/qna/feedback - Enviar feedback sobre uma resposta
   */
  feedback: () => `${QNA_BASE_PATH}/feedback`
} as const;
