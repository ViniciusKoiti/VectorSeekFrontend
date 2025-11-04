export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface AuthSession {
  user: AuthUserProfile;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type LoginResponse = AuthSession;

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export type RegisterResponse = AuthSession;

export interface RequestMagicLinkRequest {
  email: string;
  redirectUrl?: string;
  locale?: string;
}

export interface RequestMagicLinkResponse {
  message: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export type RefreshResponse = AuthTokens;

export type MeResponse = AuthUserProfile;

export type AuthAction =
  | 'login'
  | 'register'
  | 'requestMagicLink'
  | 'refresh'
  | 'me';

export interface AuthError {
  status: number;
  code: string;
  summary: string;
  description?: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
}

export interface AuthApiErrorPayload {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
  errors?: Record<string, unknown>;
}

export interface AuthApiEnvelope<T> {
  data: T;
}

export interface AuthApiSessionDto {
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

export interface AuthApiProfileDto {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
}

export interface AuthApiTokensDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}
