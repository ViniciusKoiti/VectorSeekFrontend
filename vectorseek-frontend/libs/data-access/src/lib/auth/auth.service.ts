import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  AuthAction,
  AuthApiEnvelope,
  AuthApiErrorPayload,
  AuthApiProfileDto,
  AuthApiSessionDto,
  AuthApiTokensDto,
  AuthError,
  AuthSession,
  AuthTokens,
  AuthUserProfile,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  RequestMagicLinkRequest,
  RequestMagicLinkResponse,
} from './auth.models';
import { AUTH_API_ENDPOINTS } from './auth.api';

interface AuthErrorMessageConfig {
  summary: string;
  description: string;
}

const ACTION_ERROR_MESSAGES: Record<
  AuthAction,
  { default: AuthErrorMessageConfig } & Partial<Record<number, AuthErrorMessageConfig>>
> = {
  login: {
    default: {
      summary: 'Não foi possível entrar agora',
      description: 'Tente novamente em instantes ou entre em contato com o suporte.',
    },
    401: {
      summary: 'Credenciais inválidas',
      description: 'Verifique e-mail e senha informados e tente novamente.',
    },
    429: {
      summary: 'Muitas tentativas de login',
      description: 'Aguarde alguns instantes antes de tentar novamente.',
    },
  },
  register: {
    default: {
      summary: 'Não foi possível concluir o cadastro',
      description: 'Revise os dados informados ou tente mais tarde.',
    },
    422: {
      summary: 'Dados inválidos',
      description: 'Algumas informações precisam de atenção antes de continuar.',
    },
  },
  requestMagicLink: {
    default: {
      summary: 'Não foi possível enviar o link mágico',
      description: 'Tente novamente em instantes ou valide o endereço de e-mail.',
    },
    429: {
      summary: 'Muitas solicitações',
      description: 'Aguarde alguns instantes antes de tentar novamente.',
    },
  },
  refresh: {
    default: {
      summary: 'Sessão expirada',
      description: 'Faça login novamente para continuar navegando.',
    },
    401: {
      summary: 'Sessão inválida',
      description: 'Faça login novamente para recuperar o acesso.',
    },
  },
  me: {
    default: {
      summary: 'Não foi possível carregar o perfil',
      description: 'Recarregue a página ou tente novamente mais tarde.',
    },
    401: {
      summary: 'Sessão inválida',
      description: 'Faça login novamente para recuperar o acesso.',
    },
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<AuthApiEnvelope<AuthApiSessionDto>>(AUTH_API_ENDPOINTS.login(), payload)
      .pipe(map((response) => this.mapSessionResponse(response.data)), catchError((error) => this.handleError('login', error)));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<AuthApiEnvelope<AuthApiSessionDto>>(AUTH_API_ENDPOINTS.register(), payload)
      .pipe(map((response) => this.mapSessionResponse(response.data)), catchError((error) => this.handleError('register', error)));
  }

  requestMagicLink(payload: RequestMagicLinkRequest): Observable<RequestMagicLinkResponse> {
    return this.http
      .post<AuthApiEnvelope<{ message: string }>>(AUTH_API_ENDPOINTS.requestMagicLink(), payload)
      .pipe(
        map((response) => ({ message: response.data.message } as RequestMagicLinkResponse)),
        catchError((error) => this.handleError('requestMagicLink', error)),
      );
  }

  refresh(payload: RefreshRequest): Observable<RefreshResponse> {
    return this.http
      .post<AuthApiEnvelope<AuthApiTokensDto>>(AUTH_API_ENDPOINTS.refresh(), payload)
      .pipe(map((response) => this.mapTokens(response.data)), catchError((error) => this.handleError('refresh', error)));
  }

  me(): Observable<MeResponse> {
    return this.http
      .get<AuthApiEnvelope<AuthApiProfileDto>>(AUTH_API_ENDPOINTS.me())
      .pipe(map((response) => this.mapProfile(response.data)), catchError((error) => this.handleError('me', error)));
  }

  private mapSessionResponse(dto: AuthApiSessionDto): AuthSession {
    return {
      tokens: this.mapTokens(dto.tokens),
      user: this.mapProfile(dto.user),
    };
  }

  private mapTokens(dto: AuthApiTokensDto): AuthTokens {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      expiresIn: dto.expires_in,
      tokenType: dto.token_type,
    };
  }

  private mapProfile(dto: AuthApiProfileDto): AuthUserProfile {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.full_name,
      avatarUrl: dto.avatar_url ?? null,
    };
  }

  private handleError(action: AuthAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: AuthAction, error: unknown): AuthError {
    if (!(error instanceof HttpErrorResponse)) {
      const fallback = ACTION_ERROR_MESSAGES[action].default;
      return {
        status: 0,
        code: 'unexpected_error',
        summary: fallback.summary,
        description: fallback.description,
      };
    }

    const retryAfterSeconds = this.extractRetryAfterSeconds(error.headers);
    const status = error.status ?? 0;
    const payload = this.extractApiErrorPayload(error.error);
    const messageConfig = ACTION_ERROR_MESSAGES[action][status] ?? ACTION_ERROR_MESSAGES[action].default;

    return {
      status,
      code: payload.code ?? `http_${status || 0}`,
      summary: messageConfig.summary,
      description: payload.message ?? messageConfig.description,
      fieldErrors: payload.details,
      retryAfterSeconds: retryAfterSeconds ?? undefined,
    };
  }

  private extractRetryAfterSeconds(headers: HttpHeaders | null | undefined): number | null {
    if (!headers) {
      return null;
    }
    const value = headers.get('Retry-After');
    if (!value) {
      return null;
    }

    const parsedSeconds = Number(value);
    if (!Number.isNaN(parsedSeconds)) {
      return parsedSeconds;
    }

    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      const diffMs = parsedDate - Date.now();
      return diffMs > 0 ? Math.round(diffMs / 1000) : 0;
    }

    return null;
  }

  private extractApiErrorPayload(payload: unknown): {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  } {
    if (!payload) {
      return {};
    }

    if (typeof payload === 'string') {
      return { message: payload };
    }

    if (typeof payload !== 'object') {
      return {};
    }

    const maybeEnvelope = payload as { error?: AuthApiErrorPayload; message?: string; code?: string; details?: Record<string, unknown>; errors?: Record<string, unknown> };
    const nested = maybeEnvelope.error ?? maybeEnvelope;

    const code = typeof nested.code === 'string' ? nested.code : typeof (nested as { error?: string }).error === 'string' ? (nested as { error?: string }).error : typeof maybeEnvelope.code === 'string' ? maybeEnvelope.code : undefined;
    const message = typeof nested.message === 'string' ? nested.message : typeof maybeEnvelope.message === 'string' ? maybeEnvelope.message : undefined;
    const detailsSource = nested.details ?? nested.errors ?? maybeEnvelope.details ?? maybeEnvelope.errors;

    return {
      code,
      message,
      details: this.normalizeDetails(detailsSource),
    };
  }

  private normalizeDetails(details: Record<string, unknown> | undefined): Record<string, string[]> | undefined {
    if (!details || typeof details !== 'object') {
      return undefined;
    }

    const entries = Object.entries(details).reduce<Record<string, string[]>>((accumulator, [key, value]) => {
      if (Array.isArray(value)) {
        const values = value.map((item) => String(item)).filter((item) => item.length > 0);
        if (values.length) {
          accumulator[key] = values;
        }
      } else if (value != null) {
        const coerced = String(value);
        if (coerced.length) {
          accumulator[key] = [coerced];
        }
      }
      return accumulator;
    }, {});

    return Object.keys(entries).length ? entries : undefined;
  }
}
