import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { AUTH_API_ENDPOINTS } from './auth.api';
import {
  AuthError,
  LoginRequest,
  PlanType,
  RegisterRequest,
  RequestMagicLinkRequest,
  AuthApiSessionDto
} from './auth.models';
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
    const apiResponse: AuthApiSessionDto = {
      user_id: 'user-123',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_type: 'Bearer',
      expires_in: 3600
    };

    service.login(payload).subscribe((response) => {
      expect(response.raw).toEqual(apiResponse);
      expect(response.raw?.access_token).toBe('access-token');
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.login());
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush(apiResponse);
  });

  it('should convert 401 errors on login into friendly payloads', () => {
    const payload: LoginRequest = { email: 'john@example.com', password: 'invalid' };

    service.login(payload).subscribe({
      next: () => fail('Expected login request to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(401);
        expect(error.summary).toBe('auth.apiErrors.login.401.summary');
        expect(error.description).toBe('auth.apiErrors.login.401.description');
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
        expect(error.summary).toBe('auth.apiErrors.requestMagicLink.429.summary');
        expect(error.description).toBe('auth.apiErrors.requestMagicLink.429.description');
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
      email: 'john@example.com',
      password: 'weak',
      full_name: 'John Connor',
      plan: PlanType.FREE,
      acceptTerms: false
    };

    service.register(payload).subscribe({
      next: () => fail('Expected register request to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(422);
        expect(error.summary).toBe('auth.apiErrors.register.VALIDATION_FAILED.summary');
        expect(error.description).toBe('auth.apiErrors.register.VALIDATION_FAILED.description');
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
      email: 'john@example.com',
      password: 'StrongPassword!23',
      full_name: 'John Connor',
      plan: PlanType.FREE,
      acceptTerms: true
    };

    const apiResponse: AuthApiSessionDto = {
      user_id: 'user-456',
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    };

    service.register(payload).subscribe((response) => {
      expect(response.raw).toEqual(apiResponse);
      expect(response.raw?.user_id).toBe('user-456');
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.register());
    expect(request.request.method).toBe('POST');

    request.flush(apiResponse);
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

    request.flush({ message: 'Magic link sent to your email' });
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
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    });
  });

  it('should handle refresh token errors', () => {
    const payload = { refreshToken: 'invalid-token' };

    service.refresh(payload).subscribe({
      next: () => fail('Expected refresh to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(401);
        expect(error.summary).toBe('auth.apiErrors.refresh.401.summary');
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
      id: 'user-123',
      email: 'john@example.com',
      full_name: 'John Connor',
      avatar_url: 'https://cdn.vectorseek.ai/avatar.png'
    });
  });

  it('should handle profile fetch errors', () => {
    service.me().subscribe({
      next: () => fail('Expected me() to error'),
      error: (error: AuthError) => {
        expect(error.status).toBe(401);
        expect(error.summary).toBe('auth.apiErrors.me.401.summary');
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
        expect(error.summary).toBe('auth.apiErrors.login.default.summary');
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

  it('should handle avatar_url as null when fetching profile', () => {
    service.me().subscribe((response) => {
      expect(response.avatarUrl).toBeNull();
    });

    const request = httpMock.expectOne(AUTH_API_ENDPOINTS.me());
    request.flush({
      id: 'user-123',
      email: 'john@example.com',
      full_name: 'John Connor',
      avatar_url: null
    });
  });
});
