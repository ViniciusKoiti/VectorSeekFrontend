import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

import { AuthStore } from '../../../libs/state/src/lib/auth/auth.store';
import { AuthService } from '../../../libs/data-access/src/lib/auth/auth.service';
import { environment } from '../../environments/environment';

interface OAuthCallbackRequest {
  code: string;
  state: string;
  provider: 'google';
}

interface OAuthCallbackResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    provider: string;
    provider_id: string;
  };
}

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="oauth-callback-container">
      <div class="callback-content">
        
        <!-- Loading State -->
        <div class="callback-state" *ngIf="isProcessing">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <h2>{{ 'auth.oauth.processing_title' | translate }}</h2>
          <p>{{ 'auth.oauth.processing_message' | translate }}</p>
        </div>

        <!-- Success State -->
        <div class="callback-state success" *ngIf="isSuccess">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="2"/>
              <path d="M8 12l3 3 5-5" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>{{ 'auth.oauth.success_title' | translate }}</h2>
          <p>{{ 'auth.oauth.success_message' | translate }}</p>
        </div>

        <!-- Error State -->
        <div class="callback-state error" *ngIf="error">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
              <path d="M15 9l-6 6m0-6l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2>{{ 'auth.oauth.error_title' | translate }}</h2>
          <p>{{ getErrorMessage() }}</p>
          
          <div class="error-actions">
            <button class="btn-secondary" (click)="retryAuth()">
              {{ 'auth.oauth.retry_button' | translate }}
            </button>
            <button class="btn-primary" (click)="goToLogin()">
              {{ 'auth.oauth.back_to_login' | translate }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .oauth-callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--background-primary);
    }

    .callback-content {
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    .callback-state {
      background: var(--background-surface);
      border: 1px solid var(--border-color, #e1e5e9);
      border-radius: 1rem;
      padding: 3rem 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .callback-state.success {
      border-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .callback-state.error {
      border-color: #ef4444;
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    }

    .loading-spinner {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4285f4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-icon,
    .error-icon {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }

    h2 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
      font-size: 1.5rem;
      font-weight: 600;
    }

    p {
      margin: 0 0 2rem 0;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #4285f4;
      color: white;
    }

    .btn-primary:hover {
      background: #3367d6;
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--background-hover);
    }

    /* Dark mode */
    [data-theme="dark"] .callback-state {
      background: var(--background-surface-dark);
      border-color: var(--border-color-dark);
    }

    [data-theme="dark"] .callback-state.success {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
    }

    [data-theme="dark"] .callback-state.error {
      background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
    }

    [data-theme="dark"] .spinner {
      border-color: #444;
      border-top-color: #4285f4;
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);

  isProcessing = true;
  isSuccess = false;
  error: string | null = null;

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private async handleOAuthCallback(): Promise<void> {
    try {
      this.isProcessing = true;

      // Extrair parâmetros da URL
      const urlParams = this.route.snapshot.queryParams;
      const { code, state, error: oauthError } = urlParams;

      // Verificar se houve erro no OAuth
      if (oauthError) {
        throw new Error(`OAUTH_PROVIDER_ERROR_${oauthError.toUpperCase()}`);
      }

      // Validar parâmetros obrigatórios
      if (!code) {
        throw new Error('OAUTH_MISSING_CODE');
      }

      if (!state) {
        throw new Error('OAUTH_MISSING_STATE');
      }

      // Processar callback com backend
      const authData = await this.processCallback({
        code,
        state,
        provider: 'google'
      });

      // Atualizar estado da aplicação
      this.authStore.setSession({
        raw: {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token
        }
      });

      this.authStore.setUser({
        id: authData.user.id,
        email: authData.user.email,
        fullName: authData.user.name,
        avatarUrl: authData.user.avatar_url
      });

      // Marcar como sucesso
      this.isProcessing = false;
      this.isSuccess = true;

      // Redirecionar após 2 segundos
      setTimeout(() => {
        this.router.navigate(['/app/qna']);
      }, 2000);

    } catch (err: any) {
      this.isProcessing = false;
      this.error = err?.message || 'OAUTH_UNKNOWN_ERROR';
      console.error('OAuth callback error:', err);
    }
  }

  private processCallback(request: OAuthCallbackRequest): Promise<OAuthCallbackResponse> {
    const endpoint = `${environment.apiUrl}/api/auth/oauth/google/callback`;
    
    return this.http.post<OAuthCallbackResponse>(endpoint, request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('OAuth callback request failed:', error);
        return throwError(() => this.mapCallbackError(error));
      })
    ).toPromise() as Promise<OAuthCallbackResponse>;
  }

  private mapCallbackError(error: HttpErrorResponse): Error {
    switch (error.status) {
      case 400:
        return new Error('OAUTH_INVALID_REQUEST');
      case 401:
        return new Error('OAUTH_INVALID_CREDENTIALS');
      case 403:
        return new Error('OAUTH_ACCESS_DENIED');
      case 429:
        return new Error('OAUTH_RATE_LIMITED');
      case 500:
      case 502:
      case 503:
        return new Error('OAUTH_SERVER_ERROR');
      default:
        return new Error('OAUTH_NETWORK_ERROR');
    }
  }

  getErrorMessage(): string {
    if (!this.error) return '';

    const errorMap: Record<string, string> = {
      'OAUTH_PROVIDER_ERROR_ACCESS_DENIED': 'auth.oauth.error.access_denied',
      'OAUTH_PROVIDER_ERROR_INVALID_REQUEST': 'auth.oauth.error.invalid_request',
      'OAUTH_MISSING_CODE': 'auth.oauth.error.missing_code',
      'OAUTH_MISSING_STATE': 'auth.oauth.error.missing_state',
      'OAUTH_INVALID_REQUEST': 'auth.oauth.error.invalid_request',
      'OAUTH_INVALID_CREDENTIALS': 'auth.oauth.error.invalid_credentials',
      'OAUTH_ACCESS_DENIED': 'auth.oauth.error.access_denied',
      'OAUTH_RATE_LIMITED': 'auth.oauth.error.rate_limited',
      'OAUTH_SERVER_ERROR': 'auth.oauth.error.server_error',
      'OAUTH_NETWORK_ERROR': 'auth.oauth.error.network_error',
      'OAUTH_UNKNOWN_ERROR': 'auth.oauth.error.unknown'
    };

    return errorMap[this.error] || 'auth.oauth.error.unknown';
  }

  retryAuth(): void {
    // Tentar novamente redirecionando para login
    this.router.navigate(['/auth/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}