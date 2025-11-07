/**
 * Endpoints da API de Geração de Conteúdo
 * Conforme especificação E3-A1, E3-A2, E3-A3 e E3-A4
 */

const GENERATION_BASE_PATH = '/api/generate';
const EXPORT_BASE_PATH = '/api/export';

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
  cancelGeneration: (taskId: string) => `${GENERATION_BASE_PATH}/cancel/${taskId}`,

  /**
   * GET /api/generate/history - Listar histórico de gerações (E3-A3)
   */
  listHistory: () => `${GENERATION_BASE_PATH}/history`,

  /**
   * GET /api/generate/history/export - Exportar histórico (E3-A3)
   */
  exportHistory: () => `${GENERATION_BASE_PATH}/history/export`,

  /**
   * POST /api/export/{format} - Iniciar exportação de documento (E3-A4)
   */
  exportDocument: (format: string) => `${EXPORT_BASE_PATH}/${format}`,

  /**
   * GET /api/export/status/{taskId} - Consultar status de exportação (E3-A4)
   */
  getExportStatus: (taskId: string) => `${EXPORT_BASE_PATH}/status/${taskId}`,

  /**
   * GET /api/export/download/{taskId} - Download do documento exportado (E3-A4)
   */
  downloadExport: (taskId: string) => `${EXPORT_BASE_PATH}/download/${taskId}`
} as const;
