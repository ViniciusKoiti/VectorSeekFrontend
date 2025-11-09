export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthUserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface AuthSession {
  raw?: AuthApiSessionDto;
}

export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type LoginResponse = AuthSession;

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  plan: PlanType;
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

export interface AuthApiSessionDto {
  user_id?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  scopes?: string[];
  issued_at?: string;
  plan?: string | null;
}
