const WORKSPACES_BASE_PATH = '/api/workspaces';

export const WORKSPACES_API_ENDPOINTS = {
  list: () => WORKSPACES_BASE_PATH,
  create: () => WORKSPACES_BASE_PATH,
  update: (id: string) => `${WORKSPACES_BASE_PATH}/${id}`,
  delete: (id: string) => `${WORKSPACES_BASE_PATH}/${id}`
} as const;
