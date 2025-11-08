/**
 * Endpoints da API de Documentos
 * Conforme especificação E2-A3
 */

const DOCUMENTS_BASE_PATH = '/api/documents';

export const DOCUMENTS_API_ENDPOINTS = {
  /**
   * GET /api/documents - Listar documentos
   */
  list: () => `${DOCUMENTS_BASE_PATH}`,

  /**
   * GET /api/documents/:id - Detalhe de documento
   */
  detail: (id: string) => `${DOCUMENTS_BASE_PATH}/${id}`,

  /**
   * POST /api/documents/:id/reprocess - Reprocessar documento
   */
  reprocess: (id: string) => `${DOCUMENTS_BASE_PATH}/${id}/reprocess`,

  /**
   * DELETE /api/documents/:id - Deletar documento
   */
  delete: (id: string) => `${DOCUMENTS_BASE_PATH}/${id}`,

  /**
   * GET /api/workspaces - Listar workspaces
   */
  workspaces: () => '/api/workspaces'
} as const;
