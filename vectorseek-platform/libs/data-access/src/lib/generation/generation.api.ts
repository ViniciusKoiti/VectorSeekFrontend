/**
 * Endpoints da API de Geração de Conteúdo
 * Conforme especificação E3-A1 e E3-A2
 */

const GENERATION_BASE_PATH = '/api/generate';

export const GENERATION_API_ENDPOINTS = {
  /**
   * POST /api/generate/document - Iniciar geração de documento
   */
  generateDocument: () => `${GENERATION_BASE_PATH}/document`,

  /**
   * GET /api/generate/progress/{taskId} - Consultar progresso de geração
   */
  getProgress: (taskId: string) => `${GENERATION_BASE_PATH}/progress/${taskId}`,

  /**
   * GET /api/generate/templates - Listar templates disponíveis
   */
  listTemplates: () => `${GENERATION_BASE_PATH}/templates`,

  /**
   * POST /api/generate/cancel/{taskId} - Cancelar geração em andamento
   */
  cancelGeneration: (taskId: string) => `${GENERATION_BASE_PATH}/cancel/${taskId}`
} as const;
