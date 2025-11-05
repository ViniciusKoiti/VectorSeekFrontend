import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { AUTH_API_ENDPOINTS } from './auth.api';
import { AuthError, LoginRequest, RegisterRequest, RequestMagicLinkRequest } from './auth.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should map login responses to session models', () => {
    const payload: LoginRequest = { email: 'john@example.com', password: 'StrongPassword!23' };

    service.login(payload).subscribe((response) => {
      expect(response).toEqual({
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer'
        },
        user: {
          id: 'user-123',
          email: 'john@example.com',
          fullName: 'John Connor',
          avatarUrl: 'https://cdn.vectorseek.ai/avatar.png'
        }
      });
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush({
      data: {
        tokens: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        },
        user: {
          id: 'user-123',
          email: 'john@example.com',
          full_name: 'John Connor',
          avatar_url: 'https://cdn.vectorseek.ai/avatar.png'
        }
      }
    });
  });

  it('should convert 401 errors on login into friendly payloads', () => {
    const payload: LoginRequest = { email: 'john@example.com', password: 'invalid' };

    service.login(payload).subscribe({
      next: () => fail('Expected login request to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(401);
        expect(error.summary).toBe('Credenciais inválidas');
        expect(error.description).toContain('Verifique e-mail');
        expect(error.code).toBe('AUTH_INVALID');
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    request.flush(
      {
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid credentials provided'
        }
      },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should expose retry-after metadata for throttled magic link requests', () => {
    const payload: RequestMagicLinkRequest = { email: 'john@example.com' };

    service.requestMagicLink(payload).subscribe({
      next: () => fail('Expected request to fail'),
      error: (error: AuthError) => {
        expect(error.status).toBe(429);
        expect(error.summary).toBe('Muitas solicitações');
        expect(error.retryAfterSeconds).toBe(120);
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.requestMagicLink());
    request.flush(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many attempts'
        }
      },
      { status: 429, statusText: 'Too Many Requests', headers: new HttpHeaders({ 'Retry-After': '120' }) }
    );
  });

  it('should map validation errors on register', () => {
    const payload: RegisterRequest = {
      fullName: 'John Connor',
      email: 'john@example.com',
      password: 'weak',
      acceptTerms: false
    };

    service.register(payload).subscribe({
      next: () => fail('Expected register request to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(422);
        expect(error.summary).toBe('Dados inválidos');
        expect(error.fieldErrors).toEqual({
          password: ['A senha deve conter ao menos 12 caracteres.'],
          acceptTerms: ['É necessário aceitar os termos de uso.']
        });
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.register());
    request.flush(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: {
            password: ['A senha deve conter ao menos 12 caracteres.'],
            acceptTerms: ['É necessário aceitar os termos de uso.']
          }
        }
      },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });

  it('should successfully register a new user', () => {
    const payload: RegisterRequest = {
      fullName: 'John Connor',
      email: 'john@example.com',
      password: 'StrongPassword!23',
      acceptTerms: true
    };

    service.register(payload).subscribe((response) => {
      expect(response.user.email).toBe('john@example.com');
      expect(response.user.fullName).toBe('John Connor');
      expect(response.tokens.accessToken).toBeTruthy();
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.register());
    expect(request.request.method).toBe('POST');

    request.flush({
      data: {
        tokens: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        },
        user: {
          id: 'user-456',
          email: 'john@example.com',
          full_name: 'John Connor',
          avatar_url: null
        }
      }
    });
  });

  it('should successfully request magic link', () => {
    const payload: RequestMagicLinkRequest = {
      email: 'john@example.com'
    };

    service.requestMagicLink(payload).subscribe((response) => {
      expect(response.message).toBe('Magic link sent to your email');
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.requestMagicLink());
    expect(request.request.method).toBe('POST');

    request.flush({
      data: {
        message: 'Magic link sent to your email'
      }
    });
  });

  it('should successfully refresh tokens', () => {
    const payload = { refreshToken: 'old-refresh-token' };

    service.refresh(payload).subscribe((response) => {
      expect(response.accessToken).toBe('new-access-token');
      expect(response.refreshToken).toBe('new-refresh-token');
      expect(response.expiresIn).toBe(3600);
      expect(response.tokenType).toBe('Bearer');
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.refresh());
    expect(request.request.method).toBe('POST');

    request.flush({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer'
      }
    });
  });

  it('should handle refresh token errors', () => {
    const payload = { refreshToken: 'invalid-token' };

    service.refresh(payload).subscribe({
      next: () => fail('Expected refresh to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(401);
        expect(error.summary).toBe('Sessão inválida');
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.refresh());
    request.flush(
      { error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should successfully fetch user profile', () => {
    service.me().subscribe((response) => {
      expect(response.id).toBe('user-123');
      expect(response.email).toBe('john@example.com');
      expect(response.fullName).toBe('John Connor');
      expect(response.avatarUrl).toBe('https://cdn.vectorseek.ai/avatar.png');
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.me());
    expect(request.request.method).toBe('GET');

    request.flush({
      data: {
        id: 'user-123',
        email: 'john@example.com',
        full_name: 'John Connor',
        avatar_url: 'https://cdn.vectorseek.ai/avatar.png'
      }
    });
  });

  it('should handle profile fetch errors', () => {
    service.me().subscribe({
      next: () => fail('Expected me() to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(401);
        expect(error.summary).toBe('Sessão inválida');
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.me());
    request.flush(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should handle network errors gracefully', () => {
    const payload: LoginRequest = { email: 'john@example.com', password: 'password' };

    service.login(payload).subscribe({
      next: () => fail('Expected login to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(0);
        expect(error.code).toBe('unexpected_error');
        expect(error.summary).toBe('Não foi possível entrar agora');
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    request.error(new ProgressEvent('network error'));
  });

  it('should handle 429 with date-based Retry-After header', () => {
    const payload: LoginRequest = { email: 'john@example.com', password: 'password' };
    const futureDate = new Date(Date.now() + 60000).toUTCString(); // 60s no futuro

    service.login(payload).subscribe({
      next: () => fail('Expected login to fail'),
      error: (error: AuthError) => {
        expect(error.status).toBe(429);
        expect(error.retryAfterSeconds).toBeGreaterThan(50);
        expect(error.retryAfterSeconds).toBeLessThan(65);
      }
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    request.flush(
      { error: { code: 'RATE_LIMITED' } },
      { status: 429, statusText: 'Too Many Requests', headers: new HttpHeaders({ 'Retry-After': futureDate }) }
    );
  });

  it('should handle avatar_url as null', () => {
    const payload: LoginRequest = { email: 'john@example.com', password: 'password' };

    service.login(payload).subscribe((response) => {
      expect(response.user.avatarUrl).toBeNull();
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    request.flush({
      data: {
        tokens: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'Bearer'
        },
        user: {
          id: 'user-123',
          email: 'john@example.com',
          full_name: 'John Connor',
          avatar_url: null
        }
      }
    });
  });
});
