export const AUTH_API_BASE_PATH = '/api/auth';

export const AUTH_API_ENDPOINTS = {
  login: () => `${AUTH_API_BASE_PATH}/login`,
  register: () => `${AUTH_API_BASE_PATH}/register`,
  requestMagicLink: () => `${AUTH_API_BASE_PATH}/magic-link`,
  refresh: () => `${AUTH_API_BASE_PATH}/refresh`,
  me: () => `${AUTH_API_BASE_PATH}/me`
} as const;

export type AuthEndpointKey = keyof typeof AUTH_API_ENDPOINTS;
