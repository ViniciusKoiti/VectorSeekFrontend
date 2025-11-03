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
      imports: [HttpClientTestingModule],
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
          tokenType: 'Bearer',
        },
        user: {
          id: 'user-123',
          email: 'john@example.com',
          fullName: 'John Connor',
          avatarUrl: 'https://cdn.vectorseek.ai/avatar.png',
        },
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
          token_type: 'Bearer',
        },
        user: {
          id: 'user-123',
          email: 'john@example.com',
          full_name: 'John Connor',
          avatar_url: 'https://cdn.vectorseek.ai/avatar.png',
        },
      },
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
      },
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    request.flush(
      {
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid credentials provided',
        },
      },
      { status: 401, statusText: 'Unauthorized' },
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
      },
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.requestMagicLink());
    request.flush(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many attempts',
        },
      },
      { status: 429, statusText: 'Too Many Requests', headers: new HttpHeaders({ 'Retry-After': '120' }) },
    );
  });

  it('should map validation errors on register', () => {
    const payload: RegisterRequest = {
      fullName: 'John Connor',
      email: 'john@example.com',
      password: 'weak',
      acceptTerms: false,
    };

    service.register(payload).subscribe({
      next: () => fail('Expected register request to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(422);
        expect(error.summary).toBe('Dados inválidos');
        expect(error.fieldErrors).toEqual({
          password: ['A senha deve conter ao menos 12 caracteres.'],
          acceptTerms: ['É necessário aceitar os termos de uso.'],
        });
      },
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.register());
    request.flush(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: {
            password: ['A senha deve conter ao menos 12 caracteres.'],
            acceptTerms: ['É necessário aceitar os termos de uso.'],
          },
        },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
  });
});
