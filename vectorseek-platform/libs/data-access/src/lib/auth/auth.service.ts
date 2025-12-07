import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  AuthAction,
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
  GoogleOAuthAuthorizeRequest,
  GoogleOAuthAuthorizeResponse,
  GoogleOAuthCallbackRequest,
  GoogleOAuthCallbackResponse,
  GoogleOAuthLinkRequest,
  GoogleOAuthLinkResponse
} from './auth.models';
import { AUTH_API_ENDPOINTS } from './auth.api';

interface AuthErrorMessageConfig {
  summary: string;
  description: string;
}

const USER_ALREADY_EXISTS_ERROR_MESSAGE: AuthErrorMessageConfig = {
  summary: 'E-mail já cadastrado',
  description: 'Use outro endereço ou faça login caso já possua uma conta.'
};

const ACTION_ERROR_MESSAGES: Record<
  AuthAction,
  { default: AuthErrorMessageConfig } & Partial<Record<number, AuthErrorMessageConfig>>
> = {
  login: {
    default: {
      summary: 'Não foi possível entrar agora',
      description: 'Tente novamente em instantes ou entre em contato com o suporte.'
    },
    401: {
      summary: 'Credenciais inválidas',
      description: 'Verifique e-mail e senha informados e tente novamente.'
    },
    429: {
      summary: 'Muitas tentativas de login',
      description: 'Aguarde alguns instantes antes de tentar novamente.'
    }
  },
  register: {
    default: {
      summary: 'Não foi possível concluir o cadastro',
      description: 'Revise os dados informados ou tente mais tarde.'
    },
    409: USER_ALREADY_EXISTS_ERROR_MESSAGE,
    422: {
      summary: 'Dados inválidos',
      description: 'Algumas informações precisam de atenção antes de continuar.'
    }
  },
  requestMagicLink: {
    default: {
      summary: 'Não foi possível enviar o link mágico',
      description: 'Tente novamente em instantes ou valide o endereço de e-mail.'
    },
    429: {
      summary: 'Muitas solicitações',
      description: 'Aguarde alguns instantes antes de tentar novamente.'
    }
  },
  refresh: {
    default: {
      summary: 'Sessão expirada',
      description: 'Faça login novamente para continuar navegando.'
    },
    401: {
      summary: 'Sessão inválida',
      description: 'Faça login novamente para recuperar o acesso.'
    }
  },
  me: {
    default: {
      summary: 'Não foi possível carregar o perfil',
      description: 'Recarregue a página ou tente novamente mais tarde.'
    },
    401: {
      summary: 'Sessão inválida',
      description: 'Faça login novamente para recuperar o acesso.'
    }
  },
  googleOAuth: {
    default: {
      summary: 'Não foi possível entrar com o Google',
      description: 'Tente novamente em instantes ou entre em contato com o suporte.'
    },
    400: {
      summary: 'Solicitação inválida',
      description: 'Verifique os dados e tente novamente.'
    },
    401: {
      summary: 'Autorização negada',
      description: 'Acesso negado pelo Google ou credenciais inválidas.'
    },
    429: {
      summary: 'Muitas tentativas',
      description: 'Aguarde alguns instantes antes de tentar novamente.'
    }
  }
};

