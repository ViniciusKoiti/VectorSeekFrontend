export const AUTH_API_BASE_PATH = '/api/auth';

export const AUTH_API_ENDPOINTS = {
  login: () => `${AUTH_API_BASE_PATH}/login`,
  register: () => `${AUTH_API_BASE_PATH}/register`,
  requestMagicLink: () => `${AUTH_API_BASE_PATH}/magic-link`,
  refresh: () => `${AUTH_API_BASE_PATH}/refresh`,
  me: () => `${AUTH_API_BASE_PATH}/me`,
  googleOAuthAuthorize: () => `${AUTH_API_BASE_PATH}/oauth/google/authorize`,
  googleOAuthCallback: () => `${AUTH_API_BASE_PATH}/oauth/google/callback`,
  googleOAuthLink: () => `${AUTH_API_BASE_PATH}/oauth/google/link`
} as const;

export type AuthEndpointKey = keyof typeof AUTH_API_ENDPOINTS;