const ACTION_ERROR_CODE_MESSAGES: Partial<Record<AuthAction, Record<string, AuthErrorMessageConfig>>> = {
  register: {
    user_already_exists: USER_ALREADY_EXISTS_ERROR_MESSAGE,
    useralreadyexistserror: USER_ALREADY_EXISTS_ERROR_MESSAGE,
    user_exists: USER_ALREADY_EXISTS_ERROR_MESSAGE
  }
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<AuthApiSessionDto>(AUTH_API_ENDPOINTS.login(), payload)
      .pipe(
        map((response) => {
          const mapped = this.mapSessionResponse(response);
          return mapped;
        }),
        catchError((error) => this.handleError('login', error))
      );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<AuthApiSessionDto>(AUTH_API_ENDPOINTS.register(), payload)
      .pipe(
        map((response) => this.mapSessionResponse(response)),
        catchError((error) => this.handleError('register', error))
      );
  }

  requestMagicLink(payload: RequestMagicLinkRequest): Observable<RequestMagicLinkResponse> {
    return this.http
      .post<{ message: string }>(AUTH_API_ENDPOINTS.requestMagicLink(), payload)
      .pipe(
        map((response) => ({ message: response.message } as RequestMagicLinkResponse)),
        catchError((error) => this.handleError('requestMagicLink', error))
      );
  }

  refresh(payload: RefreshRequest): Observable<RefreshResponse> {
    return this.http
      .post<AuthApiTokensDto>(AUTH_API_ENDPOINTS.refresh(), payload)
      .pipe(
        map((response) => this.mapTokens(response)),
        catchError((error) => this.handleError('refresh', error))
      );
  }

  me(): Observable<MeResponse> {
    return this.http
      .get<AuthApiProfileDto>(AUTH_API_ENDPOINTS.me())
      .pipe(
        map((response) => this.mapProfile(response)),
        catchError((error) => this.handleError('me', error))
      );
  }

  googleOAuthAuthorize(payload: GoogleOAuthAuthorizeRequest): Observable<GoogleOAuthAuthorizeResponse> {
    return this.http
      .get<GoogleOAuthAuthorizeResponse>(AUTH_API_ENDPOINTS.googleOAuthAuthorize(), {
        params: {
          ...(payload.redirect_uri && { redirect_uri: payload.redirect_uri }),
          ...(payload.scope && { scope: payload.scope })
        }
      })
      .pipe(
        catchError((error) => this.handleError('googleOAuth', error))
      );
  }

  googleOAuthCallback(payload: GoogleOAuthCallbackRequest): Observable<GoogleOAuthCallbackResponse> {
    return this.http
      .get<GoogleOAuthCallbackResponse>(AUTH_API_ENDPOINTS.googleOAuthCallback(), {
        params: {
          code: payload.code,
          state: payload.state
        }
      })
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError('googleOAuth', error))
      );
  }

  googleOAuthLink(payload: GoogleOAuthLinkRequest): Observable<GoogleOAuthLinkResponse> {
    return this.http
      .post<GoogleOAuthLinkResponse>(AUTH_API_ENDPOINTS.googleOAuthLink(), {
        code: payload.code,
        state: payload.state
      })
      .pipe(
        catchError((error) => this.handleError('googleOAuth', error))
      );
  }

  private mapSessionResponse(dto: AuthApiSessionDto): AuthSession {
    return {
      raw: dto
    };
  }
  
  private mapTokens(dto: AuthApiTokensDto): AuthTokens {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      expiresIn: dto.expires_in,
      tokenType: dto.token_type
    };
  }
  

  
  private mapProfile(dto: AuthApiProfileDto): AuthUserProfile {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.full_name,
      avatarUrl: dto.avatar_url ?? null
    };
  }
  
  private handleError(action: AuthAction, error: unknown): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  private normalizeError(action: AuthAction, error: unknown): AuthError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        status: 0,
        code: 'unexpected_error',
        summary: `auth.apiErrors.${action}.default.summary`,
        description: `auth.apiErrors.${action}.default.description`
      };
    }

    const retryAfterSeconds = this.extractRetryAfterSeconds(error.headers);
    const status = error.status ?? 0;
    const payload = this.extractApiErrorPayload(error.error);
    const errorKey = this.buildErrorKey(action, status, payload.code);

    return {
      status,
      code: payload.code ?? `http_${status || 0}`,
      summary: `${errorKey}.summary`,
      description: `${errorKey}.description`,
      fieldErrors: payload.details,
      retryAfterSeconds: retryAfterSeconds ?? undefined
    };
  } 
  private buildErrorKey(action: AuthAction, status: number, code?: string): string {
    const baseKey = `auth.apiErrors.${action}`;
    
    if (code) {
      return `${baseKey}.${code}`;
    }

    // Depois tenta status HTTP
    if (status && status !== 0) {
      return `${baseKey}.${status}`;
    }

    // Por último usa padrão
    return `${baseKey}.default`;
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

    const maybeEnvelope = payload as {
      error?: AuthApiErrorPayload;
      message?: string;
      code?: string;
      details?: Record<string, unknown>;
      errors?: Record<string, unknown>;
      detail?: unknown;
    };
    const nested = (maybeEnvelope.error as (AuthApiErrorPayload & { detail?: unknown })) ?? maybeEnvelope;

    const code =
      typeof nested.code === 'string'
        ? nested.code
        : typeof (nested as { error?: string }).error === 'string'
          ? (nested as { error?: string }).error
          : typeof maybeEnvelope.code === 'string'
            ? maybeEnvelope.code
            : undefined;

    const detailValue = (nested as { detail?: unknown }).detail ?? maybeEnvelope.detail;
    const normalizedDetail = this.normalizeDetail(detailValue);

    const message =
      typeof nested.message === 'string'
        ? nested.message
        : typeof maybeEnvelope.message === 'string'
          ? maybeEnvelope.message
          : normalizedDetail.message;

    const detailsSource = nested.details ?? nested.errors ?? maybeEnvelope.details ?? maybeEnvelope.errors;
    const normalizedDetails = this.normalizeDetails(detailsSource) ?? normalizedDetail.details;

    return {
      code,
      message,
      details: normalizedDetails
    };
  }

  private normalizeDetail(detail: unknown): {
    message?: string;
    details?: Record<string, string[]>;
  } {
    if (!detail) {
      return {};
    }

    if (typeof detail === 'string') {
      return { message: detail };
    }

    if (Array.isArray(detail)) {
      const aggregated = detail.reduce<Record<string, string[]>>((accumulator, item) => {
        if (!item || typeof item !== 'object') {
          return accumulator;
        }

        const record = item as { loc?: unknown; msg?: unknown; message?: unknown };
        const message =
          typeof record.msg === 'string'
            ? record.msg
            : typeof record.message === 'string'
              ? record.message
              : undefined;

        if (!message) {
          return accumulator;
        }

        const field = this.extractDetailField(record.loc) ?? 'detail';
        if (!accumulator[field]) {
          accumulator[field] = [];
        }
        accumulator[field].push(message);
        return accumulator;
      }, {});

      return Object.keys(aggregated).length ? { details: aggregated } : {};
    }

    if (typeof detail === 'object') {
      const record = detail as { loc?: unknown; msg?: unknown; message?: unknown };
      const message =
        typeof record.msg === 'string'
          ? record.msg
          : typeof record.message === 'string'
            ? record.message
            : undefined;

      const field = this.extractDetailField(record.loc);
      if (field && message) {
        return { details: { [field]: [message] } };
      }

      if (message) {
        return { message };
      }
    }

    return {};
  }

  private extractDetailField(loc: unknown): string | null {
    if (typeof loc === 'string' && loc.length) {
      return loc;
    }

    if (Array.isArray(loc) && loc.length) {
      const candidate = loc[loc.length - 1];
      if (typeof candidate === 'string' && candidate.length) {
        return candidate;
      }
    }

    return null;
  }

  private normalizeDetails(details: Record<string, unknown> | undefined): Record<string, string[]> | undefined {
    if (!details || typeof details !== 'object') {
      return undefined;
    }

    const entries = Object.entries(details).reduce<Record<string, string[]>>(
      (accumulator, [key, value]) => {
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
      },
      {}
    );

    return Object.keys(entries).length ? entries : undefined;
  }
}
